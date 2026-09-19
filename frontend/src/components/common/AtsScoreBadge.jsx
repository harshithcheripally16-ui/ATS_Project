import React from 'react';

export default function AtsScoreBadge({ ats, showDetails = false }) {
  if (!ats) {
    return <span className="badge badge-ats-low" style={{ fontSize: '0.72rem' }}>N/A</span>;
  }

  const score = ats.score ?? 0;
  let badgeClass = 'badge-ats-low';
  let icon = 'sentiment_dissatisfied';

  if (score >= 80) {
    badgeClass = 'badge-ats-strong';
    icon = 'verified';
  } else if (score >= 60) {
    badgeClass = 'badge-ats-good';
    icon = 'auto_awesome';
  } else if (score >= 40) {
    badgeClass = 'badge-ats-moderate';
    icon = 'trending_flat';
  }

  const title = `Skills: ${ats.breakdown?.skills_score || 0}%, Exp: ${ats.breakdown?.experience_score || 0}%, Role: ${ats.breakdown?.role_score || 0}%`;

  return (
    <span className={`badge ${badgeClass}`} title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span className="material-icons" style={{ fontSize: '13px' }}>{icon}</span>
      <span>{score}% Match</span>
    </span>
  );
}
