export default function AchievementBadge({ badge, earned }) {
  return (
    <div className={`achievement-badge ${earned ? 'achievement-badge--earned' : 'achievement-badge--locked'}`}>
      <div className="achievement-badge__icon">
        {badge.image ? <img src={badge.image} alt="" /> : badge.icon}
      </div>
      <div>
        <h4>{badge.name}</h4>
        <p>{badge.description}</p>
        <small>{badge.condition}</small>
        {earned?.earnedAt && <time>Earned {new Date(earned.earnedAt).toLocaleDateString()}</time>}
      </div>
    </div>
  );
}
