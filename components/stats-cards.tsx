import { Card, CardContent } from '@/components/ui/card';

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
        <Card key={stat.title} className="shadow-soft">
          <CardContent className="space-y-2">
            <div className="text-sm text-textc/70">{stat.title}</div>
            <div className="text-2xl font-bold text-textc">{stat.value}</div>
            {stat.subtext ? <p className="text-xs text-textc/60">{stat.subtext}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
