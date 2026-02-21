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
import type { TrendDay } from '../hooks/useTrends';
import { formatDuration } from '../track/trackUtils';

interface Props {
  days: TrendDay[];
}

const PATTY_GREEN = '#5C7A6E';
const PATTY_BLUE = '#4A7A8E';
const PATTY_AMBER = '#8E7A3F';

const axisStyle = { fontSize: 10 };
const tickFmt = (v: string) => {
  const d = new Date(v);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const EMPTY_MSG = 'No data in the last 30 days.';

const cardStyle: React.CSSProperties = {
  margin: '0 0 12px',
  borderRadius: 'var(--md-shape-xl)',
  border: '1px solid var(--md-outline-variant)',
  background: 'var(--md-surface)',
  padding: '12px 12px 4px',
};

const chartLabel: React.CSSProperties = {
  fontSize: 'var(--md-label-lg)',
  fontFamily: 'var(--md-font)',
  color: 'var(--md-on-surface-variant)',
  marginBottom: 8,
  display: 'block',
};

export const TrendCharts: React.FC<Props> = ({ days }) => {
  // Weight — filter to days that have an entry
  const weightData = useMemo(
    () =>
      days
        .filter((d) => d.weight !== null)
        .map((d) => ({ date: d.date, value: d.weight as number })),
    [days]
  );

  // Water — all 30 days (0 = no logging)
  const waterData = useMemo(
    () => days.map((d) => ({ date: d.date, value: Math.round(d.waterMl / 100) / 10 })),
    [days]
  );

  // Sleep — filter to days that have an entry
  const sleepData = useMemo(
    () =>
      days
        .filter((d) => d.sleepMin !== null)
        .map((d) => ({ date: d.date, value: Math.round(((d.sleepMin as number) / 60) * 10) / 10 })),
    [days]
  );

  return (
    <>
      {/* Weight chart */}
      <div style={cardStyle}>
        <span style={chartLabel}>⚖️ Weight</span>
        {weightData.length < 2 ? (
          <p style={{ textAlign: 'center', opacity: 0.45, fontSize: 13, margin: '12px 0' }}>
            {EMPTY_MSG}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ion-color-light-shade, #d7d8da)" />
              <XAxis dataKey="date" tick={axisStyle} tickFormatter={tickFmt} />
              <YAxis tick={axisStyle} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v: number | undefined) => v !== undefined ? [`${v} kg`, 'Weight'] : ['—', 'Weight']}
                labelFormatter={(l: unknown) => tickFmt(String(l))}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={PATTY_GREEN}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Water chart */}
      <div style={cardStyle}>
        <span style={chartLabel}>💧 Daily Water (L)</span>
        {waterData.every((d) => d.value === 0) ? (
          <p style={{ textAlign: 'center', opacity: 0.45, fontSize: 13, margin: '12px 0' }}>
            {EMPTY_MSG}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={waterData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ion-color-light-shade, #d7d8da)" />
              <XAxis dataKey="date" tick={axisStyle} tickFormatter={tickFmt} />
              <YAxis tick={axisStyle} domain={[0, 'auto']} unit=" L" />
              <Tooltip
                formatter={(v: number | undefined) => v !== undefined ? [`${v} L`, 'Water'] : ['—', 'Water']}
                labelFormatter={(l: unknown) => tickFmt(String(l))}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={PATTY_BLUE}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sleep chart */}
      <div style={cardStyle}>
        <span style={chartLabel}>🌙 Sleep (hours)</span>
        {sleepData.length < 2 ? (
          <p style={{ textAlign: 'center', opacity: 0.45, fontSize: 13, margin: '12px 0' }}>
            {EMPTY_MSG}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sleepData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ion-color-light-shade, #d7d8da)" />
              <XAxis dataKey="date" tick={axisStyle} tickFormatter={tickFmt} />
              <YAxis tick={axisStyle} domain={[0, 12]} unit=" h" />
              <Tooltip
                formatter={(v: number | undefined) => v !== undefined ? [formatDuration(Math.round(v * 60)), 'Sleep'] : ['—', 'Sleep']}
                labelFormatter={(l: unknown) => tickFmt(String(l))}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={PATTY_AMBER}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
};
