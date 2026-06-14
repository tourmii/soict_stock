import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatbotStore } from '../../store/chatbotStore';
import ChatMessage from './ChatMessage';
import ChatQuickActions from './ChatQuickActions';

export default function ChatbotPanel({ dragHandleProps = {} }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const userId = useAuthStore((state) => state.user?.id);
  const messages = useChatbotStore((state) => state.messages);
  const loading = useChatbotStore((state) => state.loading);
  const closeChat = useChatbotStore((state) => state.closeChat);
  const sendMessage = useChatbotStore((state) => state.sendMessage);
  const clearConversation = useChatbotStore((state) => state.clearConversation);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  const submit = (text = input) => {
    if (!text.trim()) return;
    sendMessage(text, userId);
    setInput('');
  };

  return (
    <section className="chatbot-panel" aria-label="SoictStock AI Assistant">
      <header className="chatbot-panel__header" {...dragHandleProps}>
        <div>
          <h3>SoictStock AI Assistant</h3>
          <p>Simulation-based financial learning assistant</p>
        </div>
        <span>Educational only</span>
        <button type="button" onClick={closeChat} aria-label="Close assistant">x</button>
      </header>

      <div className="chatbot-panel__messages">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onSuggestion={submit} />
        ))}
        {loading && <div className="chatbot-typing">Thinking...</div>}
        <div ref={endRef} />
      </div>

      <ChatQuickActions onSelect={submit} suggestions={messages[messages.length - 1]?.suggestions || []} />

      <form className="chatbot-input" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about lessons, risk, orders, or your simulated portfolio..."
        />
        <button type="submit" disabled={!input.trim() || loading}>Send</button>
      </form>
      <button className="chatbot-clear" type="button" onClick={() => clearConversation(userId)}>Clear chat</button>
    </section>
  );
}
