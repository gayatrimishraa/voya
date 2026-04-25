import React, { useState } from 'react';
import styles from './ItineraryPanel.module.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function SkeletonLoader() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skBar} ${styles.skTitle}`} />
      <div className={`${styles.skBar} ${styles.skSub}`} />
      <div className={styles.skDivider} />
      <div className={`${styles.skBar} ${styles.skLine}`} />
      <div className={`${styles.skBar} ${styles.skLine}`} />
      <div className={`${styles.skBar} ${styles.skShort}`} />
      <div className={styles.skDivider} />
      <div className={`${styles.skBar} ${styles.skLine}`} />
      <div className={`${styles.skBar} ${styles.skLine}`} />
      <div className={`${styles.skBar} ${styles.skShort}`} />
    </div>
  );
}

export default function ItineraryPanel({ itinerary, sessionId, onClose, loading }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeDay, setActiveDay] = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading && !itinerary) {
    return (
      <aside className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>Building itinerary…</div>
            <div className={styles.panelSub}>Gathering real data</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <SkeletonLoader />
      </aside>
    );
  }

  if (!itinerary) return null;

  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const budget = itinerary.budgetBreakdown || {};
  const highlights = itinerary.highlights || [];
  const packing = itinerary.packingList || [];
  const tips = itinerary.insiderTips || [];
  const bookingLinks = itinerary.bookingLinks || {};
  const flightOptions = itinerary.flightOptions || [];
  const hotelOptions = itinerary.hotelOptions || [];
  const currentDay = days.find(d => d && d.day === activeDay) || days[0] || {};

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      await fetch(`${API}/saved-trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, trip: itinerary }),
      });
      setSaved(true);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'days', label: 'Daily Plan' },
    { id: 'budget', label: 'Budget' },
    { id: 'booking', label: 'Book' },
  ];

  return (
    <aside className={styles.panel} id="voya-itinerary-panel">
      {/* Header */}
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelTitle}>{itinerary.title || 'Your Itinerary'}</div>
          <div className={styles.panelSub}>
            {itinerary.destination} · {itinerary.duration} days
            {itinerary.travelMonth ? ` · ${itinerary.travelMonth}` : ''}
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.panelBody}>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className={styles.section}>
            {highlights.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>Highlights</h4>
                <ul className={styles.highlightList}>
                  {highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </>
            )}

            {itinerary.weatherNote && (
              <div className={styles.noteCard}>
                <span className={styles.noteIcon}>🌤</span>
                <p>{itinerary.weatherNote}</p>
              </div>
            )}

            {itinerary.festivalNote && (
              <div className={styles.noteCard}>
                <span className={styles.noteIcon}>🎉</span>
                <p>{itinerary.festivalNote}</p>
              </div>
            )}

            {itinerary.bestTimeToVisit && (
              <div className={styles.noteCard}>
                <span className={styles.noteIcon}>📅</span>
                <p>Best time: {itinerary.bestTimeToVisit}</p>
              </div>
            )}

            {packing.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>Packing List</h4>
                <div className={styles.packingGrid}>
                  {packing.map((item, i) => (
                    <span key={i} className={styles.packingItem}>□ {item}</span>
                  ))}
                </div>
              </>
            )}

            {tips.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>Insider Tips</h4>
                <ul className={styles.tipsList}>
                  {tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Days */}
        {activeTab === 'days' && (
          <div className={styles.section}>
            {days.length > 0 && (
              <div className={styles.dayPicker}>
                {days.map(d => d && (
                  <button
                    key={d.day}
                    className={`${styles.dayBtn} ${activeDay === d.day ? styles.dayBtnActive : ''}`}
                    onClick={() => setActiveDay(d.day)}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
            )}

            {currentDay && (
              <div className={styles.dayContent}>
                <h4 className={styles.dayTitle}>
                  Day {currentDay.day}: {currentDay.title || ''}
                </h4>

                {['morning', 'afternoon', 'evening'].map(period => {
                  const slot = currentDay[period];
                  if (!slot || !slot.activity) return null;
                  return (
                    <div key={period} className={styles.activityCard}>
                      <div className={styles.actPeriod}>{period}</div>
                      <div className={styles.actName}>{slot.activity}</div>
                      <p className={styles.actDesc}>{slot.description}</p>
                      <div className={styles.actMeta}>
                        {slot.duration && <span>⏱ {slot.duration}</span>}
                        {slot.cost && <span>💰 {slot.cost}</span>}
                      </div>
                      {slot.tips && <p className={styles.actTip}>💡 {slot.tips}</p>}
                    </div>
                  );
                })}

                {currentDay.accommodation && currentDay.accommodation.name && (
                  <div className={styles.accomCard}>
                    <div className={styles.accomLabel}>🏨 Stay</div>
                    <div className={styles.accomName}>{currentDay.accommodation.name}</div>
                    <div className={styles.accomMeta}>
                      {currentDay.accommodation.type && <span>{currentDay.accommodation.type}</span>}
                      {currentDay.accommodation.cost && <span>{currentDay.accommodation.cost}</span>}
                    </div>
                    {currentDay.accommodation.bookingLink && (
                      <a href={currentDay.accommodation.bookingLink} target="_blank" rel="noopener noreferrer" className={styles.bookLink}>
                        Book →
                      </a>
                    )}
                  </div>
                )}

                {currentDay.transport && (
                  <div className={styles.transportNote}>🚗 {currentDay.transport}</div>
                )}

                {currentDay.dailyCost && (
                  <div className={styles.dailyCost}>Day total: {currentDay.dailyCost}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Budget */}
        {activeTab === 'budget' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Budget Breakdown</h4>
            {Object.keys(budget).length > 0 ? (
              <div className={styles.budgetGrid}>
                {Object.entries(budget).map(([key, val]) => (
                  <div key={key} className={styles.budgetRow}>
                    <span className={styles.budgetLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className={styles.budgetVal}>{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyNote}>Budget details will appear once your itinerary is generated.</p>
            )}
          </div>
        )}

        {/* Booking */}
        {activeTab === 'booking' && (
          <div className={styles.section}>
            {flightOptions.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>✈️ Flight Options</h4>
                {flightOptions.map((f, i) => (
                  <div key={i} className={styles.bookingCard}>
                    <div className={styles.bookingName}>{f.airline}</div>
                    <div className={styles.bookingPrice}>{f.price}</div>
                    {f.link && (
                      <a href={f.link} target="_blank" rel="noopener noreferrer" className={styles.bookLink}>
                        Book →
                      </a>
                    )}
                  </div>
                ))}
              </>
            )}

            {hotelOptions.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>🏨 Hotel Options</h4>
                {hotelOptions.map((h, i) => (
                  <div key={i} className={styles.bookingCard}>
                    <div className={styles.bookingName}>{h.name} {'⭐'.repeat(h.stars || 0)}</div>
                    <div className={styles.bookingPrice}>{h.price}</div>
                    {h.link && (
                      <a href={h.link} target="_blank" rel="noopener noreferrer" className={styles.bookLink}>
                        Book →
                      </a>
                    )}
                  </div>
                ))}
              </>
            )}

            {Object.keys(bookingLinks).length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>🔗 Quick Links</h4>
                <div className={styles.quickLinks}>
                  {Object.entries(bookingLinks).map(([label, url]) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
                      {label} →
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.panelFooter}>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`}
          onClick={handleSave}
          disabled={saved || saving}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : '♡ Save Trip'}
        </button>
        <button className={styles.exportBtn} onClick={handleExport}>
          ↓ Export
        </button>
      </div>
    </aside>
  );
}
