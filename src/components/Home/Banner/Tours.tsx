import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Divider, Select, type SelectProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchLocation } from '@/services/tourServices';
import { BUDGET_BUCKETS, budgetParams } from '@/utils/tourSearch';
import { Calendar, LocationEdit, Ticket } from 'lucide-react';

interface DestinationOption {
  value: string | number;
  label: string;
}
const DatePicker = lazy(() => import('./SearchDatePicker'));

const Tours = () => {
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Dayjs | null>(null);
  const [priceRange, setPriceRange] = useState(null); // Lưu giá trị của Select
  const [options, setOptions] = useState<DestinationOption[]>([]); // <-- Dùng type đã định nghĩa
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [calendarLoaded, setCalendarLoaded] = useState(false);

  const navigate = useNavigate();

  const onChangeDestination = (value: string) => {
    setDestination(value);
  };

  const onChangeDate = (date: Dayjs | null) => {
    setDepartureDate(date);
  };

  const onChangePrice: SelectProps['onChange'] = (value) => {
    setPriceRange(value);
  };

  const dataRangePrices = BUDGET_BUCKETS.map(({ key, label }) => ({ value: key, label }));

  const handleSearch = async () => {
    const params = new URLSearchParams();

    if (destination) {
      params.append('dest', destination);
    }

    if (departureDate) {
      params.append('depD', departureDate.format('YYYY-MM-DD'));
    }

    if (priceRange) {
      const range = budgetParams(priceRange);
      if (range) {
        params.append('minP', range.minP);
        if (range.maxP !== null) params.append('maxP', range.maxP);
      }
    }

    params.append('page', '0'); // Bắt đầu từ trang 0
    params.append('size', import.meta.env.VITE_PAGE_SIZE || '10');

    navigate(`/tours/search?${params.toString()}`);
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (!suggestionQuery.trim()) { setOptions([]); return; }
      void searchLocation(suggestionQuery.trim(), false, controller.signal).then(res => {
        if (!controller.signal.aborted && res.code === 1000)
          setOptions(res.result.map(location => ({ value: location.city, label: location.city })));
      }).catch(() => { if (!controller.signal.aborted) setOptions([]); });
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [suggestionQuery]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 !p-2 md:px-3">
        {/* Where to travel */}
        <div className="flex-[4]">
          <p className="!m-0 !mb-1 text-[16px] font-bold flex items-center gap-2 text-[#7BBCB0]">
            <LocationEdit className="text-[12px]" />
            Bạn muốn đi đâu?
            <span className="text-red-500">*</span>
          </p>
          <AutoComplete
            options={options} // Hiển thị các gợi ý
            value={destination} // Vẫn kết nối với state của bạn
            onChange={onChangeDestination}
            onSearch={setSuggestionQuery}
            allowClear
            placeholder="Chọn địa điểm"
            variant="borderless"
            // Thêm w-full để nó lấp đầy container flex
            className="!p-0 text-[16px] font-medium w-full "
            // 2. Hiển thị nội dung khi không tìm thấy
            notFoundContent={<div className="text-center p-2">Không có kết quả phù hợp</div>}
          />
        </div>

        <Divider type="vertical" className="hidden md:block h-[70px] w-[1px] mx-3" />

        {/* Departure date */}
        <div className="flex-[3]">
          <p className="m-0 mb-1 text-[16px] font-medium text-[#7BBCB0] flex items-center gap-2">
            <Calendar />
            Ngày đi
          </p>
          {calendarLoaded ? <Suspense fallback={<span role="status">Đang tải lịch…</span>}><DatePicker
            value={departureDate} // <-- Kết nối
            onChange={onChangeDate} // <-- Kết nối
          /></Suspense> : <button type="button" onClick={() => setCalendarLoaded(true)}
            className="text-left min-h-10 text-[18px]" aria-label="Chọn ngày đi">
            {departureDate ? departureDate.format('DD/MM/YYYY') : 'Chọn ngày đi'}
          </button>}
        </div>

        <Divider type="vertical" className="hidden md:block h-[70px] w-[1px] ml-3 mr-[11px]" />

        {/* Price range + button */}
        <div className="flex flex-[3] justify-between">
          <div>
            <p className="m-0 mb-1 text-[16px] font-medium text-[#7BBCB0] flex items-center gap-2">
              <Ticket />
              Ngân sách
            </p>
            <Select
              placeholder="Chọn mức giá"
              variant="borderless"
              value={priceRange}
              onChange={onChangePrice} // <-- Kết nối
              options={dataRangePrices}
              className="!w-[180px]"
            />
          </div>
          <Button className="!h-auto !border-[#7BBCB0]" aria-label="Tìm tour" onClick={handleSearch}>
            <SearchOutlined className="text-[20px] px-[6px] !text-[#7BBCB0]" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tours;
