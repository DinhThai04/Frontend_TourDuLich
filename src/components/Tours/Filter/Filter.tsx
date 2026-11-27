import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Collapse, DatePicker, Radio, Select, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { getAllDepartures, getAllDestinations, getAllVehicles } from '@/services/tourServices';
import { settledRows } from '@/utils/settledRows';
import { BUDGET_BUCKETS, budgetKeyFromParams, budgetParams, formatVehicleLabel, TOUR_FILTER_KEYS } from '@/utils/tourSearch';
import type { ILocation, ITour, IVehicle } from '@/types/Tour';
import type { useSearchParams } from 'react-router-dom';

dayjs.locale('vi');

interface IProps {
  tours: ITour[] | null;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
  onVehiclesLoaded?: (vehicles: IVehicle[]) => void;
}

const Filter = ({ tours, searchParams, setSearchParams, onVehiclesLoaded }: IProps) => {
  const [departure, setDeparture] = useState<ILocation[]>([]);
  const [destination, setDestination] = useState<ILocation[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);

  const [budget, setBudget] = useState<string | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [departureDate, setDepartureDate] = useState<Dayjs | null>(null);
  const [selectedTransports, setSelectedTransports] = useState<string[]>([]);

  const debounceRef = useRef<number | null>(null);
  const lastUrlKey = useRef<string | null>(null);

  // Sync URL -> local state
  useEffect(() => {
    const key = TOUR_FILTER_KEYS.map((name) => searchParams.get(name) ?? '').join('|');
    if (key === lastUrlKey.current) return;
    lastUrlKey.current = key;

    const dest = searchParams.get('dest');
    const depD = searchParams.get('depD');
    const minP = searchParams.get('minP');
    const maxP = searchParams.get('maxP');
    const veh = searchParams.get('veh');
    const dep = searchParams.get('dep');

    setSelectedDestination(dest);
    setSelectedDeparture(dep);
    setDepartureDate(depD && dayjs(depD).isValid() && !dayjs(depD).isBefore(dayjs(), 'day') ? dayjs(depD) : null);
    setSelectedTransports(veh ? veh.split(',').filter(Boolean) : []);
    setBudget(budgetKeyFromParams(minP, maxP));
  }, [searchParams]);

  // Load filter catalog options
  useEffect(() => {
    let active = true;
    setCatalogError(false);
    void Promise.allSettled([getAllDepartures(), getAllDestinations(), getAllVehicles()])
      .then(([deps, dests, vehs]) => {
        if (!active) return;
        const depRows = settledRows(deps);
        const destRows = settledRows(dests);
        const vehRows = settledRows(vehs);
        setDeparture(depRows);
        setDestination(destRows);
        setVehicles(vehRows);
        onVehiclesLoaded?.(vehRows);
        const complete = [deps, dests, vehs].every((r) => r.status === 'fulfilled' && r.value.code === 1000);
        setCatalogError(!complete);
      })
      .catch(() => { if (active) setCatalogError(true); });
    return () => { active = false; };
  }, [catalogAttempt, onVehiclesLoaded]);

  // Live debounced URL sync (300ms)
  const scheduleApply = (next: {
    budget: string | null;
    dep: string | null;
    dest: string | null;
    depD: Dayjs | null;
    veh: string[];
  }) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('minP');
      newParams.delete('maxP');
      const range = budgetParams(next.budget);
      if (range) {
        newParams.set('minP', range.minP);
        if (range.maxP !== null) newParams.set('maxP', range.maxP);
      }
      if (next.dest) newParams.set('dest', next.dest);
      else newParams.delete('dest');
      if (next.dep) newParams.set('dep', next.dep);
      else newParams.delete('dep');
      if (next.depD) newParams.set('depD', next.depD.format('YYYY-MM-DD'));
      else newParams.delete('depD');
      if (next.veh.length > 0) newParams.set('veh', next.veh.join(','));
      else newParams.delete('veh');
      newParams.set('page', '0');

      const nextKey = TOUR_FILTER_KEYS.map((name) => newParams.get(name) ?? '').join('|');
      lastUrlKey.current = nextKey;
      setSearchParams(newParams, { replace: true });
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  // Optional counts from currently visible tours
  const vehicleCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tours ?? []) {
      const id = String(t.vehicle?.id ?? '');
      if (id) map[id] = (map[id] ?? 0) + 1;
    }
    return map;
  }, [tours]);

  const items = [
    {
      key: 'budget',
      label: <span className="text-[14px] font-semibold text-[#134E48]">Ngân sách</span>,
      children: (
        <Radio.Group
          value={budget ?? 'all'}
          onChange={(e: RadioChangeEvent) => {
            const val = e.target.value === 'all' ? null : e.target.value;
            setBudget(val);
            scheduleApply({ budget: val, dep: selectedDeparture, dest: selectedDestination, depD: departureDate, veh: selectedTransports });
          }}
        >
          <Space direction="vertical" size={10}>
            <Radio value="all" className="text-[14px] text-[#1F2937]">Không giới hạn</Radio>
            {BUDGET_BUCKETS.map((bucket) => (
              <Radio key={bucket.key} value={bucket.key} className="text-[14px] text-[#1F2937]">
                {bucket.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      ),
    },
    {
      key: 'departure',
      label: <span className="text-[14px] font-semibold text-[#134E48]">Điểm khởi hành</span>,
      children: (
        <Select
          className="w-full"
          value={selectedDeparture}
          onChange={(val) => {
            const next = val ?? null;
            setSelectedDeparture(next);
            scheduleApply({ budget, dep: next, dest: selectedDestination, depD: departureDate, veh: selectedTransports });
          }}
          options={departure}
          fieldNames={{ label: 'city', value: 'city' }}
          placeholder="Tất cả điểm khởi hành"
          allowClear
        />
      ),
    },
    {
      key: 'destination',
      label: <span className="text-[14px] font-semibold text-[#134E48]">Điểm đến</span>,
      children: (
        <Select
          className="w-full"
          value={selectedDestination}
          onChange={(val) => {
            const next = val ?? null;
            setSelectedDestination(next);
            scheduleApply({ budget, dep: selectedDeparture, dest: next, depD: departureDate, veh: selectedTransports });
          }}
          options={destination}
          fieldNames={{ label: 'city', value: 'city' }}
          placeholder="Tất cả điểm đến"
          allowClear
        />
      ),
    },
    {
      key: 'date',
      label: <span className="text-[14px] font-semibold text-[#134E48]">Ngày đi</span>,
      children: (
        <DatePicker
          className="w-full"
          value={departureDate}
          onChange={(date) => {
            setDepartureDate(date);
            scheduleApply({ budget, dep: selectedDeparture, dest: selectedDestination, depD: date, veh: selectedTransports });
          }}
          disabledDate={(current) => !!current && current.isBefore(dayjs(), 'day')}
          format="DD/MM/YYYY"
          placeholder="Chọn ngày khởi hành"
        />
      ),
    },
    {
      key: 'vehicle',
      label: <span className="text-[14px] font-semibold text-[#134E48]">Phương tiện</span>,
      children: (
        <Checkbox.Group
          value={selectedTransports}
          onChange={(vals) => {
            const next = vals as string[];
            setSelectedTransports(next);
            scheduleApply({ budget, dep: selectedDeparture, dest: selectedDestination, depD: departureDate, veh: next });
          }}
          className="flex flex-col gap-2.5"
        >
          {vehicles.map((v) => {
            const count = vehicleCounts[String(v.id)];
            return (
              <Checkbox key={v.id} value={v.id} className="text-[14px] text-[#1F2937]">
                <span>{formatVehicleLabel(v.name)}</span>
                {typeof count === 'number' && count > 0 && (
                  <span className="ml-1.5 text-[12px] text-[#6B7280]">({count})</span>
                )}
              </Checkbox>
            );
          })}
        </Checkbox.Group>
      ),
    },
  ];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-[0_4px_16px_rgba(19,78,72,0.05)]">
      <div className="pb-3 mb-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <h2 className="m-0 text-[16px] font-bold text-[#134E48]">Bộ lọc chuyến đi</h2>
      </div>
      {catalogError && (
        <Alert
          type="info"
          className="mb-3"
          style={{ background: '#E6F4F1', borderColor: '#A7D7CF' }}
          message="Chưa tải đủ tùy chọn lọc"
          action={<Button size="small" onClick={() => setCatalogAttempt((v) => v + 1)}>Thử lại</Button>}
        />
      )}
      <Collapse
        ghost
        defaultActiveKey={['budget']}
        expandIconPosition="end"
        items={items}
        className="tour-filter-accordion [&_.ant-collapse-header]:!px-1 [&_.ant-collapse-header]:!py-3 [&_.ant-collapse-content-box]:!px-1 [&_.ant-collapse-content-box]:!pt-1 [&_.ant-collapse-content-box]:!pb-3 [&_.ant-collapse-item]:border-b [&_.ant-collapse-item]:border-[#E5E7EB] [&_.ant-collapse-item:last-child]:border-b-0"
      />
    </div>
  );
};

export default Filter;
