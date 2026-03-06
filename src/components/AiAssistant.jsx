import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function AiAssistant({ data, onDataUpdate, isProcessingAi, onTextQuery }) {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: 'Hello! I can help you edit the extracted data. For example, "Change the tax on the first bill to $5".' }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isProcessingAi]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessingAi || data.length === 0) return;

    const query = input.trim();
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: query }]);
    
    try {
      const responseMsg = await onTextQuery(query);
      setChatHistory(prev => [...prev, { role: 'ai', content: responseMsg || 'Data updated successfully.' }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error: ' + error.message }]);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <Bot color="var(--primary)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>AI Actions</h3>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
        {data.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
            Upload invoices to start editing data.
          </div>
        )}
        
        {data.length > 0 && chatHistory.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.75rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
            </div>
            <div style={{ background: msg.role === 'user' ? 'var(--primary)' : 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '12px', borderTopRightRadius: msg.role === 'user' ? 0 : '12px', borderTopLeftRadius: msg.role === 'ai' ? 0 : '12px', fontSize: '0.9rem', maxWidth: '85%', lineHeight: 1.4 }}>
              {msg.content}
            </div>
          </div>
        ))}

        {isProcessingAi && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <Bot size={16} color="white" />
             </div>
             <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '12px', borderTopLeftRadius: 0, display: 'flex', alignItems: 'center' }}>
               <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={data.length === 0 ? "Upload invoices first..." : "Ask AI to edit data..."}
          disabled={isProcessingAi || data.length === 0}
          style={{ padding: '0.75rem', fontSize: '0.9rem' }}
        />
        <button type="submit" className="btn" disabled={isProcessingAi || data.length === 0 || !input.trim()} style={{ padding: '0.75rem' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
