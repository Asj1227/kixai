import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2 } from 'lucide-react';
import { chatWithAI } from '../utils/apiService';
import './Chatbot.css';

const WELCOME_MSG = `Hi! I'm **KIXAI Assistant** 👋

I can help you with your invoice data. Here are some things you can ask me:

- *"Change the Who? for row 2 to Maryam"*
- *"Fix the vendor name on row 1 to Homecentre"*
- *"What is the total for Rabaa?"*
- *"Remove the last invoice"*
- *"Update the VAT amount for invoice #360 to AED5.28"*

Just ask me anything about your invoices!`;

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`chat-msg ${isUser ? 'user' : 'ai'}`}>
      <div className="chat-avatar">
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className="chat-bubble">
        {msg.content.split('\n').map((line, i) => {
          // Bold markdown
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="chat-line">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p === '' ? null : <span key={j}>{p}</span>)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function Chatbot({ invoices, onUpdateInvoices }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', content: WELCOME_MSG }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
    }
  }, [open, messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await chatWithAI(invoices, text, messages);
      setMessages(m => [...m, { role: 'ai', content: result.reply }]);

      if (result.updatedData) {
        // Merge IDs: keep existing IDs where possible
        const merged = result.updatedData.map((inv, i) => ({
          id: invoices[i]?.id || `inv-chat-${Date.now()}-${i}`,
          ...inv,
        }));
        onUpdateInvoices(merged);
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'ai', content: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)} title="Open KIXAI Assistant">
          <MessageCircle size={24} />
          <span className="chat-fab-label">Ask KIXAI</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="chat-panel fade-in">
          {/* Header */}
          <div className="chat-panel-header">
            <div className="chat-panel-title">
              <div className="chat-bot-icon">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="chat-name">KIXAI Assistant</span>
                <span className="chat-status">
                  <span className="online-dot" />
                  AI-powered
                </span>
              </div>
            </div>
            <div className="chat-panel-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} title="Minimize">
                <Minimize2 size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && (
              <div className="chat-msg ai">
                <div className="chat-avatar"><Bot size={14} /></div>
                <div className="chat-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask me to fix invoice data..."
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Send size={16} />
            </button>
          </div>

          {/* Context hint */}
          <div className="chat-context-hint">
            {invoices.length > 0
              ? `Context: ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} in current batch`
              : 'No invoices loaded — upload some first'
            }
          </div>
        </div>
      )}
    </>
  );
}
