import { Segmented, Tooltip } from 'antd';
import dayjs from 'dayjs';

type TrendPoint = { period: string; value: number };

export default function ReportTrend<T extends string>({ points, monthly, metric, onMetricChange, options, format }: {
  points: TrendPoint[];
  monthly: boolean;
  metric: T;
  onMetricChange: (metric: T) => void;
  options: { value: T; label: string }[];
  format: (value: number) => string;
}) {
  const peak = Math.max(0, ...points.map(point => point.value));
  const scale = 10 ** Math.floor(Math.log10(Math.max(1, peak) / 4));
  const step = [1, 2, 2.5, 5, 10].map(factor => factor * scale).find(value => value * 4 >= peak) ?? scale * 10;
  const tick = Math.max(1, step);
  const limit = tick * 4;
  const label = options.find(option => option.value === metric)?.label;
  const positions = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const active = points.filter(point => point.value !== 0).length;
  const line = points.map((point, index) =>
    `${(index + 0.5) / points.length * 1000},${150 - point.value / limit * 150}`).join(' ');
  return <section className="admin-trend" aria-label="Xu hướng vận hành">
    <header className="admin-trend-head">
      <div><h2>Xu hướng vận hành</h2><p>{active === 1 ? `Chỉ có 1 ${monthly ? 'tháng' : 'ngày'} phát sinh` : `Theo ${monthly ? 'tháng' : 'ngày'} trong kỳ`}</p></div>
      <Segmented aria-label="Chỉ số biểu đồ" value={metric} onChange={onMetricChange} options={options} />
    </header>
    {points.length ? <div className="admin-trend-plot" role="group" aria-label={active <= 7 ? 'Biểu đồ cột theo thời gian' : 'Biểu đồ đường theo thời gian'}>
      <div className="admin-trend-scale" aria-hidden="true">{[4, 3, 2, 1, 0].map(multiplier =>
        <span key={multiplier}>{new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(tick * multiplier)}</span>)}</div>
      <div className="admin-trend-columns">
        {active > 7 && <svg className="admin-trend-area" viewBox="0 0 1000 150" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={line} fill="none" stroke="#1F7A6E" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {points.map((point, index) => point.value !== 0 && <circle key={point.period}
            cx={(index + 0.5) / points.length * 1000} cy={150 - point.value / limit * 150} r={4} fill="#1F7A6E" />)}
        </svg>}
        {points.map(point => {
          const date = dayjs(point.period).format(monthly ? 'MM/YYYY' : 'DD/MM/YYYY');
          return <Tooltip key={point.period} trigger={['hover', 'focus']} title={<>{date}<br />{label} · {format(point.value)}</>}>
            <button type="button" className="admin-trend-slot" tabIndex={point.value ? 0 : -1}
              aria-label={`${date}, ${label}, ${format(point.value)}`}>
              {active <= 7 && point.value > 0 && <span className="admin-trend-bar" style={{ height: `${100 * point.value / limit}%` }} />}
            </button>
          </Tooltip>;
        })}
      </div>
      <div className="admin-trend-periods">{positions.map(index => points[index] && <span key={index}>
        {dayjs(points[index].period).format(monthly ? 'MM/YYYY' : 'DD/MM')}
      </span>)}</div>
    </div> : <p className="admin-chart-note">Chưa có dữ liệu theo thời gian trong kỳ.</p>}
    {points.length > 0 && active === 0 && <p className="admin-chart-note">Không có phát sinh trong kỳ này</p>}
  </section>;
}
