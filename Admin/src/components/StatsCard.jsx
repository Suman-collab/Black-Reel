import '../styles/StatsCard.css';

const StatsCard = ({ title, value, icon, trend, trendValue }) => {
  return (
    <div className="stats-card">
      <div className="stats-header">
        <h3 className="stats-title">{title}</h3>
        <div className="stats-icon">{icon}</div>
      </div>
      <div className="stats-body">
        <h2 className="stats-value">{value}</h2>
        {trend && (
          <p className={`stats-trend ${trend === 'up' ? 'positive' : 'negative'}`}>
            <span>{trend === 'up' ? '↑' : '↓'}</span> {trendValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
