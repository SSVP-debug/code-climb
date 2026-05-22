import StatCard from "../StatCard";

function StatsSection({ statsData }) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      {statsData.map((stat, index) => (

        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          color={stat.color}
        />

      ))}

    </div>
  );
}

export default StatsSection;