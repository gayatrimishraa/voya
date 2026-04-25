import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './Chat.module.css';
import ItineraryPanel from '../components/ItineraryPanel';
import ToolBadge from '../components/ToolBadge';
import ImageUpload from '../components/ImageUpload';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const SUGGESTIONS = [
  '5 days in Goa — beaches and culture',
  'Budget Rajasthan trip for 2 in December',
  'Ladakh road trip from Manali in July',
  'Romantic Kerala backwaters getaway',
  'Weekend getaway from Bangalore',
  'Spiritual trip to Varanasi',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`${styles.msgRow} ${isUser ? styles.userRow : styles.assistantRow}`}>
      {!isUser && <div className={styles.avatar}>V</div>}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
        {msg.tool_results && msg.tool_results.length > 0 && (
          <div className={styles.toolBadges}>
            {msg.tool_results.map((t, i) => (
              <ToolBadge key={i} tool={t.tool} />
            ))}
          </div>
        )}

        <div
          className={styles.bubbleText}
          dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
        />

        {msg.imageData && (
          <img src={msg.imageData} alt="uploaded" className={styles.uploadedImg} />
        )}
      </div>
    </div>
  );
}

function formatMessage(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function TypingIndicator() {
  return (
    <div className={`${styles.msgRow} ${styles.assistantRow}`}>
      <div className={styles.avatar}>V</div>
      <div className={`${styles.bubble} ${styles.assistantBubble} ${styles.typingBubble}`}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: urlSessionId } = useParams();

  const [sessionId, setSessionId] = useState(urlSessionId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [showItinerary, setShowItinerary] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load existing session
  useEffect(() => {
    if (urlSessionId) {
      fetch(`${API}/session/${urlSessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.session) {
            setMessages(
              data.session.history.map(h => ({ role: h.role, content: h.content }))
            );
            if (data.itinerary) {
              setItinerary(data.itinerary.data);
              setShowItinerary(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [urlSessionId]);

  // Send initial message from landing page
  useEffect(() => {
    const init = location.state?.initialMessage;
    if (init && messages.length === 0) {
      sendMessage(init);
    }
    // eslint-disable-next-line
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendMessage = useCallback(async (text, imageData = null) => {
    const msg = (text || '').trim();
    if (!msg && !imageData) return;
    setError(null);

    const userMsg = { role: 'user', content: msg, imageData };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingImage(null);
    setLoading(true);

    try {
      const body = {
        message: msg,
        session_id: sessionId,
        currentItinerary: itinerary,
      };
      if (imageData) body.imageData = imageData;

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Unknown error');

      // Store session ID
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
        window.history.replaceState(null, '', `/plan/${data.session_id}`);
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        tool_results: data.tool_results,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // If itinerary returned → open panel
      if (data.itinerary) {
        setItinerary(data.itinerary);
        setShowItinerary(true);
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [sessionId, itinerary]);

  const handleSend = () => {
    sendMessage(input, pendingImage);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    if (sessionId) {
      await fetch(`${API}/session/${sessionId}`, { method: 'DELETE' });
    }
    setSessionId(null);
    setMessages([]);
    setItinerary(null);
    setShowItinerary(false);
    window.history.replaceState(null, '', '/plan');
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <button className={styles.logoBtn} onClick={() => navigate('/')}>
            Voya
          </button>
          <button className={styles.newChat} onClick={handleNewChat}>
            + New trip
          </button>
        </div>

        <div className={styles.sidebarSection}>
          <p className={styles.sidebarLabel}>Try asking</p>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              className={styles.suggestion}
              onClick={() => sendMessage(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>

        {itinerary && (
          <div className={styles.sidebarBottom}>
            <button
              className={styles.viewItinerary}
              onClick={() => setShowItinerary(v => !v)}
            >
              {showItinerary ? 'Hide itinerary' : '✦ View itinerary'}
            </button>
          </div>
        )}
      </aside>

      {/* Main chat */}
      <main className={styles.main}>
        <div className={styles.chatArea}>
          {isEmpty ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyLogo}>V</div>
              <h2 className={styles.emptyTitle}>Where would you like to go?</h2>
              <p className={styles.emptySub}>
                Tell me your destination, dates, and budget — or just start talking.
                I'll ask the right questions and build your perfect itinerary.
              </p>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
              {error && <div className={styles.errorBanner}>⚠ {error}</div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          {pendingImage && (
            <div className={styles.pendingImg}>
              <img src={pendingImage} alt="pending" />
              <button onClick={() => setPendingImage(null)}>✕</button>
            </div>
          )}
          <div className={styles.inputBox}>
            <ImageUpload onImage={setPendingImage} />
            <textarea
              ref={inputRef}
              className={styles.textarea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Voya anything about your trip…"
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={loading || (!input.trim() && !pendingImage)}
            >
              {loading ? <span className={styles.spinner} /> : '→'}
            </button>
          </div>
          <p className={styles.inputHint}>
            Voya uses real-time data · Press Enter to send
          </p>
        </div>
      </main>

      {/* Itinerary panel */}
      {showItinerary && itinerary && (
        <ItineraryPanel
          itinerary={itinerary}
          sessionId={sessionId}
          onClose={() => setShowItinerary(false)}
        />
      )}
    </div>
  );
}