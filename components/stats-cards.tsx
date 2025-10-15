type Stat = {
  title: string;
  value: number | string;
  subtext?: string;
};

type StatsCardsProps = {
  stats: Stat[];
};

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.title} className="card">
          <div className="text-sm text-gray-500">{stat.title}</div>
          <div className="text-2xl font-bold text-[var(--c-dark)] mt-1">{stat.value}</div>
          {stat.subtext && <p className="text-xs text-gray-500 mt-2">{stat.subtext}</p>}
        </div>
      ))}
    </div>
  );
}
