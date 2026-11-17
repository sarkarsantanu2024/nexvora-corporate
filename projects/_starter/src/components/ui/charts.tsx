'use client';

/**
 * Charts, in the brand colours. Thin wrappers over Recharts so every chart in
 * the app looks the same. Data is plain arrays; money is formatted here.
 *
 *   <BarsChart data={[{ label: 'Aug', collected: 84000, spent: 61000 }]} series={[{ key: 'collected', name: 'Collected' }, { key: 'spent', name: 'Spent' }]} money />
 *   <AreaTrend data={[{ label: 'Aug', value: 31 }]} name="Enquiries" />
 *   <Donut data={[{ name: 'Website', value: 12 }]} />
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { inr, inrShort } from '@/lib/money';

export const CHART_COLORS = ['#3f348f', '#2ec4a0', '#ffc83d', '#ff7a59', '#38b6ff', '#897ed6', '#e31e24'];

const axis = { fontSize: 12, fill: '#71718c' };
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #dfdfea',
  boxShadow: '0 8px 24px -8px rgba(26,26,44,.2)',
  fontSize: 13,
  padding: '8px 12px',
};

export type Series = { key: string; name: string; color?: string };

export function BarsChart({
  data,
  series,
  money,
  height = 280,
  stacked,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  money?: boolean;
  height?: number;
  stacked?: boolean;
}) {
  const format = (value: number) => (money ? inr(value) : value.toLocaleString('en-IN'));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="#eeeef5" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={money ? 56 : 36} tickFormatter={(v: number) => (money ? inrShort(v) : String(v))} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'rgba(63,52,143,.06)' }} contentStyle={tooltipStyle} formatter={(value: number, name: string) => [format(value), name]} />
          {series.length > 1 ? <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 8 }} /> : null}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} radius={stacked ? 0 : [6, 6, 0, 0]} maxBarSize={38} stackId={stacked ? 'a' : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaTrend({
  data,
  name,
  money,
  height = 240,
  color = '#3f348f',
}: {
  data: { label: string; value: number }[];
  name: string;
  money?: boolean;
  height?: number;
  color?: string;
}) {
  const id = `area-${name.replace(/\W/g, '')}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eeeef5" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={money ? 56 : 36} tickFormatter={(v: number) => (money ? inrShort(v) : String(v))} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [money ? inr(value) : value.toLocaleString('en-IN'), name]} />
          <Area type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({
  data,
  money,
  height = 240,
  centerLabel,
}: {
  data: { name: string; value: number }[];
  money?: boolean;
  height?: number;
  centerLabel?: string;
}) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  return (
    <div style={{ height }} className="relative w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none">
            {data.map((row, i) => (
              <Cell key={row.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [money ? inr(value) : value.toLocaleString('en-IN'), name]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[calc(50%-34px)] text-center">
        <p className="tabular font-display text-2xl font-bold leading-none text-ink-900">{money ? inrShort(total) : total.toLocaleString('en-IN')}</p>
        {centerLabel ? <p className="mt-1 text-xs text-ink-500">{centerLabel}</p> : null}
      </div>
    </div>
  );
}
