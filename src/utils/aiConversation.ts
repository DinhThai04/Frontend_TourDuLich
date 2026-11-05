import { AiClientError, decodeAiResult, decodeAiSession } from '../services/aiServices';
import { createClientKey } from './index';
import type { AiChatRequest, AiMessage, AiResult, AiSession, AiBookingHelp } from '../types/ai';

type Api = {
  create(signal?: AbortSignal): Promise<AiSession>;
  reset(id: string, signal?: AbortSignal): Promise<AiSession>;
  chat(body: AiChatRequest, signal?: AbortSignal): Promise<AiResult>;
  bookingHelp?(
    message: string,
    selectedBookingId: number | null,
    signal?: AbortSignal
  ): Promise<AiBookingHelp>;
};
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Pending = { requestId: string; message: string };
export type AiView = {
  messages: AiMessage[];
  busy: boolean;
  error: string | null;
  retryable: boolean;
  retryAt: number;
  expired: boolean;
  session: AiSession | null;
  pending: Pending | null;
};
export const AI_STORAGE_KEY = 'sgu-tour.ai.v1';
const greeting = (): AiMessage => ({
  id: 'hello',
  role: 'bot',
  text: 'Xin chào! Tôi là trợ lý SGU Tour. Bạn muốn đi đâu, ngân sách và thời gian dự kiến thế nào?',
  time: '',
});
const initial = (): AiView => ({
  messages: [greeting()],
  busy: false,
  error: null,
  retryable: false,
  retryAt: 0,
  expired: false,
  session: null,
  pending: null,
});

/** Public conversation state only. An epoch invalidates late replies across reset/account/unmount. */
export class AiConversation {
  private view = initial();
  private listeners = new Set<() => void>();
  private epoch = 0;
  private active: AbortController | null = null;
  private owner: string | null = null;
  private selectedBookingId: number | null = null;
  private readonly api: Api;
  private readonly storage: StoragePort | null;
  private readonly uuid: () => string;
  private readonly now: () => number;
  constructor(
    api: Api,
    storage: StoragePort | null,
    uuid: () => string = createClientKey,
    now: () => number = () => Date.now()
  ) {
    this.api = api;
    this.storage = storage;
    this.uuid = uuid;
    this.now = now;
  }
  getSnapshot = () => this.view;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(patch: Partial<AiView>) {
    this.view = { ...this.view, ...patch };
    this.view.messages = this.view.messages.slice(-20);
    this.persist();
    this.listeners.forEach((listener) => listener());
  }
  private forgetSaved() {
    try {
      this.storage?.removeItem(AI_STORAGE_KEY);
    } catch {
      /* private mode: RAM still works */
    }
  }
  private persist() {
    if (this.owner === null) return;
    // Authenticated chats may contain booking facts: RAM only, never browser storage.
    if (this.owner !== 'guest') {
      this.forgetSaved();
      return;
    }
    if (!this.view.session && !this.view.pending) {
      this.forgetSaved();
      return;
    }
    const saved = {
      version: 1,
      owner: this.owner,
      session: this.view.session,
      messages: this.view.messages.slice(-12),
      pending: this.view.pending,
    };
    let serialized = JSON.stringify(saved);
    while (new TextEncoder().encode(serialized).length > 64000 && saved.messages.length) {
      saved.messages.shift();
      serialized = JSON.stringify(saved);
    }
    try {
      this.storage?.setItem(AI_STORAGE_KEY, serialized);
    } catch {
      /* quota/private mode: RAM still works */
    }
  }
  setOwner(owner: string) {
    if (this.owner === owner) return;
    const firstMount = this.owner === null;
    const old = this.view.session;
    this.invalidate();
    this.owner = owner;
    this.selectedBookingId = null;
    this.view = initial();
    if (firstMount && owner === 'guest') {
      try {
        const raw = this.storage?.getItem(AI_STORAGE_KEY);
        if (raw && new TextEncoder().encode(raw).length <= 64000) {
          const saved = JSON.parse(raw);
          if (saved.version !== 1 || saved.owner !== owner) {
            if (saved.session) this.revoke(decodeAiSession(saved.session).conversationId);
          } else {
            const session = saved.session === null ? null : decodeAiSession(saved.session);
            if (session && Date.parse(session.expiresAt) <= this.now()) throw new Error('expired');
            if (!Array.isArray(saved.messages) || saved.messages.length > 12)
              throw new Error('snapshot');
            const messages: AiMessage[] = saved.messages.map((m: AiMessage) => {
              if (
                !m ||
                typeof m.id !== 'string' ||
                m.id.length > 100 ||
                !['bot', 'user'].includes(m.role) ||
                typeof m.text !== 'string' ||
                m.text.length > 6000 ||
                typeof m.time !== 'string' ||
                m.time.length > 20
              )
                throw new Error('snapshot');
              const result = m.result ? decodeAiResult(m.result) : undefined;
              if (
                result &&
                (!session ||
                  result.conversationId !== session.conversationId ||
                  result.turnVersion > session.turnVersion)
              )
                throw new Error('snapshot');
              return { id: m.id, role: m.role, text: m.text, time: m.time, result };
            });
            const pending: Pending | null = saved.pending;
            if (
              pending &&
              (typeof pending.message !== 'string' ||
                !pending.message.trim() ||
                [...pending.message].length > 2000 ||
                !/^[\da-f-]{36}$/i.test(pending.requestId))
            )
              throw new Error('snapshot');
            this.view = {
              ...initial(),
              session,
              messages: messages.length ? messages : [greeting()],
              pending,
              error: pending ? 'SESSION_PAUSED' : null,
              retryable: !!pending,
            };
          }
        }
      } catch {
        /* An invalid/expired snapshot is never sent to the server as state. */
      }
    } else if (old) this.revoke(old.conversationId);
    this.emit({});
  }
  private revoke(id: string) {
    // Reset invalidates the old capability even if its request is in flight. Network failure leaves it to server TTL.
    void this.api.reset(id).catch(() => {});
  }
  private invalidate() {
    this.epoch++;
    this.active?.abort();
    this.active = null;
  }
  pause() {
    const wasBusy = this.view.busy;
    this.invalidate();
    if (wasBusy)
      this.emit({
        busy: false,
        error: this.view.pending ? 'SESSION_PAUSED' : null,
        retryable: !!this.view.pending,
      });
  }
  async newChat() {
    this.selectedBookingId = null;
    const old = this.view.session;
    this.invalidate();
    const generation = this.epoch;
    this.view = initial();
    this.emit({ busy: true });
    this.active = new AbortController();
    try {
      const session = old
        ? await this.api.reset(old.conversationId, this.active.signal)
        : await this.api.create(this.active.signal);
      if (generation === this.epoch) this.emit({ session });
    } catch (error) {
      if (generation === this.epoch)
        this.emit({
          error:
            error instanceof AiClientError && error.type === 'CONVERSATION_EXPIRED'
              ? null
              : 'GATEWAY_UNAVAILABLE',
        });
    } finally {
      if (generation === this.epoch) {
        this.active = null;
        this.emit({ busy: false });
      }
    }
  }
  async send(text: string) {
    const message = text.trim();
    if (
      !message ||
      [...message].length > 2000 ||
      this.view.busy ||
      this.view.expired ||
      this.owner === null
    )
      return;
    // A pending uncertain response must be retried with the same ID, or discarded by starting a new chat.
    if (this.view.pending && this.view.retryable) return;
    const requestId = this.uuid();
    const time = new Date(this.now()).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.emit({
      pending: { requestId, message },
      messages: [...this.view.messages, { id: requestId, role: 'user', text: message, time }],
      error: null,
    });
    await this.run();
  }
  async retry() {
    if (
      !this.view.pending ||
      !this.view.retryable ||
      this.view.busy ||
      this.view.expired ||
      this.now() < this.view.retryAt
    )
      return;
    await this.run();
  }
  private async run() {
    const pending = this.view.pending;
    if (!pending) return;
    const generation = this.epoch;
    this.active = new AbortController();
    this.emit({ busy: true, error: null, retryable: false, retryAt: 0 });
    try {
      if (this.api.bookingHelp) {
        const help = await this.api.bookingHelp(
          pending.message,
          this.selectedBookingId,
          this.active.signal
        );
        if (generation !== this.epoch) return;
        if (help.handled) {
          this.selectedBookingId = help.selectedBookingId;
          const time = new Date(this.now()).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          this.emit({
            pending: null,
            error: null,
            retryable: false,
            messages: [
              ...this.view.messages,
              {
                id: `${pending.requestId}-answer`,
                role: 'bot',
                text: help.reply,
                time,
                bookingHelp: help,
              },
            ],
          });
          return;
        }
      }
      let session = this.view.session;
      if (session && Date.parse(session.expiresAt) <= this.now())
        throw new AiClientError('CONVERSATION_EXPIRED');
      if (!session) {
        session = await this.api.create(this.active.signal);
        if (generation !== this.epoch) return;
        this.emit({ session });
      }
      const result = await this.api.chat(
        { ...pending, conversationId: session.conversationId },
        this.active.signal
      );
      if (generation !== this.epoch || this.view.session?.conversationId !== result.conversationId)
        return;
      const currentVersion = this.view.session.turnVersion;
      if (result.turnVersion > currentVersion) {
        const time = new Date(this.now()).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        this.emit({
          session: {
            conversationId: result.conversationId,
            turnVersion: result.turnVersion,
            expiresAt: result.expiresAt,
          },
          messages: [
            ...this.view.messages,
            { id: `${pending.requestId}-answer`, role: 'bot', text: result.reply, time, result },
          ],
        });
      }
      this.emit({ pending: null, error: null, retryable: false });
    } catch (error) {
      if (generation !== this.epoch) return;
      const failure =
        error instanceof AiClientError ? error : new AiClientError('NETWORK_ERROR', true);
      const expired = failure.type === 'CONVERSATION_EXPIRED';
      const conflict = failure.type === 'REQUEST_ID_CONFLICT';
      const rejected = failure.type === 'AI_SCOPE_REJECTED' || failure.type === 'INVALID_REQUEST';
      this.emit({
        error: failure.type,
        retryable: failure.retryable && !expired && !conflict && !rejected,
        retryAt: this.now() + failure.retryAfterSeconds * 1000,
        expired: expired || conflict,
        session: expired ? null : this.view.session,
        pending: expired || rejected ? null : pending,
        ...(rejected ? { messages: this.view.messages.map(message => message.id === pending.requestId
          ? { ...message, text: '[Nội dung không hợp lệ hoặc ngoài phạm vi đã được loại bỏ]' } : message) } : {}),
      });
    } finally {
      if (generation === this.epoch) {
        this.active = null;
        this.emit({ busy: false });
      }
    }
  }
}
