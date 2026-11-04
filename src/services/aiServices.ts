import type {
  AiChatRequest,
  AiResult,
  AiSession,
  AiBookingHelp,
  AiPolicyDocument,
} from '../types/ai';

export class AiClientError extends Error {
  readonly type: string;
  readonly retryable: boolean;
  readonly retryAfterSeconds: number;
  constructor(type: string, retryable = false, retryAfterSeconds = 0) {
    super(type);
    this.name = 'AiClientError';
    this.type = type;
    this.retryable = retryable;
    this.retryAfterSeconds = Math.min(300, Math.max(0, retryAfterSeconds));
  }
}
const invalid = () => new AiClientError('INVALID_RESPONSE', true);
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const text = (value: unknown, max = 6000): string => {
  if (typeof value !== 'string' || [...value].length > max) throw invalid();
  return value;
};
const number = (value: unknown, min = 0): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min) throw invalid();
  return value;
};
const bool = (value: unknown): boolean => {
  if (typeof value !== 'boolean') throw invalid();
  return value;
};
const list = (value: unknown, max: number): unknown[] => {
  if (!Array.isArray(value) || value.length > max) throw invalid();
  return value;
};
const nullable = <T>(value: unknown, parse: (value: unknown) => T): T | null =>
  value === null ? null : parse(value);
const timestamp = (value: unknown): string => {
  const result = text(value, 80);
  if (!Number.isFinite(Date.parse(result))) throw invalid();
  return result;
};
const choice = <T extends string>(value: unknown, options: readonly T[]): T => {
  if (!options.includes(value as T)) throw invalid();
  return value as T;
};
export function decodeAiSession(value: unknown): AiSession {
  const data = object(value);
  const id = text(data.conversationId, 43);
  if (!/^[A-Za-z0-9_-]{43}$/.test(id)) throw invalid();
  return {
    conversationId: id,
    turnVersion: number(data.turnVersion),
    expiresAt: timestamp(data.expiresAt),
  };
}
export function decodeAiResult(value: unknown): AiResult {
  const data = object(value);
  const criteria = object(data.criteria);
  const requestId = text(data.requestId, 36);
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(requestId))
    throw invalid();
  const result: AiResult = {
    ...decodeAiSession(data),
    requestId,
    status: choice(data.status, [
      'RESULTS',
      'CLARIFICATION',
      'NO_RESULTS',
      'ANSWER',
      'OUT_OF_SCOPE',
    ] as const),
    reply: text(data.reply),
    criteria: {
      region: nullable(criteria.region, (v) => choice(v, ['NORTH', 'CENTRAL', 'SOUTH'] as const)),
      destinationId: nullable(criteria.destinationId, (v) => number(v, 1)),
      originId: nullable(criteria.originId, (v) => number(v, 1)),
      maxBudgetVnd: nullable(criteria.maxBudgetVnd, number),
      budgetScope: nullable(criteria.budgetScope, (v) =>
        choice(v, ['PER_ADULT', 'TOTAL_GROUP'] as const)
      ),
      departureFrom: nullable(criteria.departureFrom, (v) => text(v, 10)),
      departureTo: nullable(criteria.departureTo, (v) => text(v, 10)),
      party: nullable(criteria.party, (v) => {
        const p = object(v);
        return {
          adults: nullable(p.adults, number),
          children: nullable(p.children, number),
          toddlers: nullable(p.toddlers, number),
          infants: nullable(p.infants, number),
          unclassifiedChildren: nullable(p.unclassifiedChildren, number),
        };
      }),
      searchMode: choice(criteria.searchMode, ['BOOKABLE', 'CATALOG'] as const),
    },
    tours: list(data.tours, 5).map((v) => {
      const c = object(v);
      const p = object(c.price);
      const a = object(c.availability);
      const id = number(c.tourId, 1);
      return {
        tourId: id,
        tourProgram: text(c.tourProgram, 120),
        title: text(c.title, 400),
        destinationName: text(c.destinationName, 120),
        region: text(c.region, 20),
        durationDays: number(c.durationDays, 1),
        imageUrl: nullable(c.imageUrl, (v) => text(v, 2048)),
        detailPath: `/tours/detail/${id}`,
        price: {
          amountVnd: number(p.amountVnd),
          currency: choice(p.currency, ['VND'] as const),
          basis: choice(p.basis, ['PER_ADULT', 'TOTAL_GROUP'] as const),
          isEstimate: bool(p.isEstimate),
          singleSupplementIncluded: bool(p.singleSupplementIncluded),
          checkedAt: timestamp(p.checkedAt),
        },
        availability: {
          status: text(a.status, 80),
          departureId: nullable(a.departureId, (v) => number(v, 1)),
          departureAt: nullable(a.departureAt, timestamp),
          availableSeats: nullable(a.availableSeats, number),
          checkedAt: timestamp(a.checkedAt),
        },
      };
    }),
    clarification: nullable(data.clarification, (v) => {
      const c = object(v);
      return {
        reason: text(c.reason, 100),
        fields: list(c.fields, 20).map((v) => text(v, 100)),
        question: text(c.question, 2000),
        suggestedReplies: list(c.suggestedReplies, 8).map((v) => text(v, 200)),
      };
    }),
    detail: nullable(data.detail, (v) => {
      const d = object(v);
      return {
        tourId: number(d.tourId, 1),
        title: text(d.title, 400),
        dataAsOf: timestamp(d.dataAsOf),
        truncated: bool(d.truncated),
        itinerary: list(d.itinerary, 30).map((v) => {
          const day = object(v);
          return {
            dayNumber: number(day.dayNumber, 1),
            title: text(day.title, 120),
            description: text(day.description),
            meal: text(day.meal, 80),
          };
        }),
      };
    }),
    comparison: nullable(data.comparison, (v) => {
      const c = object(v);
      return {
        tourIds: list(c.tourIds, 3).map((v) => number(v, 1)),
        dataAsOf: timestamp(c.dataAsOf),
        items: list(c.items, 3).map((v) => {
          const i = object(v);
          return {
            tourId: number(i.tourId, 1),
            title: text(i.title, 400),
            durationDays: number(i.durationDays, 1),
            destinationName: text(i.destinationName, 120),
            referenceAdultPriceVnd: number(i.referenceAdultPriceVnd),
            hasFutureDeparture: bool(i.hasFutureDeparture),
          };
        }),
      };
    }),
    policy: nullable(data.policy, (v) => {
      const p = object(v);
      return {
        policyKey: text(p.policyKey, 100),
        policyVersion: text(p.policyVersion, 100),
        sourceLabel: text(p.sourceLabel, 300),
      };
    }),
    searchSummary: nullable(data.searchSummary, (v) => {
      const s = object(v);
      return {
        returnedCount: number(s.returnedCount),
        hasMore: bool(s.hasMore),
        matchingCatalogCount: number(s.matchingCatalogCount),
        matchingBookableCount: number(s.matchingBookableCount),
        dataAsOf: timestamp(s.dataAsOf),
      };
    }),
  };
  const payloads = [result.detail, result.comparison, result.policy].filter(Boolean).length;
  if (
    (result.status === 'ANSWER' ? payloads !== 1 : payloads !== 0) ||
    (result.status === 'ANSWER' && result.tours.length)
  )
    throw invalid();
  return result;
}

export const safeAiImage = (value: string | null): string | undefined => {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === '443')
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};

export class AiClient {
  private readonly baseUrl: string;
  private readonly transport: typeof fetch;
  private readonly timeoutMs: number;
  private readonly getToken: () => string | null;
  private readonly refreshToken?: (staleToken: string) => Promise<string | null>;
  constructor(
    baseUrl: string,
    transport: typeof fetch = (input, init) => fetch(input, init),
    timeoutMs = 45000,
    getToken: () => string | null = () => null,
    refreshToken?: (staleToken: string) => Promise<string | null>
  ) {
    this.baseUrl = baseUrl;
    this.transport = transport;
    this.timeoutMs = timeoutMs;
    this.getToken = getToken;
    this.refreshToken = refreshToken;
  }
  private async post(
    path: string,
    body: object | null,
    signal?: AbortSignal,
    authorization?: string
  ): Promise<unknown> {
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.transport(`${this.baseUrl.replace(/\/$/, '')}/ai${path}`, {
        method: body === null ? 'GET' : 'POST',
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}),
        },
        body: body === null ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      // Bound before decoding, including chunked gateway error pages. Never surface upstream HTML/body.
      const reader = response.body?.getReader();
      let bytes = 0;
      const chunks: Uint8Array[] = [];
      if (reader) {
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            bytes += part.value.byteLength;
            if (bytes > 131072) {
              await reader.cancel();
              throw invalid();
            }
            chunks.push(part.value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      const buffer = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(new TextDecoder().decode(buffer));
      } catch {
        parsed = null;
      }
      if (!response.ok) {
        let error: Record<string, unknown> = {};
        try {
          error = object(object(parsed).error);
        } catch {
          /* gateway may return HTML */
        }
        const allowed = [
          'INVALID_REQUEST',
          'AI_SCOPE_REJECTED',
          'LOGIN_REQUIRED',
          'BOOKING_UNAVAILABLE',
          'POLICIES_UNAVAILABLE',
          'PAYLOAD_TOO_LARGE',
          'CONVERSATION_BUSY',
          'REQUEST_ID_CONFLICT',
          'CONVERSATION_EXPIRED',
          'AI_RATE_LIMITED',
          'AI_SESSION_LIMIT',
          'AI_QUOTA_EXHAUSTED',
          'AI_INPUT_TOO_LARGE',
          'AI_PROVIDER_NOT_CONFIGURED',
          'AI_PROVIDER_UNAVAILABLE',
          'AI_CAPACITY_REACHED',
          'CATALOG_UNAVAILABLE',
          'AI_TIMEOUT',
          'AI_INVALID_OUTPUT',
          'AI_INTERNAL_ERROR',
        ];
        const type =
          typeof error.type === 'string' && allowed.includes(error.type)
            ? error.type
            : response.status === 401 && path === '/booking-help'
              ? 'LOGIN_REQUIRED'
              : response.status === 410
                ? 'CONVERSATION_EXPIRED'
                : response.status === 429
                  ? 'AI_RATE_LIMITED'
                  : 'GATEWAY_UNAVAILABLE';
        const retryAfter = Number(
          error.retryAfterSeconds ?? response.headers.get('Retry-After') ?? 0
        );
        throw new AiClientError(
          type,
          typeof error.retryable === 'boolean'
            ? error.retryable
            : response.status >= 500 || response.status === 429 || response.status === 409,
          Number.isFinite(retryAfter) ? retryAfter : 0
        );
      }
      const envelope = object(parsed);
      if (envelope.code !== 1000) throw invalid();
      return envelope.result;
    } catch (error) {
      if (error instanceof AiClientError) throw error;
      if (signal?.aborted) throw new AiClientError('CANCELLED');
      throw new AiClientError(timedOut ? 'AI_TIMEOUT' : 'NETWORK_ERROR', true);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  async create(signal?: AbortSignal) {
    // The gateway hashes this bearer into the X-Ai-Owner session group key and strips the header
    // before ai_service, so an account is capped by its own open tabs instead of every user who
    // shares one exit IP. Chat, reset and policies keep running credential-free.
    return decodeAiSession(
      await this.post('/conversations', {}, signal, this.getToken() ?? undefined)
    );
  }
  async reset(conversationId: string, signal?: AbortSignal) {
    return decodeAiSession(await this.post('/conversations/reset', { conversationId }, signal));
  }
  async chat(request: AiChatRequest, signal?: AbortSignal) {
    const result = decodeAiResult(await this.post('/chat', request, signal));
    if (result.conversationId !== request.conversationId || result.requestId !== request.requestId)
      throw invalid();
    return result;
  }
  async bookingHelp(
    message: string,
    selectedBookingId: number | null,
    signal?: AbortSignal
  ): Promise<AiBookingHelp> {
    const body = { message, selectedBookingId };
    // Route without credentials first: public advice must not depend on auth-service availability.
    let data = object(await this.post('/booking-help', body, signal));
    if (bool(data.handled)) {
      const token = this.getToken();
      if (token) {
        try { data = object(await this.post('/booking-help', body, signal, token)); }
        catch (error) {
          if (!(error instanceof AiClientError) || error.type !== 'LOGIN_REQUIRED' || !this.refreshToken || signal?.aborted) throw error;
          let renewed: string | null;
          try { renewed = await this.refreshToken(token); }
          catch (refreshError) {
            if (signal?.aborted) throw new AiClientError('CANCELLED');
            if (refreshError instanceof AiClientError) throw refreshError;
            throw new AiClientError('NETWORK_ERROR', true);
          }
          if (signal?.aborted) throw new AiClientError('CANCELLED');
          if (!renewed || this.getToken() !== renewed) throw new AiClientError('LOGIN_REQUIRED');
          data = object(await this.post('/booking-help', body, signal, renewed)); // Retry authentication once only.
        }
      }
    }
    const policy = data.policy === null ? null : object(data.policy);
    return {
      handled: bool(data.handled),
      reply: text(data.reply),
      selectedBookingId: nullable(data.selectedBookingId, (v) => number(v, 1)),
      checkedAt: nullable(data.checkedAt, timestamp),
      policy: policy
        ? {
            policyKey: text(policy.policyKey, 30),
            policyVersion: text(policy.policyVersion, 100),
            sourceLabel: text(policy.sourceLabel, 300),
          }
        : null,
      choices: list(data.choices, 20).map((value) => {
        const item = object(value);
        return {
          bookingId: number(item.bookingId, 1),
          tourTitle: text(item.tourTitle, 400),
          departureAt: nullable(item.departureAt, timestamp),
          state: text(item.state, 40),
        };
      }),
    };
  }
  async policies(signal?: AbortSignal): Promise<AiPolicyDocument> {
    const data = object(await this.post('/policies', null, signal));
    return {
      version: text(data.version, 100),
      sourceLabel: text(data.sourceLabel, 300),
      effectiveDate: text(data.effectiveDate, 10),
      scope: text(data.scope, 1600),
      entries: list(data.entries, 40).map((value) => {
        const item = object(value);
        return {
          key: text(item.key, 30),
          title: text(item.title, 200),
          status: choice(item.status, ['SUPPORTED', 'PARTIAL', 'NOT_IMPLEMENTED'] as const),
          keywords: list(item.keywords, 20).map((v) => text(v, 150)),
          text: text(item.text, 1600),
        };
      }),
    };
  }
}

export function aiErrorText(type: string): string {
  const messages: Record<string, string> = {
    AI_INPUT_TOO_LARGE:
      'Nội dung và ngữ cảnh tư vấn quá dài. Bạn rút gọn câu hỏi hoặc chọn “Chat mới” nhé.',
    AI_SCOPE_REJECTED:
      'Trợ lý SGU Tour chỉ hỗ trợ tour, lịch trình và chính sách của website; không viết/chạy code, SQL hay truy cập nội bộ.',
    LOGIN_REQUIRED:
      'Bạn cần đăng nhập lại để tra cứu booking của chính mình. Tôi không lấy dữ liệu đơn khi chưa xác thực.',
    BOOKING_UNAVAILABLE:
      'Chưa kiểm tra được booking. Vui lòng thử lại sau hoặc mở Lịch sử đặt tour; tôi không đoán hạn thanh toán.',
    POLICIES_UNAVAILABLE: 'Chưa tải được chính sách. Vui lòng thử lại sau.',
    CONVERSATION_EXPIRED:
      'Phiên tư vấn đã hết hạn hoặc dịch vụ vừa khởi động lại. Chọn “Chat mới” để bắt đầu lại.',
    CONVERSATION_BUSY: 'Tin trước vẫn đang được xử lý. Hãy chờ một chút rồi thử lại tin này.',
    AI_RATE_LIMITED: 'Trợ lý vừa đạt giới hạn lượt hỏi. Bạn chờ một chút rồi thử lại nhé.',
    AI_SESSION_LIMIT:
      'Bạn đang mở quá 3 phiên tư vấn cùng lúc. Hãy đóng bớt các tab trợ lý hoặc chờ phiên cũ hết hạn rồi thử lại.',
    AI_CAPACITY_REACHED:
      'Trợ lý đang quá tải vì quá nhiều phiên mở cùng lúc. Bạn chờ một lát rồi thử lại; tìm tour bằng bộ lọc vẫn bình thường.',
    AI_QUOTA_EXHAUSTED:
      'Hạn mức tư vấn hiện đã hết. Bạn vẫn có thể tìm tour bằng bộ lọc trên website.',
    AI_PROVIDER_NOT_CONFIGURED: 'Trợ lý hiện chưa sẵn sàng. Bạn vẫn có thể tìm tour trên website.',
    CATALOG_UNAVAILABLE:
      'Chưa đọc được dữ liệu tour, giá hoặc lịch khởi hành. Bạn vui lòng thử lại sau.',
    AI_TIMEOUT:
      'Thời gian chờ đã hết. Bạn có thể thử lại chính tin nhắn này; không cần gửi thêm bản mới.',
    REQUEST_ID_CONFLICT: 'Tin nhắn này không thể thử lại. Chọn “Chat mới” để tiếp tục.',
    INVALID_REQUEST: 'Tin nhắn chưa hợp lệ. Bạn nhập lại nội dung, tối đa 2.000 ký tự nhé.',
    PAYLOAD_TOO_LARGE: 'Nội dung quá dài. Bạn rút gọn tin nhắn rồi gửi lại nhé.',
    SESSION_PAUSED: 'Tin nhắn bị gián đoạn khi rời trang. Bạn có thể thử lại chính tin này.',
  };
  return (
    messages[type] ||
    'Chưa kết nối được trợ lý. Bạn có thể thử lại hoặc tìm tour bằng bộ lọc trên website.'
  );
}
