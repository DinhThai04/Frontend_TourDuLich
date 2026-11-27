import { Button, Input, Select, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { sizes, type PageSize } from './useAdminPagination';

export default function AdminPagination({ page, size, total, mode = size, onChange }: {
  page: number; size: number; total: number; mode?: PageSize; onChange: (page: number, size?: PageSize) => void;
}) {
  const last = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, last);
  const [draft, setDraft] = useState<string>();
  const [exceeded, setExceeded] = useState(false);
  useEffect(() => {
    if (!exceeded) return;
    const timer = window.setTimeout(() => setExceeded(false), 3500);
    return () => window.clearTimeout(timer);
  }, [exceeded]);
  const pages = last <= 7 ? Array.from({ length: last }, (_, i) => i + 1)
    : [...new Set([1, current - 1, current, current + 1, last])].filter(value => value >= 1 && value <= last);
  const firstRow = total ? (current - 1) * size + 1 : 0;
  return <nav className="admin-pagination" aria-label="Phân trang">
    <span>Hiển thị {firstRow}–{Math.min(total, current * size)} / {total}</span>
    {(total > 10 || last > 1) && <div className="admin-pagination-controls">
      {exceeded && <span className="admin-page-limit" role="tooltip">Tối đa {last} trang</span>}
      <Tooltip title="Trang trước"><Button aria-label="Trang trước" icon={<LeftOutlined />} disabled={current <= 1} onClick={() => onChange(current - 1)} /></Tooltip>
      {pages.map((value, index) => <span className="admin-pagination-item" key={value}>
        {index > 0 && value - pages[index - 1]! > 1 && <span aria-hidden="true">…</span>}
        {value === current ?
          <Input key={current} aria-label="Trang hiện tại, nhập số trang rồi nhấn Enter" inputMode="numeric"
            style={{ width: Math.max(36, String(last).length * 9 + 22) }}
            value={draft ?? String(current)} onFocus={event => event.target.select()}
            onChange={event => { setExceeded(false); setDraft(event.target.value.replace(/\D/g, '')); }}
            onBlur={() => setDraft(undefined)}
            onKeyDown={event => { if (event.key === 'Escape') { setDraft(undefined); setExceeded(false); event.stopPropagation(); } }}
            onPressEnter={() => {
              const entered = Number(draft ?? current);
              setDraft(undefined);
              if (entered < 1) return;
              setExceeded(entered > last);
              onChange(Math.min(last, entered));
            }} />
        : <Button aria-label={`Trang ${value}`} type="text" onClick={() => { setExceeded(false); onChange(value); }}>{value}</Button>}
      </span>)}
      <Tooltip title="Trang sau"><Button aria-label="Trang sau" icon={<RightOutlined />} disabled={current >= last} onClick={() => onChange(current + 1)} /></Tooltip>
      <Select aria-label="Số dòng mỗi trang" value={mode} onChange={value => { setExceeded(false); onChange(1, value); }}
        options={[{ value: 'auto', label: 'Tự động' }, ...sizes.map(value => ({ value, label: `${value} / trang` }))]} />
    </div>}
  </nav>;
}
