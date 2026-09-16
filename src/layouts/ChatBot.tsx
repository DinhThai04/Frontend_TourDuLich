import React, { useState, useRef, useEffect } from 'react';
import { Card, Avatar, Input, Button, Typography, Space, Spin, Tooltip } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, MinusOutlined } from '@ant-design/icons';

import './css/ChatbotWidget.css';
import logoChatBot from '../assets/images/Slice 5.png';

const { Text } = Typography;
const { TextArea } = Input;

type Role = 'user' | 'bot';

interface ChatMessage {
  id: number;
  role: Role;
  text: string;
  time: string;
  isHtml?: boolean; // true nếu nội dung là HTML (từ field "data")
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false); // mở / thu nhỏ widget
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: 'Xin chào 👋, mình là trợ lý tour du lịch. Bạn muốn đi đâu, khi nào vậy ạ?',
      time: 'Now',
      isHtml: false,
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll xuống cuối khi có tin nhắn mới / mở widget
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const formatTime = () => {
    try {
      return new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Now';
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // push message user
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      time: formatTime(),
      isHtml: false,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5678/webhook/chatbot-tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const data: any = await res.json();

      // Backend có thể trả { reply: "text" } hoặc { data: "<div>HTML</div>" }
      let replyText = '';
      let isHtml = false;

      if (typeof data?.reply === 'string') {
        replyText = data.reply;
        isHtml = false;
      } else if (typeof data?.data === 'string') {
        replyText = data.data;
        isHtml = true;
      } else {
        replyText = 'Hiện tại hệ thống đang bận, bạn vui lòng thử lại sau giúp mình nhé 🙏';
        isHtml = false;
      }

      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'bot',
        text: replyText,
        time: formatTime(),
        isHtml,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: Date.now() + 2,
        role: 'bot',
        text: 'Có lỗi kết nối server, bạn vui lòng thử lại sau ạ 😥',
        time: formatTime(),
        isHtml: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 🔘 Nút bong bóng khi thu nhỏ
  if (!isOpen) {
    return (
      <div className="chatbot-toggle-container">
        <Tooltip title="Chat với trợ lý tour">
          <button className="chatbot-toggle-btn cursor-pointer" onClick={() => setIsOpen(true)}>
            <img
              src={logoChatBot}
              alt="Chatbot"
              className="chatbot-toggle-img"
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '2px solid #fff',
                objectFit: 'cover',
              }}
            />
          </button>
        </Tooltip>
      </div>
    );
  }

  // 🧠 Khung chat khi đang mở
  return (
    <div className="chatbot-floating-container">
      <Card className="chatbot-card" bodyStyle={{ padding: 0, height: '100%' }}>
        {/* Header */}
        <div className="chatbot-header">
          <Space align="center">
            <img
              src={logoChatBot}
              alt="Chatbot"
              className="chatbot-toggle-img"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid #fff',
                objectFit: 'cover',
              }}
            />
            <div>
              <div className="chatbot-title">Trợ lý tour du lịch</div>
              <div className="chatbot-subtitle">Online • Tư vấn trong vài giây</div>
            </div>
          </Space>
          <Button
            type="text"
            shape="circle"
            icon={<MinusOutlined />}
            onClick={() => setIsOpen(false)}
            className="chatbot-header-minimize"
          />
        </div>

        {/* Body - Messages */}
        <div className="chatbot-body">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`chat-row ${isUser ? 'chat-row-user' : 'chat-row-bot'}`}>
                {!isUser && (
                  <Avatar
                    size={30}
                    icon={<RobotOutlined />}
                    src={logoChatBot}
                    style={{ backgroundColor: '#1677ff11' }}
                  />
                )}

                <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                  {msg.isHtml ? (
                    // ⚠️ chỉ nên render HTML nếu backend bạn kiểm soát nội dung
                    <div
                      className="chat-html-content"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  ) : (
                    <Text className="chat-text">{msg.text}</Text>
                  )}
                  <div className="chat-time">{msg.time}</div>
                </div>

                {isUser && (
                  <Avatar
                    size={30}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#1677ff', color: '#fff' }}
                  />
                )}
              </div>
            );
          })}

          {loading && (
            <div className="chat-row chat-row-bot">
              <Avatar
                size={30}
                icon={<RobotOutlined />}
                style={{ backgroundColor: '#1677ff11', color: '#1677ff' }}
              />
              <div className="chat-bubble chat-bubble-bot">
                <Space>
                  <Spin size="small" />
                  <Text>Đang soạn câu trả lời...</Text>
                </Space>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-footer">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về tour, giá, lịch trình, mã đặt chỗ..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            bordered={false}
            className="chatbot-input"
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          />
        </div>
      </Card>
    </div>
  );
};

export default ChatbotWidget;
