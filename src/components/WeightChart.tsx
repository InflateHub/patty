import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeightEntry } from '../hooks/useWeightLog';

interface Props {
  entries: WeightEntry[];
}

interface ChartPoint {
  date: string;
  value: number;
  unit: string;
}

const PATTY_GREEN = '#5C7A6E';

export const WeightChart: React.FC<Props> = ({ entries }) => {
  // Chart is chronological (oldest → newest)
  const data: ChartPoint[] = useMemo(
    () =>
      [...entries]
        .sort((a, b) => {
          const aKey = a.created_at ?? a.id;
          const bKey = b.created_at ?? b.id;
          if (a.date !== b.date) return a.date < b.date ? -1 : 1;
          return aKey < bKey ? -1 : 1;
        })
        .map((e) => ({
          date: e.date,
          value: e.value,
          unit: e.unit,
        })),
    [entries]
  );

  if (data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.45 }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          {data.length === 0
            ? 'No entries yet — add your first weight below.'
            : 'Add at least two entries to see the chart.'}
        </p>
      </div>
    );
  }

  const unit = data[0].unit;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ion-color-light-shade, #d7d8da)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v}`}
          unit={` ${unit}`}
          width={52}
        />
        <Tooltip
          formatter={(value: number | undefined) => value !== undefined ? [`${value} ${unit}`, 'Weight'] : ['—', 'Weight']}
          labelFormatter={(label: unknown) => {
            const str = String(label);
            const d = new Date(str);
            return isNaN(d.getTime()) ? str : d.toLocaleDateString();
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={PATTY_GREEN}
          strokeWidth={2}
          dot={{ r: 3, fill: PATTY_GREEN }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
