import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';

export default function AdminLookup({ value, onLookup, placeholder, maxLength = 32 }: {
  value: string;
  onLookup: (value: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  if (previousValue !== value) {
    setPreviousValue(value);
    if (draft.trim().replace(/^#/, '') !== value) setDraft(value);
  }
  const lookup = useRef(onLookup);
  lookup.current = onLookup;
  useEffect(() => {
    if (draft.trim().replace(/^#/, '') === value) return;
    const timer = setTimeout(() => lookup.current(draft.trim()), 300);
    return () => clearTimeout(timer);
  }, [draft, value]);
  return <Input className="admin-lookup" prefix={<SearchOutlined />} allowClear aria-label={placeholder} placeholder={placeholder}
    maxLength={maxLength} value={draft} onChange={event => setDraft(event.target.value)} />;
}
