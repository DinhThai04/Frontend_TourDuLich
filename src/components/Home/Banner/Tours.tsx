import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Divider, Select, type SelectProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDestinations } from '@/services/tourServices';
import { BUDGET_BUCKETS, budgetParams } from '@/utils/tourSearch';
import { Calendar, LocationEdit, Ticket } from 'lucide-react';
import SearchDatePicker from './SearchDatePicker';

interface DestinationOption {
  value: string;
  label: string;
}

const Tours = () => {
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Dayjs | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<DestinationOption[]>([]);
  const [options, setOptions] = useState<DestinationOption[]>([]);
  const [suggestionQuery, setSuggestionQuery] = useState('');

  const navigate = useNavigate();

  const onChangeDestination = (value: string) => {
    setDestination(value);
  };

  const onChangeDate = (date: Dayjs | null) => {
    setDepartureDate(date);
  };

  const onChangePrice: SelectProps['onChange'] = (value) => {
    setPriceRange(value ?? null);
  };

  const dataRangePrices = BUDGET_BUCKETS.map(({ key, label }) => ({ value: key, label }));

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination.trim()) params.append('dest', destination.trim());
    if (departureDate) params.append('depD', departureDate.format('YYYY-MM-DD'));
    if (priceRange) {
      const range = budgetParams(priceRange);
      if (range) {
        params.append('minP', range.minP);
        if (range.maxP !== null) params.append('maxP', range.maxP);
      }
    }
    params.append('page', '0');
    params.append('size', '6');
    navigate(`/tours/search?${params.toString()}`);
  };

  useEffect(() => {
    let active = true;
    void getAllDestinations()
      .then((res) => {
        if (!active || res.code !== 1000 || !Array.isArray(res.result)) return;
        const seen = new Set<string>();
        const mapped: DestinationOption[] = [];
        for (const loc of res.result) {
          const city = (loc.city || '').trim();
          if (!city || seen.has(city.toLowerCase())) continue;
          seen.add(city.toLowerCase());
          mapped.push({ value: city, label: city });
        }
        setAllLocations(mapped);
        setOptions(mapped);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const q = suggestionQuery.trim().toLowerCase();
    if (!q) {
      setOptions(allLocations);
      return;
    }
    setOptions(allLocations.filter((opt) => opt.label.toLowerCase().includes(q)));
  }, [suggestionQuery, allLocations]);

  return (
    <div>
      <div className="home-search-fields">
        {/* Where to travel */}
        <div className="home-search-destination">
          <p className="!m-0 !mb-1 text-[16px] font-bold flex items-center gap-2 text-[#21776D]">
            <LocationEdit className="text-[12px]" />
            Bạn muốn đi đâu?
          </p>
          <AutoComplete
            aria-label="Điểm đến"
            options={options}
            value={destination}
            onChange={onChangeDestination}
            onSearch={setSuggestionQuery}
            allowClear
            placeholder="Chọn địa điểm"
            variant="borderless"
            className="!p-0 text-[16px] font-medium w-full"
            notFoundContent={<div className="text-center p-2">Không có kết quả phù hợp</div>}
          />
        </div>

        <Divider type="vertical" className="hidden md:block h-[70px] w-[1px] mx-3" />

        {/* Departure date */}
        <div className="home-search-date">
          <p className="m-0 mb-1 text-[16px] font-medium text-[#21776D] flex items-center gap-2">
            <Calendar />
            Ngày đi
          </p>
          <SearchDatePicker value={departureDate} onChange={onChangeDate} />
        </div>

        <Divider type="vertical" className="hidden md:block h-[70px] w-[1px] ml-3 mr-[11px]" />

        {/* Price range + button */}
        <div className="home-search-budget">
          <div>
            <p className="m-0 mb-1 text-[16px] font-medium text-[#21776D] flex items-center gap-2">
              <Ticket />
              Ngân sách
            </p>
            <Select
              aria-label="Ngân sách"
              placeholder="Chọn mức giá"
              variant="borderless"
              allowClear
              value={priceRange}
              onChange={onChangePrice}
              options={dataRangePrices}
              className="!w-[180px]"
            />
          </div>
          <Button type="primary" className="home-search-submit" aria-label="Tìm tour" onClick={handleSearch}>
            <SearchOutlined />
            <span>Tìm tour</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tours;
