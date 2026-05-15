import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { BreakdownItem } from '@/types/footprint';

const COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#10B981', '#F97316', '#6366F1'];

interface Props {
  breakdown: BreakdownItem[];
}

export function ResultBreakdownChart({ breakdown }: Props) {
  const { t } = useTranslation();

  const data = breakdown
    .map((item, i) => ({
      name: t(`footprint.categories.${item.category}`, item.category),
      value: item.totalKgCO2e,
      percentage: item.percentage,
      color: COLORS[i % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 16, bottom: 0, left: 8 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#374151' }}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            width={48}
          />
          <Tooltip
            formatter={(value: unknown) => `${Number(value).toFixed(1)} ${t('units.kgco2e')}`}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            barSize={32}
            label={(props: { x?: string | number; y?: string | number; width?: string | number; value?: unknown }) => (
              <text x={Number(props.x ?? 0) + Number(props.width ?? 0) / 2} y={Number(props.y ?? 0) - 6} textAnchor="middle" fontSize={11} fill="#6B7280">
                {Number(props.value ?? 0).toFixed(1)}
              </text>
            )}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
