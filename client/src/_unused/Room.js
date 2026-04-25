import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Ico = ({ d, size = 14, stroke = 'currentColor', fill = 'none', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const I = {
  send:   "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  pin:    "M12 2l3 7h7l-5.5 4 2 7L12 16.5 7.5 20l2-7L4 9h7z",
  heart:  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  back:   "M19 12H5M12 19l-7-7 7-7",
  copy:   ["M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z","M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"],
  check:  "M20 6L9 17l-5-5",
  trash:  ["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"],
  grip:   "M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01",
  star:   "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  export: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
};

// ─── Destination config ───────────────────────────────────────────────────────
const getDestConfig = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('varanasi') || n.includes('temple') || n.includes('spiritual')) return {
    accent: '#E8943A', accentDim: 'rgba(232,148,58,0.08)',
    accentBorder: 'rgba(232,148,58,0.18)', accentBorderBright: 'rgba(232,148,58,0.4)',
    bg: 'linear-gradient(160deg, #160800 0%, #0C0604 50%, #080604 100%)',
    label: 'Sacred Journey',
  };
  if (n.includes('goa') || n.includes('beach') || n.includes('coastal')) return {
    accent: '#5BA8B5', accentDim: 'rgba(91,168,181,0.08)',
    accentBorder: 'rgba(91,168,181,0.18)', accentBorderBright: 'rgba(91,168,181,0.4)',
    bg: 'linear-gradient(160deg, #001018 0%, #040C10 50%, #080604 100%)',
    label: 'Coastal Escape',
  };
  return {
    accent: '#C9A55A', accentDim: 'rgba(201,165,90,0.08)',
    accentBorder: 'rgba(201,165,90,0.18)', accentBorderBright: 'rgba(201,165,90,0.4)',
    bg: 'linear-gradient(160deg, #100E00 0%, #0C0A04 50%, #080604 100%)',
    label: 'Grand Journey',
  };
};

// ─── Typewriter ───────────────────────────────────────────────────────────────
function useTypewriter(text, speed = 20, active = true) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setOut(text); setDone(true); return; }
    setOut(''); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed, active]);
  return { out, done };
}

// ─── AI Bubble ────────────────────────────────────────────────────────────────
function AIBubble({ msg, onPin, isLatest, cfg }) {
  const { out, done } = useTypewriter(msg.text, 18, isLatest);
  const [pinned, setPinned] = useState(false);

  return (
    <div className="fade-up" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: cfg.accentDim, border: `1px solid ${cfg.accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic',
        color: cfg.accent, marginTop: 2,
      }}>✦</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: cfg.accent, marginBottom: 6, fontFamily: 'var(--font-mono)',
        }}>Concierge</div>

        <div style={{
          background: cfg.accentDim,
          border: `1px solid ${cfg.accentBorder}`,
          borderRadius: '3px 12px 12px 12px',
          padding: '13px 16px',
          fontSize: 13.5, lineHeight: 1.7,
          color: 'var(--ivory-dim)',
          letterSpacing: '0.01em',
          fontFamily: 'var(--font-body)',
        }}>
          {out}
          {!done && (
            <span style={{
              display: 'inline-block', width: 1.5, height: 14,
              background: cfg.accent, marginLeft: 2, verticalAlign: 'middle',
              animation: 'typewriterBlink 0.7s infinite',
            }} />
          )}
          {done && (
            <button onClick={() => { setPinned(true); onPin(msg.text); }}
              disabled={pinned}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 10,
                background: 'none',
                border: `1px solid ${pinned ? 'rgba(104,211,145,0.3)' : cfg.accentBorder}`,
                borderRadius: 5, padding: '4px 10px',
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: pinned ? '#68d391' : cfg.accent,
                fontFamily: 'var(--font-mono)',
                cursor: pinned ? 'default' : 'crosshair',
                transition: 'all 0.2s',
              }}
            >
              <Ico d={pinned ? I.check : I.pin} size={10} stroke="currentColor" />
              {pinned ? 'Pinned' : 'Pin to board'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── User Bubble ──────────────────────────────────────────────────────────────
function UserBubble({ msg, isSelf }) {
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
      {!isSelf && (
        <div style={{ fontSize: 9, color: 'var(--ivory-ghost)', marginBottom: 4, paddingLeft: 3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          {msg.sender}
        </div>
      )}
      <div style={{
        maxWidth: '70%',
        background: isSelf ? 'var(--ink-high)' : 'var(--ink-lift)',
        border: `1px solid ${isSelf ? 'var(--rule-warm)' : 'var(--rule)'}`,
        borderRadius: isSelf ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
        padding: '11px 14px',
        fontSize: 13.5, lineHeight: 1.65,
        color: isSelf ? 'var(--ivory)' : 'var(--ivory-dim)',
        letterSpacing: '0.01em',
        fontFamily: 'var(--font-body)',
      }}>
        {msg.text}
      </div>
    </div>
  );
}

// ─── AI Thinking ──────────────────────────────────────────────────────────────
function AIThinking({ cfg }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: cfg.accentDim, border: `1px solid ${cfg.accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic',
        color: cfg.accent,
      }}>✦</div>
      <div style={{
        background: cfg.accentDim, border: `1px solid ${cfg.accentBorder}`,
        borderRadius: '3px 12px 12px 12px', padding: '16px 20px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: cfg.accent,
            animation: `goldPulse 1.4s ${i * 0.22}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Board Card ───────────────────────────────────────────────────────────────
function BoardCard({ item, index, cfg, onHeart, onRemove, onDragStart, onDragOver, onDrop, dragging }) {
  const [hov, setHov] = useState(false);
  const [hearted, setHearted] = useState(false);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="slide-right"
      style={{
        background: hov ? 'var(--ink-lift)' : 'var(--ink-raised)',
        border: `1px solid ${hov ? cfg.accentBorder : 'var(--rule)'}`,
        borderRadius: 10, padding: '13px 14px',
        cursor: 'grab', opacity: dragging ? 0.35 : 1,
        transition: 'all 0.25s', userSelect: 'none',
        transform: hov ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Drag + text */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
        <div style={{ color: 'var(--ivory-ghost)', flexShrink: 0, marginTop: 1 }}>
          <Ico d={I.grip} size={12} stroke="var(--ivory-ghost)" />
        </div>
        <p style={{
          fontSize: 11.5, lineHeight: 1.6,
          color: 'var(--ivory-dim)', margin: 0, letterSpacing: '0.02em',
          fontFamily: 'var(--font-body)',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.activity?.slice(0, 160)}{item.activity?.length > 160 ? '…' : ''}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 8, borderTop: '1px solid var(--rule)',
      }}>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-mono)',
          color: 'var(--ivory-ghost)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>by {item.pinnedBy}</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => { setHearted(true); onHeart(index); setTimeout(() => setHearted(false), 500); }}
            style={{
              background: hearted ? cfg.accentDim : 'none', border: 'none',
              color: hearted ? cfg.accent : 'var(--ivory-ghost)',
              fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 4, transition: 'all 0.15s',
              fontFamily: 'var(--font-mono)',
            }}>
            <Ico d={I.heart} size={11} stroke="currentColor" fill={hearted ? 'currentColor' : 'none'} />
            {item.hearts || 0}
          </button>
          <button onClick={() => onRemove(index)} style={{
            background: 'none', border: 'none', padding: '2px 5px',
            color: 'var(--ivory-ghost)', display: 'flex', alignItems: 'center',
            borderRadius: 4, transition: 'color 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.color = '#fc8181'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--ivory-ghost)'}
          >
            <Ico d={I.trash} size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Room ─────────────────────────────────────────────────────────────────────
export default function Room({ room, userName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [board, setBoard] = useState(room.pinnedActivities || []);
  const [members] = useState(room.members || []);
  const [thinking, setThinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const bottomRef = useRef();
  const textRef = useRef();

  const cfg = getDestConfig(room.name + ' ' + (room.destination || ''));

  useEffect(() => {
    socket.emit('join_room', { roomCode: room.roomCode, userName });
    socket.on('receive_message', msg => { if (msg.type === 'ai') setThinking(false); setMessages(p => [...p, msg]); });
    socket.on('user_joined', msg => setMessages(p => [...p, { ...msg, type: 'system' }]));
    socket.on('activity_pinned', ({ activity, pinnedBy }) => setBoard(p => [...p, { activity, pinnedBy, hearts: 0 }]));
    socket.on('activity_hearted', ({ activityId }) => setBoard(p => p.map((a, i) => i === activityId ? { ...a, hearts: (a.hearts || 0) + 1 } : a)));
    return () => { socket.off('receive_message'); socket.off('user_joined'); socket.off('activity_pinned'); socket.off('activity_hearted'); };
  }, [room.roomCode, userName]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  const send = useCallback(() => {
    if (!input.trim()) return;
    const lo = input.toLowerCase();
    if (['spiritual','temple','beach','goa','varanasi','budget','adventure','hello','hi','itinerary','plan','relax'].some(k => lo.includes(k))) setThinking(true);
    socket.emit('send_message', { roomCode: room.roomCode, sender: userName, text: input });
    setInput('');
    textRef.current?.focus();
  }, [input, room.roomCode, userName]);

  const pin = (activity) => socket.emit('pin_activity', { roomCode: room.roomCode, activity, pinnedBy: userName });

  const handleDragOver = (to) => {
    if (dragIdx === null || dragIdx === to) return;
    setBoard(p => { const a = [...p]; const [m] = a.splice(dragIdx, 1); a.splice(to, 0, m); setDragIdx(to); return a; });
  };

  const lastAiIdx = messages.reduce((acc, m, i) => m.type === 'ai' ? i : acc, -1);

  const PROMPTS = [
    "What makes Varanasi special?",
    "Best time for Goa beaches?",
    "Budget-friendly itinerary ideas?",
    "Plan a 4-day spiritual trip",
  ];

  const visibleMessages = messages.filter(m => m.type !== 'system');

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: cfg.bg, fontFamily: 'var(--font-body)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient */}
      <div style={{
        position: 'absolute', top: '5%', left: '30%', width: 600, height: 400,
        background: `radial-gradient(ellipse, ${cfg.accentDim.replace('0.08', '0.05')} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* ── Header ── */}
      <header style={{
        height: 56, padding: '0 28px',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(8,6,4,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--rule)',
        flexShrink: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: '1px solid var(--rule)',
          borderRadius: 6, padding: '5px 12px',
          color: 'var(--ivory-faint)', fontSize: 11,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
          transition: 'all 0.2s',
        }}
          onMouseOver={e => e.currentTarget.style.borderColor = cfg.accentBorder}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--rule)'}
        >
          <Ico d={I.back} size={12} /> Back
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--rule)' }} />

        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, fontStyle: 'italic', color: 'var(--ivory)', letterSpacing: '-0.01em' }}>
            {room.name}
          </div>
          <div style={{ fontSize: 9, color: 'var(--ivory-ghost)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            {cfg.label}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Room code */}
        <button onClick={() => { navigator.clipboard.writeText(room.roomCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--ink-raised)',
            border: `1px solid ${copied ? 'rgba(104,211,145,0.4)' : cfg.accentBorder}`,
            borderRadius: 6, padding: '5px 12px',
            color: copied ? '#68d391' : cfg.accent,
            fontFamily: 'var(--font-mono)',
            fontSize: 12, letterSpacing: '0.14em',
            transition: 'all 0.2s',
          }}>
          <Ico d={copied ? I.check : I.copy} size={12} stroke="currentColor" />
          {copied ? 'Copied' : room.roomCode}
        </button>

        {/* Members */}
        <div style={{ display: 'flex' }}>
          {members.slice(0, 5).map((m, i) => (
            <div key={i} title={m.name} style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `hsl(${(m.name.charCodeAt(0) * 47) % 360},45%,28%)`,
              border: '2px solid var(--ink-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic',
              color: 'var(--ivory-dim)', marginLeft: i > 0 ? -9 : 0,
              zIndex: members.length - i,
            }}>
              {m.name[0].toUpperCase()}
            </div>
          ))}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--rule)', minWidth: 0 }}>

          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 16px' }}>

            {/* Empty state */}
            {visibleMessages.length === 0 && (
              <div className="fade-in" style={{ textAlign: 'center', padding: '52px 20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontStyle: 'italic', color: cfg.accent, marginBottom: 6, opacity: 0.6 }}>✦</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', color: 'var(--ivory-dim)', marginBottom: 6 }}>
                  Your concierge awaits
                </p>
                <p style={{ fontSize: 12, color: 'var(--ivory-ghost)', letterSpacing: '0.06em', lineHeight: 1.7, marginBottom: 24, fontFamily: 'var(--font-body)' }}>
                  Ask anything — destinations, budgets, itineraries, local secrets.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
                  {PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => setInput(p)} style={{
                      padding: '7px 14px', borderRadius: 4,
                      background: 'none', border: `1px solid ${cfg.accentBorder}`,
                      color: cfg.accent, fontSize: 11,
                      letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
                      transition: 'all 0.2s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.background = cfg.accentDim; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'none'; }}
                    >{p}</button>
                  ))}
                </div>
              </div>
            )}

            {/* System messages */}
            {messages.filter(m => m.type === 'system').map((m, i) => (
              <div key={`s${i}`} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 16, fontSize: 10,
                color: 'var(--ivory-ghost)', letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                {m.text}
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
              </div>
            ))}

            {/* Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {visibleMessages.map((msg, i) =>
                msg.type === 'ai'
                  ? <AIBubble key={i} msg={msg} onPin={pin} isLatest={i === lastAiIdx} cfg={cfg} />
                  : <UserBubble key={i} msg={msg} isSelf={msg.sender === userName} />
              )}
              {thinking && <AIThinking cfg={cfg} />}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 20px 18px',
            background: 'rgba(8,6,4,0.6)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--rule)',
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              background: 'var(--ink-raised)',
              border: `1px solid var(--rule-warm)`,
              borderRadius: 12, padding: '10px 14px',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = cfg.accentBorderBright}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--rule-warm)'}
            >
              <div style={{ color: cfg.accent, flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', lineHeight: 1, paddingBottom: 2 }}>✦</div>
              <textarea
                ref={textRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask your concierge or chat with companions…"
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--ivory)', fontSize: 13.5,
                  fontFamily: 'var(--font-body)', resize: 'none',
                  lineHeight: 1.55, maxHeight: 80,
                  letterSpacing: '0.01em',
                }}
              />
              <button onClick={send} disabled={!input.trim()} style={{
                width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                background: input.trim() ? `linear-gradient(135deg, ${cfg.accent}, ${cfg.accentBorder.replace('0.18', '1')})` : 'var(--ink-high)',
                border: `1px solid ${input.trim() ? cfg.accentBorderBright : 'var(--rule)'}`,
                color: input.trim() ? 'var(--ink)' : 'var(--ivory-ghost)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s',
              }}>
                <Ico d={I.send} size={13} stroke="currentColor" />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 6, fontSize: 9.5, color: 'var(--ivory-ghost)', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* ── Trip Board ── */}
        <div style={{ width: 284, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(8,6,4,0.5)', backdropFilter: 'blur(16px)' }}>

          {/* Board header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ivory)', letterSpacing: '-0.01em' }}>Trip Board</div>
              <div style={{ fontSize: 9, color: 'var(--ivory-ghost)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                Drag to reorder
              </div>
            </div>
            <div style={{
              background: cfg.accentDim, border: `1px solid ${cfg.accentBorder}`,
              borderRadius: 20, padding: '2px 9px',
              fontSize: 10, fontFamily: 'var(--font-mono)',
              color: cfg.accent, letterSpacing: '0.08em',
            }}>{board.length}</div>
          </div>

          {/* Board items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {board.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ivory-ghost)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontStyle: 'italic', color: cfg.accent, opacity: 0.3, marginBottom: 12 }}>✦</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', color: 'var(--ivory-faint)', marginBottom: 6 }}>Board is empty</p>
                <p style={{ fontSize: 10, lineHeight: 1.6, letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                  Pin AI suggestions to build your itinerary together
                </p>
              </div>
            ) : (
              board.map((item, i) => (
                <BoardCard
                  key={i} item={item} index={i} cfg={cfg}
                  dragging={dragIdx === i}
                  onDragStart={setDragIdx}
                  onDragOver={handleDragOver}
                  onDrop={() => setDragIdx(null)}
                  onHeart={idx => socket.emit('heart_activity', { roomCode: room.roomCode, activityId: idx })}
                  onRemove={idx => setBoard(p => p.filter((_, j) => j !== idx))}
                />
              ))
            )}
          </div>

          {/* Board footer */}
          {board.length > 0 && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--rule)', display: 'flex', gap: 8 }}>
              <button style={{
                flex: 1, padding: '9px', borderRadius: 7,
                background: 'none', border: `1px solid ${cfg.accentBorder}`,
                color: cfg.accent, fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Ico d={I.export} size={12} stroke={cfg.accent} />
                Export
              </button>
              <button onClick={() => setBoard([])} style={{
                padding: '9px 12px', borderRadius: 7,
                background: 'none', border: '1px solid var(--rule)',
                color: 'var(--ivory-ghost)', display: 'flex', alignItems: 'center',
              }}>
                <Ico d={I.trash} size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}