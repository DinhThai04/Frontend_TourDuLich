import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button, Input, Spin, Tooltip } from 'antd';
import { SendOutlined, MinusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { aiErrorText } from '../../services/aiServices';
import { formatDate } from '@/utils';
import { useAiConversation } from './AiConversationContext';
import AiResults from './AiResults';
import logo from '../../assets/branding/sgu-tour-icon.svg';
import '../../layouts/css/ChatbotWidget.css';

export default function ChatbotPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [input, setInput] = useState('');
  const [, tick] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const conversation = useAiConversation();
  const view = useSyncExternalStore(conversation.subscribe, conversation.getSnapshot);
  useEffect(() => () => conversation.pause(), [conversation]);
  useEffect(() => {
    setInput('');
  }, [view.session?.conversationId]);
  useEffect(() => {
    const body = bodyRef.current;
    if (isOpen && body)
      body.scrollTo({
        top: body.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }, [isOpen, view.messages, view.busy, view.error]);
  useEffect(() => {
    if (view.retryAt <= Date.now()) return;
    const timer = window.setTimeout(
      () => tick((value) => value + 1),
      Math.min(301000, view.retryAt - Date.now() + 50)
    );
    return () => window.clearTimeout(timer);
  }, [view.retryAt]);
  const tooLong = [...input.trim()].length > 2000;
  const blocked = view.busy || view.expired || (!!view.pending && view.retryable);
  const send = (text = input) => {
    if (blocked || !text.trim() || [...text.trim()].length > 2000) return;
    setInput('');
    void conversation.send(text);
  };
  return (
    <section className="chatbot-floating-container" role="dialog" aria-label="Trợ lý SGU Tour">
      <div className="chatbot-header">
        <img src={logo} alt="" />
        <div className="chatbot-heading">
          <strong>Trợ lý SGU Tour</strong>
          <small>Tư vấn tour, giá tham khảo và lịch trình</small>
        </div>
        <Tooltip title="Bắt đầu chat mới">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            aria-label="Bắt đầu chat mới"
            onClick={() => {
              setInput('');
              void conversation.newChat();
            }}
          />
        </Tooltip>
        <Button
          type="text"
          icon={<MinusOutlined />}
          aria-label="Thu nhỏ trợ lý"
          onClick={() => onClose()}
        />
      </div>
      <div
        ref={bodyRef}
        className="chatbot-body"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={view.busy}
      >
        {view.messages.map((message) => (
          <div key={message.id} className={`chat-row chat-row-${message.role}`}>
            <div className={`chat-bubble chat-bubble-${message.role}`}>
              <span className="chat-sender">{message.role === 'user' ? 'Bạn' : 'SGU Tour'}</span>
              <p className="chat-text">{message.text}</p>
              {message.result && (
                <AiResults result={message.result} onSuggest={send} disabled={blocked} />
              )}
              {message.bookingHelp && (
                <div className="ai-booking-help">
                  <div className="ai-suggestions">
                    {message.bookingHelp.choices.map((choice) => (
                      <button
                        key={choice.bookingId}
                        className="ai-suggestion"
                        disabled={blocked}
                        onClick={() =>
                          send(
                            `Tra cứu booking #${choice.bookingId}: tôi còn bao lâu để thanh toán?`
                          )
                        }
                      >
                        #{choice.bookingId} · {choice.tourTitle}
                        {choice.departureAt
                          ? ` · ${formatDate(choice.departureAt)}`
                          : ''}
                      </button>
                    ))}
                  </div>
                  <Link to="/profile">Lịch sử đặt tour</Link> ·{' '}
                  <Link to="/policies">Chính sách</Link>
                  {message.bookingHelp.policy && (
                    <small className="ai-policy-source">
                      {message.bookingHelp.policy.sourceLabel} ·{' '}
                      {message.bookingHelp.policy.policyVersion}
                    </small>
                  )}
                </div>
              )}
              <small className="chat-time">{message.time}</small>
            </div>
          </div>
        ))}
        {view.busy && (
          <div className="chat-loading">
            <Spin size="small" />
            <span>Đang xử lý yêu cầu…</span>
          </div>
        )}
        {view.error && (
          <div className="ai-error" role="alert">
            <p>{aiErrorText(view.error)}</p>
            {view.retryable && view.pending && (
              <Button
                size="small"
                onClick={() => void conversation.retry()}
                disabled={view.busy || Date.now() < view.retryAt}
              >
                Thử lại tin này
              </Button>
            )}
            <Link to="/tours">Tìm tour trên website</Link>
          </div>
        )}
      </div>
      <div className="chatbot-footer">
        <Input.TextArea
          aria-label="Tin nhắn tư vấn tour"
          value={input}
          disabled={blocked}
          maxLength={2000}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Bạn muốn đi đâu, ngân sách bao nhiêu?"
          autoSize={{ minRows: 1, maxRows: 3 }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          aria-label="Gửi tin nhắn"
          onClick={() => send()}
          disabled={blocked || !input.trim() || tooLong}
        />
      </div>
      <small className="ai-input-warning">
        <Link to="/policies">Chính sách SGU Tour</Link> · Không gửi mật khẩu, OTP hoặc thông tin
        thẻ.
      </small>
      {tooLong && <small className="ai-input-warning">Tối đa 2.000 ký tự cho mỗi tin nhắn.</small>}
    </section>
  );
}
