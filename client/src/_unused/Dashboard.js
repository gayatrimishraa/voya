/**
 * Place at: client/src/pages/Dashboard.js
 * Replaces the old Dashboard entirely.
 * 
 * Key changes from old version:
 *  - Removes /api/trips call (no more seeded data)
 *  - Destination cards are static curated content that open ChatPage with a pre-filled prompt
 *  - "Real packages" section shows direct booking platform deep-links
 *  - Keeps the exact same dark luxury design system (--font-display, --gold, etc.)
 *  - Keeps the Room / collaborative planning flow
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {useLocation} from 'react-router-dom'; 

const Ico = ({ d, size = 14, stroke = 'currentColor', fill = 'none', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const I = {
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  arrow:  "M5 12h14M12 5l7 7-7 7",
  users:  ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75", "M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  ext:    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  x:      "M18 6L6 18M6 6l12 12",
  plus:   "M12 5v14M5 12h14",
};

// ── Curated destinations — clicking opens ChatPage with a prompt ──────────────
const DESTINATIONS = [
  {
    name: 'Goa',
    vibe: 'Beach',
    roman: 'I',
    accent: '#5BA8B5',
    accentDim: 'rgba(91,168,181,0.08)',
    accentBorder: 'rgba(91,168,181,0.2)',
    gradient: 'linear-gradient(135deg, #001C22 0%, #000D12 100%)',
    season: 'Nov – Feb',
    days: '4–7',
    from: '₹12,000',
    tags: ['beaches', 'nightlife', 'food', 'colonial'],
    prompt: "Plan a 5-day Goa trip in December for 2 people with a mid-range budget. I want beaches, good food and some nightlife.",
    bookingLinks: {
      flights: "https://www.makemytrip.com/flights/search?itinerary=BOM-GOI-&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=economy&lang=eng",
      hotels: "https://www.booking.com/searchresults.html?ss=Goa+India&checkin=2024-12-20&checkout=2024-12-25&group_adults=2&no_rooms=1",
    },
  },
  {
    name: 'Rajasthan',
    vibe: 'Heritage',
    roman: 'II',
    accent: '#C9A55A',
    accentDim: 'rgba(201,165,90,0.08)',
    accentBorder: 'rgba(201,165,90,0.2)',
    gradient: 'linear-gradient(135deg, #1A1200 0%, #0D0900 100%)',
    season: 'Oct – Mar',
    days: '6–10',
    from: '₹18,000',
    tags: ['palaces', 'forts', 'desert', 'culture'],
    prompt: "Plan a 7-day Rajasthan heritage trip covering Jaipur, Jodhpur and Udaipur in November. Budget is around ₹50,000 for 2 people.",
    bookingLinks: {
      flights: "https://www.makemytrip.com/flights/search?itinerary=BOM-JAI-&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=economy&lang=eng",
      hotels: "https://www.booking.com/searchresults.html?ss=Jaipur+India&checkin=2024-11-15&checkout=2024-11-22&group_adults=2&no_rooms=1",
    },
  },
  {
    name: 'Kerala',
    vibe: 'Nature',
    roman: 'III',
    accent: '#68D391',
    accentDim: 'rgba(104,211,145,0.08)',
    accentBorder: 'rgba(104,211,145,0.2)',
    gradient: 'linear-gradient(135deg, #002210 0%, #001008 100%)',
    season: 'Sep – Mar',
    days: '5–8',
    from: '₹15,000',
    tags: ['backwaters', 'spices', 'ayurveda', 'wildlife'],
    prompt: "Plan a 6-day Kerala trip with backwaters houseboat, Munnar tea estates and Kovalam beach for 2 people in January. Budget ₹45,000.",
    bookingLinks: {
      flights: "https://www.makemytrip.com/flights/search?itinerary=BOM-COK-&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=economy&lang=eng",
      hotels: "https://www.booking.com/searchresults.html?ss=Kochi+India&checkin=2025-01-10&checkout=2025-01-16&group_adults=2&no_rooms=1",
    },
  },
  {
    name: 'Ladakh',
    vibe: 'Adventure',
    roman: 'IV',
    accent: '#7BA05B',
    accentDim: 'rgba(123,160,91,0.08)',
    accentBorder: 'rgba(123,160,91,0.2)',
    gradient: 'linear-gradient(135deg, #0D1A00 0%, #060D00 100%)',
    season: 'Jun – Sep',
    days: '7–12',
    from: '₹25,000',
    tags: ['high passes', 'monasteries', 'pangong', 'road trip'],
    prompt: "Plan a 9-day Ladakh road trip in July starting from Manali, ending in Leh. Group of 4, SUV. Total budget ₹1,20,000.",
    bookingLinks: {
      flights: "https://www.makemytrip.com/flights/search?itinerary=DEL-IXL-&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=economy&lang=eng",
      hotels: "https://www.booking.com/searchresults.html?ss=Leh+India&checkin=2025-07-01&checkout=2025-07-09&group_adults=2&no_rooms=1",
    },
  },
  {
    name: 'Varanasi',
    vibe: 'Temple',
    roman: 'V',
    accent: '#E8943A',
    accentDim: 'rgba(232,148,58,0.08)',
    accentBorder: 'rgba(232,148,58,0.2)',
    gradient: 'linear-gradient(135deg, #160800 0%, #0C0604 100%)',
    season: 'Oct – Mar',
    days: '3–5',
    from: '₹8,000',
    tags: ['ghats', 'aarti', 'spiritual', 'ancient'],
    prompt: "Plan a 3-day spiritual trip to Varanasi and Sarnath in November. Solo traveller, budget ₹12,000. I want the full ghat experience.",
    bookingLinks: {
      flights: "https://www.makemytrip.com/flights/search?itinerary=BOM-VNS-&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=economy&lang=eng",
      hotels: "https://www.booking.com/searchresults.html?ss=Varanasi+India&checkin=2024-11-20&checkout=2024-11-23&group_adults=1&no_rooms=1",
    },
  },
  {
    name: 'Manali',
    vibe: 'Adventure',
    roman: 'VI',
    accent: '#B794F4',
    accentDim: 'rgba(183,148,244,0.08)',
    accentBorder: 'rgba(183,148,244,0.2)',
    gradient: 'linear-gradient(135deg, #120D1A 0%, #08060D 100%)',
    season: 'Apr – Jun',
    days: '5–7',
    from: '₹10,000',
    tags: ['snow', 'rohtang', 'adventure', 'valleys'],
    prompt: "Plan a 5-day Manali trip in June for 4 friends. We want snow activities, Rohtang Pass and camping. Budget ₹60,000 total.",
    bookingLinks: {
      flights: "https://www.makemytrip.com/flights/search?itinerary=DEL-KUU-&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=economy&lang=eng",
      hotels: "https://www.booking.com/searchresults.html?ss=Manali+India&checkin=2025-06-10&checkout=2025-06-15&group_adults=4&no_rooms=2",
    },
  },
];

// ── Real booking platform cards ────────────────────────────────────────────────
const PLATFORMS = [
  { name: 'MakeMyTrip', desc: 'Flights · Hotels · Packages', color: '#E8102A', url: 'https://www.makemytrip.com/' },
  { name: 'Booking.com', desc: 'Hotels · Apartments · Resorts', color: '#003580', url: 'https://www.booking.com/' },
  { name: 'Cleartrip', desc: 'Flights · Trains · Hotels', color: '#E87722', url: 'https://www.cleartrip.com/' },
  { name: 'Agoda', desc: 'Hotels · Homes · Flights', color: '#5392F9', url: 'https://www.agoda.com/' },
  { name: 'Goibibo', desc: 'Flights · Hotels · Bus', color: '#009688', url: 'https://www.goibibo.com/' },
  { name: 'ixigo', desc: 'Flights · Trains · Hotels', color: '#FF6634', url: 'https://www.ixigo.com/' },
];

// ── Prompt suggestions ─────────────────────────────────────────────────────────
const PROMPTS = [
  "5-day Goa trip in December, 2 people, ₹20,000",
  "Spiritual journey to Varanasi and Sarnath",
  "Road trip: Mumbai to Goa, sedan, 2 people",
  "Budget Rajasthan trip under ₹30,000",
  "Ladakh adventure in July for 4 friends",
  "Romantic Kerala backwaters for a couple",
];

// ── Room palette modal (preserved exactly from original) ─────────────────────
function Palette({ show, onClose, onEnterRoom, dest }) {
  const [step, setStep] = useState('name');
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState(dest || '');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('create');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (show) { setRoomName(dest || ''); setBusy(false); }
  }, [show, dest]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'create') {
        const r = await axios.post('http://localhost:5000/api/rooms/create', {
          name: roomName, creatorName: name, destination: dest || '',
        });
        onEnterRoom(r.data, name);
      } else {
        const r = await axios.post('http://localhost:5000/api/rooms/join', {
          roomCode: code.toUpperCase(), userName: name,
        });
        onEnterRoom(r.data, name);
      }
    } catch { setBusy(false); }
  };

  if (!show) return null;

  const inp = {
    width: '100%', background: 'var(--ink-high)',
    border: '1px solid var(--rule-warm)', borderRadius: 8,
    padding: '13px 16px', color: 'var(--ivory)',
    fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(8,6,4,0.88)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 440, background: 'var(--ink-raised)',
        border: '1px solid var(--rule-warm)', borderRadius: 20,
        overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic', color: 'var(--ivory)' }}>Collaborative Room</div>
            <div style={{ fontSize: 11, color: 'var(--ivory-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginTop: 2 }}>Plan together in real-time</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: '1px solid var(--rule)', borderRadius: '50%', background: 'none', color: 'var(--ivory-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico d={I.x} size={13} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--ink-deep)', borderRadius: 8, padding: 4, marginBottom: 20, gap: 3 }}>
            {['create', 'join'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: 9, borderRadius: 6,
                background: mode === m ? 'var(--ink-high)' : 'none',
                border: `1px solid ${mode === m ? 'var(--gold-border)' : 'transparent'}`,
                color: mode === m ? 'var(--gold)' : 'var(--ivory-faint)',
                fontSize: 12, fontFamily: 'var(--font-body)',
                letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.25s',
              }}>{m === 'create' ? 'Create Room' : 'Join Room'}</button>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ivory-faint)', marginBottom: 7, fontFamily: 'var(--font-mono)' }}>Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya" style={inp} />
          </div>
          {mode === 'create' ? (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ivory-faint)', marginBottom: 7, fontFamily: 'var(--font-mono)' }}>Room Name</label>
              <input value={roomName} onChange={e => setRoomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name && roomName && submit()} placeholder={dest ? `${dest} Expedition` : "e.g. Goa Winter Trip"} style={inp} />
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ivory-faint)', marginBottom: 7, fontFamily: 'var(--font-mono)' }}>Room Code</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && name && code && submit()} placeholder="A1B2C3" style={{ ...inp, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', fontSize: 16 }} />
            </div>
          )}
          <button onClick={submit} disabled={busy || !name.trim() || (mode === 'create' ? !roomName.trim() : !code.trim())} style={{
            width: '100%', padding: 13,
            background: busy ? 'var(--ink-high)' : 'linear-gradient(135deg, #C9A55A, #8B6E35)',
            border: 'none', borderRadius: 10,
            color: busy ? 'var(--ivory-faint)' : 'var(--ink)',
            fontFamily: 'var(--font-body)', fontSize: 13,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            opacity: (!name.trim() || (mode === 'create' ? !roomName.trim() : !code.trim())) ? 0.4 : 1,
          }}>
            {busy ? 'Entering…' : mode === 'create' ? 'Create & Enter' : 'Enter Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Destination card ──────────────────────────────────────────────────────────
function DestCard({ dest, index, onPlan, onRoom }) {
  const [hov, setHov] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setShowLinks(false); }}
      style={{
        background: hov ? 'var(--ink-lift)' : 'var(--ink-card)',
        border: `1px solid ${hov ? dest.accentBorder : 'var(--rule)'}`,
        borderRadius: 20, overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
        transform: hov ? 'translateY(-5px)' : 'none',
        boxShadow: hov ? `0 24px 64px rgba(0,0,0,0.6)` : 'none',
        animationDelay: `${index * 0.08}s`,
      }}
      className="fade-up"
    >
      {/* Image area */}
      <div style={{
        height: 180, background: dest.gradient,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          fontFamily: 'var(--font-display)', fontSize: 200,
          fontWeight: 700, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.025)', lineHeight: 1,
          userSelect: 'none', top: -20,
        }}>{dest.name[0]}</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px,4vw,42px)',
          fontWeight: 500, fontStyle: 'italic',
          color: hov ? 'var(--ivory)' : 'rgba(245,240,232,0.7)',
          letterSpacing: '-0.01em', zIndex: 1,
          textShadow: `0 2px 20px ${dest.accent}44`,
          transition: 'color 0.4s',
        }}>{dest.name}</div>
        <div style={{ position: 'absolute', top: 14, left: 16, fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic', color: dest.accent, opacity: 0.8 }}>{dest.roman}</div>
        <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ivory-faint)', fontFamily: 'var(--font-mono)' }}>{dest.vibe}</div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${dest.accent}88, transparent)`,
          transform: hov ? 'scaleX(1)' : 'scaleX(0.3)',
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
          <span style={{ fontSize: 11, color: 'var(--ivory-dim)', fontFamily: 'var(--font-mono)' }}>{dest.days} nights</span>
          <span style={{ fontSize: 11, color: dest.accent, fontFamily: 'var(--font-mono)' }}>from {dest.from}</span>
          <span style={{ fontSize: 11, color: 'var(--ivory-faint)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{dest.season}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 18 }}>
          {dest.tags.map(t => (
            <span key={t} style={{
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--ivory-faint)', background: 'var(--ink-high)',
              border: '1px solid var(--rule)', borderRadius: 3,
              padding: '3px 8px', fontFamily: 'var(--font-mono)',
            }}>{t}</span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onPlan(dest.prompt)} style={{
            flex: 1, padding: '9px 12px', borderRadius: 8,
            background: 'linear-gradient(135deg, #C9A55A, #8B6E35)',
            border: 'none', color: 'var(--ink)',
            fontSize: 11, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'opacity 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >Plan with Voya</button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLinks(v => !v)}
              title="Book directly"
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: `1px solid ${dest.accentBorder}`,
                background: 'none', color: dest.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <Ico d={I.ext} size={13} />
            </button>
            {showLinks && (
              <div style={{
                position: 'absolute', bottom: '110%', right: 0,
                background: 'var(--ink-raised)', border: '1px solid var(--rule-warm)',
                borderRadius: 10, padding: 8, zIndex: 100,
                minWidth: 160, boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
              }}>
                <div style={{ fontSize: 9, color: 'var(--ivory-ghost)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6, padding: '0 4px' }}>Book directly</div>
                {Object.entries(dest.bookingLinks).map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 8px', borderRadius: 6, fontSize: 12,
                    color: 'var(--ivory-dim)', fontFamily: 'var(--font-body)',
                    transition: 'background 0.15s',
                    textDecoration: 'none',
                  }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--ink-high)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    <Ico d={I.ext} size={11} stroke="var(--gold)" /> {label.charAt(0).toUpperCase() + label.slice(1)} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ onEnterRoom, onOpenChat }) {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [vibe, setVibe] = useState('All');
  const [palette, setPalette] = useState(false);
  const [paletteDest, setPaletteDest] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptFading, setPromptFading] = useState(false);

  const VIBES = ['All', 'Beach', 'Heritage', 'Nature', 'Adventure', 'Temple'];

  // Rotate suggestion prompts
  useEffect(() => {
    const t = setInterval(() => {
      setPromptFading(true);
      setTimeout(() => { setPromptIdx(i => (i + 1) % PROMPTS.length); setPromptFading(false); }, 350);
    }, 3500);
    return () => clearInterval(t);
  }, []);

    // If coming from Landing page with a prompt → open chat automatically
  useEffect(() => {
    if (location.state && location.state.initialMessage) {
      onOpenChat({ initialMessage: location.state.initialMessage });
    }
  }, [location, onOpenChat]);
  
  const filtered = DESTINATIONS.filter(d => {
    const matchVibe = vibe === 'All' || d.vibe === vibe;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.includes(search.toLowerCase()));
    return matchVibe && matchSearch;
  });

  const openPalette = (dest = '') => { setPaletteDest(dest); setPalette(true); };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      onOpenChat({ initialMessage: `Tell me about visiting ${search} in India. What's the best time, what to see, and how much would it cost?` });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', position: 'relative', fontFamily: 'var(--font-body)' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 500, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at center top, rgba(201,165,90,0.04) 0%, transparent 65%)',
      }} />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--rule)',
        background: 'rgba(12,10,8,0.92)', backdropFilter: 'blur(20px)',
        padding: '0 48px',
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginRight: 40 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: 'var(--ivory)' }}>Voya</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>AI</span>
          </div>

          {['Explore', 'Book Direct', 'Concierge'].map((l, i) => (
            <button key={l} style={{
              background: 'none', border: 'none', padding: '4px 16px',
              color: i === 0 ? 'var(--ivory)' : 'var(--ivory-faint)',
              fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              borderBottom: i === 0 ? '1px solid var(--gold)' : '1px solid transparent',
              marginBottom: i === 0 ? -1 : 0, transition: 'color 0.2s',
            }}>{l}</button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{ position: 'relative', marginRight: 16 }}>
            <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ivory-ghost)' }}>
              <Ico d={I.search} size={13} />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search or press Enter to ask Voya…"
              style={{
                background: 'var(--ink-raised)', border: '1px solid var(--rule)',
                borderRadius: 7, padding: '7px 13px 7px 30px',
                color: 'var(--ivory)', fontFamily: 'var(--font-body)',
                fontSize: 12, outline: 'none', width: 240,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold-border)'}
              onBlur={e => e.target.style.borderColor = 'var(--rule)'}
            />
          </div>

          <button onClick={() => onOpenChat(null)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', background: 'none',
            border: '1px solid var(--gold-border)', borderRadius: 10,
            color: 'var(--gold)', fontSize: 11, fontFamily: 'var(--font-body)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            transition: 'all 0.2s', marginRight: 8,
          }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(201,165,90,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >✦ Chat with Voya</button>

          <button onClick={() => openPalette('')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px',
            background: 'linear-gradient(135deg, #C9A55A, #8B6E35)',
            border: 'none', borderRadius: 8,
            color: 'var(--ink)', fontSize: 11, fontFamily: 'var(--font-body)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(201,165,90,0.25)', transition: 'all 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Ico d={I.users[0]} size={13} stroke="var(--ink)" /> Plan Together
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── Hero ── */}
        <div style={{ marginBottom: 64 }}>
          <p className="reveal-up" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
            AI-Powered Travel Planning
          </p>
          <h1 className="reveal-up" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px,6vw,82px)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.03em', lineHeight: 1.0, color: 'var(--ivory)', marginBottom: 20 }}>
            Every journey,<br />
            <em style={{ color: 'var(--gold)' }}>extraordinarily</em> crafted.
          </h1>
          <p className="fade-up" style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ivory-dim)', letterSpacing: '0.03em', lineHeight: 1.7, maxWidth: 500 }}>
            Tell Voya where you want to go — she'll check real weather, search live flights, and build a day-by-day itinerary. Or browse destinations and book directly with major platforms.
          </p>

          {/* Prompt hint */}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => onOpenChat({ initialMessage: PROMPTS[promptIdx] })}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--ink-raised)', border: '1px solid var(--rule-warm)',
                borderRadius: 12, padding: '12px 20px',
                color: 'var(--ivory-faint)', fontFamily: 'var(--font-body)',
                fontSize: 13, letterSpacing: '0.02em', transition: 'all 0.3s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold-border)'; e.currentTarget.style.color = 'var(--ivory)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--rule-warm)'; e.currentTarget.style.color = 'var(--ivory-faint)'; }}
            >
              <span style={{ color: 'var(--gold)', fontSize: 14 }}>✦</span>
              <span style={{ opacity: promptFading ? 0 : 1, transition: 'opacity 0.35s' }}>
                "{PROMPTS[promptIdx]}"
              </span>
            </button>
            <span style={{ fontSize: 11, color: 'var(--ivory-ghost)', fontFamily: 'var(--font-mono)' }}>try this →</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--rule)', marginBottom: 32 }} />

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {VIBES.map(v => (
              <button key={v} onClick={() => setVibe(v)} style={{
                padding: '6px 16px', borderRadius: 4,
                background: 'none',
                border: `1px solid ${vibe === v ? 'var(--gold-border-bright)' : 'var(--rule)'}`,
                color: vibe === v ? 'var(--gold)' : 'var(--ivory-faint)',
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)', transition: 'all 0.25s',
              }}>{v}</button>
            ))}
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ivory-ghost)', letterSpacing: '0.1em' }}>
            {filtered.length} destinations
          </span>
        </div>

        {/* ── Destination grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 80 }}>
          {filtered.map((d, i) => (
            <DestCard
              key={d.name}
              dest={d}
              index={i}
              onPlan={prompt => onOpenChat({ initialMessage: prompt })}
              onRoom={() => openPalette(d.name)}
            />
          ))}
        </div>

        {/* ── Book Direct section ── */}
        <div style={{ marginBottom: 80 }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--rule)', marginBottom: 40 }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
            Book Directly
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,48px)', fontStyle: 'italic', color: 'var(--ivory)', marginBottom: 8, fontWeight: 400 }}>
            Real packages from real platforms
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ivory-faint)', marginBottom: 32, maxWidth: 500 }}>
            Let Voya plan your itinerary, then book directly on your preferred platform — no middleman.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {PLATFORMS.map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'var(--ink-card)', border: '1px solid var(--rule)',
                borderRadius: 12, padding: '16px 18px',
                textDecoration: 'none', transition: 'all 0.25s',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--rule-warm)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: p.color, fontFamily: 'var(--font-body)' }}>{p.name}</span>
                  <Ico d={I.ext} size={12} stroke="var(--ivory-ghost)" />
                </div>
                <span style={{ fontSize: 11, color: 'var(--ivory-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{p.desc}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--rule)', opacity: 0.4, marginBottom: 20 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic', color: 'var(--ivory-ghost)' }}>Voya AI — Private Travel Intelligence</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ivory-ghost)', letterSpacing: '0.12em' }}>EST. 2025</span>
        </div>
      </main>

      <Palette show={palette} onClose={() => setPalette(false)} onEnterRoom={onEnterRoom} dest={paletteDest} />
    </div>
  );
}