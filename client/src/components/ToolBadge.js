import React from 'react';

const TOOL_META = {
  get_weather: { icon: '🌤', label: 'Weather', color: '#5BA8B5' },
  search_flights: { icon: '✈️', label: 'Flights', color: '#B794F4' },
  search_hotels: { icon: '🏨', label: 'Hotels', color: '#E8943A' },
  calculate_budget: { icon: '💰', label: 'Budget', color: '#68D391' },
  calculate_route: { icon: '🗺️', label: 'Route', color: '#C9A55A' },
  search_places: { icon: '📍', label: 'Places', color: '#FC8181' },
  analyze_image: { icon: '📸', label: 'Vision', color: '#63B3ED' },
};

export default function ToolBadge({ tool }) {
  const meta = TOOL_META[tool] || { icon: '🔧', label: tool, color: '#8A8070' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      background: `${meta.color}15`,
      border: `1px solid ${meta.color}30`,
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "'DM Mono', monospace",
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: meta.color,
      animation: 'fadeIn 0.3s ease both',
    }}>
      <span style={{ fontSize: 12 }}>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
