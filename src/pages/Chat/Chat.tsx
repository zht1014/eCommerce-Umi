'use client';

import { useState } from 'react';
import { Button, Drawer, Input, Spin, message as antdMessage } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { useChat } from '@ai-sdk/react';

export default function ChatWidget() {
  const { messages, input, handleInputChange, setInput } = useChat();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const showDrawer = () => setVisible(true);
  const closeDrawer = () => setVisible(false);

  const onSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: input }],
    };
    messages.push(userMessage);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://node-deepseek-chat.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMessage] }),
      });

      const data = await response.json();

      if (data && data.parts && data.parts[0]) {
        const aiMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          parts: data.parts,
        };
        messages.push(aiMessage);
      } else {
        antdMessage.error('AI No Valid Response');
      }
    } catch (err) {
      console.error('Error calling the API:', err);
      antdMessage.error(' AI API Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <Button
        type="primary"
        icon={<MessageOutlined />}
        shape="circle"
        size="large"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        onClick={showDrawer}
      />

      {/* 聊天抽屉 */}
      <Drawer
        title="AI asistence"
        placement="right"
        onClose={closeDrawer}
        open={visible}
        width={360}
        bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* 聊天消息 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                textAlign: message.role === 'user' ? 'right' : 'left',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: message.role === 'user' ? '#1890ff' : '#f5f5f5',
                  color: message.role === 'user' ? '#fff' : '#000',
                  padding: '8px 12px',
                  borderRadius: 16,
                  maxWidth: '80%',
                  wordBreak: 'break-word',
                }}
              >
                {message.parts.map((part, i) => (
                  <span key={`${message.id}-${i}`}>{part.text}</span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Spin size="small" />
            </div>
          )}
        </div>

        {/* 输入框区域 */}
        <div style={{ marginTop: 16 }}>
          <Input.Search
            value={input}
            onChange={handleInputChange}
            onSearch={onSubmit}
            enterButton={<SendOutlined />}
            placeholder="please enter the content here…"
            disabled={loading}
          />
        </div>
      </Drawer>
    </>
  );
}