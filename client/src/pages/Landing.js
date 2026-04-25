import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

// ── Curated destinations ──────────────────────────────────────────────────────
const DESTINATIONS = [
  {
    name: 'Goa', vibe: 'Beach', roman: 'I',
    accent: '#5BA8B5', gradient: 'linear-gradient(135deg, #001C22 0%, #000D12 100%)',
    season: 'Nov – Feb', days: '4–7', from: '₹12,000',
    tags: ['beaches', 'nightlife', 'food', 'colonial'],
    prompt: 'Plan a 5-day Goa trip in December for 2 people with a mid-range budget. I want beaches, good food and some nightlife.',
  },
  {
    name: 'Rajasthan', vibe: 'Heritage', roman: 'II',
    accent: '#C9A55A', gradient: 'linear-gradient(135deg, #1A1200 0%, #0D0900 100%)',
    season: 'Oct – Mar', days: '6–10', from: '₹18,000',
    tags: ['palaces', 'forts', 'desert', 'culture'],
    prompt: 'Plan a 7-day Rajasthan heritage trip covering Jaipur, Jodhpur and Udaipur in November. Budget is around ₹50,000 for 2 people.',
  },
  {
    name: 'Kerala', vibe: 'Nature', roman: 'III',
    accent: '#68D391', gradient: 'linear-gradient(135deg, #002210 0%, #001008 100%)',
    season: 'Sep – Mar', days: '5–8', from: '₹15,000',
    tags: ['backwaters', 'spices', 'ayurveda', 'wildlife'],
    prompt: 'Plan a 6-day Kerala trip with backwaters houseboat, Munnar tea estates and Kovalam beach for 2 people in January. Budget ₹45,000.',
  },
  {
    name: 'Ladakh', vibe: 'Adventure', roman: 'IV',
    accent: '#7BA05B', gradient: 'linear-gradient(135deg, #0D1A00 0%, #060D00 100%)',
    season: 'Jun – Sep', days: '7–12', from: '₹25,000',
    tags: ['high passes', 'monasteries', 'pangong', 'road trip'],
    prompt: 'Plan a 9-day Ladakh road trip in July starting from Manali, ending in Leh. Group of 4, SUV. Total budget ₹1,20,000.',
  },
  {
    name: 'Varanasi', vibe: 'Temple', roman: 'V',
    accent: '#E8943A', gradient: 'linear-gradient(135deg, #160800 0%, #0C0604 100%)',
    season: 'Oct – Mar', days: '3–5', from: '₹8,000',
    tags: ['ghats', 'aarti', 'spiritual', 'ancient'],
    prompt: 'Plan a 3-day spiritual trip to Varanasi and Sarnath in November. Solo traveller, budget ₹12,000. I want the full ghat experience.',
  },
  {
    name: 'Manali', vibe: 'Adventure', roman: 'VI',
    accent: '#B794F4', gradient: 'linear-gradient(135deg, #120D1A 0%, #08060D 100%)',
    season: 'Apr – Jun', days: '5–7', from: '₹10,000',
    tags: ['snow', 'rohtang', 'adventure', 'valleys'],
    prompt: 'Plan a 5-day Manali trip in June for 4 friends. We want snow activities, Rohtang Pass and camping. Budget ₹60,000 total.',
  },
];

const PLATFORMS = [
  { name: 'MakeMyTrip', desc: 'Flights · Hotels · Packages', color: '#E8102A', url: 'https://www.makemytrip.com/' },
  { name: 'Booking.com', desc: 'Hotels · Apartments · Resorts', color: '#003580', url: 'https://www.booking.com/' },
  { name: 'Cleartrip', desc: 'Flights · Trains · Hotels', color: '#E87722', url: 'https://www.cleartrip.com/' },
  { name: 'Agoda', desc: 'Hotels · Homes · Flights', color: '#5392F9', url: 'https://www.agoda.com/' },
  { name: 'Goibibo', desc: 'Flights · Hotels · Bus', color: '#009688', url: 'https://www.goibibo.com/' },
  { name: 'ixigo', desc: 'Flights · Trains · Hotels', color: '#FF6634', url: 'https://www.ixigo.com/' },
];

const PROMPTS = [
  '5-day Goa trip in December, 2 people, ₹20,000',
  'Spiritual journey to Varanasi and Sarnath',
  'Road trip: Mumbai to Goa, sedan, 2 people',
  'Budget Rajasthan trip under ₹30,000',
  'Ladakh adventure in July for 4 friends',
  'Romantic Kerala backwaters for a couple',
];

const VIBES = ['All', 'Beach', 'Heritage', 'Nature', 'Adventure', 'Temple'];

// ── Destination Card ──────────────────────────────────────────────────────────
function DestCard({ dest, onPlan }) {
  return (
    <article
      className={styles.card}
      style={{
        background: 'var(--ink-card)',
        border: `1px solid var(--rule)`,
      }}
    >
      <div className={styles.cardImage} style={{ background: dest.gradient }}>
        <div className={styles.cardGhost}>{dest.name[0]}</div>
        <div className={styles.cardName} style={{ textShadow: `0 2px 20px ${dest.accent}44` }}>
          {dest.name}
        </div>
        <div className={styles.cardRoman} style={{ color: dest.accent }}>{dest.roman}</div>
        <div className={styles.cardVibe}>{dest.vibe}</div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardMetaItem} style={{ color: 'var(--ivory-dim)' }}>{dest.days} nights</span>
          <span className={styles.cardMetaItem} style={{ color: dest.accent }}>from {dest.from}</span>
          <span className={styles.cardMetaItem} style={{ color: 'var(--ivory-faint)', marginLeft: 'auto' }}>{dest.season}</span>
        </div>
        <div className={styles.cardTags}>
          {dest.tags.map(t => <span key={t} className={styles.cardTag}>{t}</span>)}
        </div>
        <div className={styles.cardActions}>
          <button className={styles.planBtn} onClick={() => onPlan(dest.prompt)}>
            Plan with Voya
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [vibe, setVibe] = useState('All');
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptFading, setPromptFading] = useState(false);

  // Rotate prompt suggestions
  useEffect(() => {
    const t = setInterval(() => {
      setPromptFading(true);
      setTimeout(() => {
        setPromptIdx(i => (i + 1) % PROMPTS.length);
        setPromptFading(false);
      }, 350);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const filtered = DESTINATIONS.filter(d => {
    return vibe === 'All' || d.vibe === vibe;
  });

  const openChat = (prompt) => {
    navigate('/plan', { state: { initialMessage: prompt } });
  };

  return (
    <div className={styles.landing}>
      <div className={styles.ambientGlow} />

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <span className={styles.navLogoText}>Voya</span>
            <span className={styles.navLogoAi}>AI</span>
          </div>
          <div className={styles.navSpacer} />
          <button className={styles.navChatBtn} onClick={() => navigate('/plan')}>
            ✦ Chat with Voya
          </button>
        </div>
      </nav>

      <main className={styles.content}>
        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <p className={`${styles.heroTag} reveal-up`}>
            <span className={styles.heroTagLine} />
            AI-Powered Travel Planning
          </p>
          <h1 className={`${styles.heroTitle} reveal-up`}>
            Every journey,<br />
            <em className={styles.heroGold}>extraordinarily</em> crafted.
          </h1>
          <p className={`${styles.heroDesc} fade-up`}>
            Tell Voya where you want to go — she'll check real weather, search live flights, and build
            a day-by-day itinerary. Or browse destinations and book directly with major platforms.
          </p>

          {/* Prompt hint */}
          <div className={styles.promptHint}>
            <button className={styles.promptBtn} onClick={() => openChat(PROMPTS[promptIdx])}>
              <span className={styles.promptGlyph}>✦</span>
              <span style={{ opacity: promptFading ? 0 : 1, transition: 'opacity 0.35s' }}>
                "{PROMPTS[promptIdx]}"
              </span>
            </button>
            <span className={styles.promptLabel}>try this →</span>
          </div>
        </div>

        <hr className={styles.rule} />

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterBtns}>
            {VIBES.map(v => (
              <button
                key={v}
                className={`${styles.filterBtn} ${vibe === v ? styles.filterBtnActive : ''}`}
                onClick={() => setVibe(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <span className={styles.filterCount}>{filtered.length} destinations</span>
        </div>

        {/* Destination Grid */}
        <div className={styles.destGrid}>
          {filtered.map(d => (
            <DestCard key={d.name} dest={d} onPlan={openChat} />
          ))}
        </div>

        {/* Book Direct */}
        <div className={styles.platformSection}>
          <hr className={styles.rule} />
          <p className={styles.heroTag}>
            <span className={styles.heroTagLine} />
            Book Directly
          </p>
          <h2 className={styles.heroTitle} style={{ fontSize: 'clamp(28px, 3vw, 48px)', marginBottom: 8 }}>
            Real packages from real platforms
          </h2>
          <p className={styles.heroDesc} style={{ marginBottom: 32 }}>
            Let Voya plan your itinerary, then book directly on your preferred platform — no middleman.
          </p>
          <div className={styles.platformGrid}>
            {PLATFORMS.map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className={styles.platformCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: p.color }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--ivory-ghost)' }}>↗</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ivory-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                  {p.desc}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <hr className={styles.rule} style={{ opacity: 0.4 }} />
        <div className={styles.footer}>
          <span className={styles.footerLeft}>Voya AI — Private Travel Intelligence</span>
          <span className={styles.footerRight}>EST. 2025</span>
        </div>
      </main>
    </div>
  );
}
