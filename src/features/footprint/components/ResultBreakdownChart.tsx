import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { BreakdownItem } from '@/types/footprint';

const COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#10B981', '#F97316', '#6366F1'];

interface Props {
  breakdown: BreakdownItem[];
}

export function ResultBreakdownChart({ breakdown }: Props) {
  const { t } = useTranslation();

  const data = breakdown.map((item, i) => ({
    name: t(`footprint.categories.${item.category}`, item.category),
    value: item.totalKgCO2e,
    percentage: item.percentage,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            label={(props) => {
              const p = props as unknown as { name: string; percentage: number };
              return `${p.name} (${p.percentage.toFixed(1)}%)`;
            }}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: unknown) => `${Number(value).toFixed(1)} ${t('units.kgco2e')}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
