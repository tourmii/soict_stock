import { useState, useRef, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';

export default function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Trading Advisor. I can analyze trends, mean reversion setups, and value opportunities. Ask me about a stock!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const isConnected = useMarketStore((s) => s.isConnected);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      // Simple keyword routing for the mock backend
      let mode = 'trend';
      if (userMsg.toLowerCase().includes('revert') || userMsg.toLowerCase().includes('bounce')) mode = 'mean_reversion';
      if (userMsg.toLowerCase().includes('value') || userMsg.toLowerCase().includes('long')) mode = 'value';

      let responseText = '';

      if (isConnected) {
        const res = await fetch('/api/advisor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, mode, context: { ticker: selectedTicker } })
        });
        const data = await res.json();
        responseText = `${data.message}\n\n**Rationale:** ${data.rationale}\n\n**Risk:** ${data.risk}`;
      } else {
        // Fallback offline response
        responseText = `I currently see ${selectedTicker} forming a consolidation pattern. Keep an eye on volume breakouts. (Offline Mode)`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: responseText }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I am having trouble connecting to the advisory service right now.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {isOpen && (
        <div style={{ width: '360px', height: '500px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-200)', marginBottom: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>AI Advisor</h4>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-page)' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ background: m.role === 'user' ? 'var(--primary)' : 'var(--white)', color: m.role === 'user' ? 'white' : 'var(--gray-800)', padding: '12px 14px', borderRadius: '12px', borderBottomRightRadius: m.role === 'user' ? '4px' : '12px', borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '12px', fontSize: '13px', lineHeight: 1.5, border: m.role === 'assistant' ? '1px solid var(--gray-200)' : 'none', whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '4px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                  {m.role === 'user' ? 'You' : 'AI Advisor'}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--white)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--gray-200)', color: 'var(--gray-500)', fontSize: '13px' }}>
                <div className="typing-dots"><span>.</span><span>.</span><span>.</span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', background: 'var(--white)', borderTop: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask about ${selectedTicker}...`}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-full)', fontSize: '13px', outline: 'none' }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || isTyping) ? 0.6 : 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🤖
        </button>
      )}
    </div>
  );
}
