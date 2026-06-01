const StatsCard = ({ title, value, icon, trend, trendValue }) => {
  return (
    <div className="admin-stat-card animate-fade-in">
      <div className="admin-stat-card__icon">
        {icon}
      </div>
      <div className="admin-stat-card__value">
        {value}
      </div>
      <div className="admin-stat-card__label">
        {title}
      </div>
      {trend && (
        <span className={`admin-stat-card__change ${trend === 'up' ? 'up' : 'down'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </span>
      )}
    </div>
  );
};

export default StatsCard;

