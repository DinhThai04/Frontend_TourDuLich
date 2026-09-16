import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Button, DatePicker, Divider, Flex, Select, type SelectProps } from 'antd';
import type { DatePickerProps } from 'antd/lib';
import { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { searchLocation } from '@/services/tourServices';
import { Calendar, LocationEdit, Ticket } from 'lucide-react';

interface DestinationOption {
  value: string | number;
  label: string;
}

const Tours = () => {
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Dayjs | null>(null);
  const [priceRange, setPriceRange] = useState(null); // Lưu giá trị của Select
  const [options, setOptions] = useState<DestinationOption[]>([]); // <-- Dùng type đã định nghĩa

  const navigate = useNavigate();

  const onChangeDestination = (value: string) => {
    setDestination(value);
  };

  const onChangeDate: DatePickerProps['onChange'] = (date, dateString) => {
    console.log('onChangeDate: ', date, dateString);
    if (date) {
      setDepartureDate(date);
    }
  };

  const onChangePrice: SelectProps['onChange'] = (value) => {
    console.log('onChangePrice: ', value);
    setPriceRange(value);
  };

  const dataRangePrices = [
    { value: 'under5', label: 'Dưới 5 triệu' },
    { value: '5to10', label: 'Từ 5 đến 10 triệu' },
    { value: '10to20', label: 'Từ 10 đến 20 triệu' },
    { value: 'over20', label: 'Trên 20 triệu' },
  ];

  const handleSearch = async () => {
    const params = new URLSearchParams();

    if (destination) {
      params.append('dest', destination);
    }

    if (departureDate) {
      params.append('depD', departureDate.format('YYYY-MM-DD'));
    }

    if (priceRange) {
      switch (priceRange) {
        case 'under5':
          params.append('minP', '0');
          params.append('maxP', '5000000');
          break;
        case '5to10':
          params.append('minP', '5000000');
          params.append('maxP', '10000000');
          break;
        case '10to20':
          params.append('minP', '10000000');
          params.append('maxP', '20000000');
          break;
        case 'over20':
          params.append('minP', '20000000');
          break;

        default:
          params.append('minP', '0');
      }
    }

    params.append('page', '0'); // Bắt đầu từ trang 0
    params.append('size', import.meta.env.VITE_PAGE_SIZE || 5);

    navigate(`/tours/search?${params.toString()}`);
  };

  const fetchSuggestions = async (searchText: string): Promise<void> => {
    if (!searchText) {
      setOptions([]);
      return;
    }

    const res = await searchLocation(searchText, false);
    if (res.code === 1000) {
      const formattedOptions: DestinationOption[] = res.result.map((lo) => ({
        value: lo.city, // Giá trị khi chọn
        label: lo.city, // Văn bản hiển thị
      }));

      setOptions(formattedOptions);
    }
  };

  // 6. Tạo hàm debounced để dùng trong 'onSearch'
  const debouncedSearchHandler = useMemo(
    () => debounce(fetchSuggestions, 300), // Chờ 300ms
    []
  );

  return (
    <div>
      <Flex vertical={false} className="!p-2 md:px-3">
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
            onSearch={debouncedSearchHandler}
            allowClear
            placeholder="Chọn địa điểm"
            variant="borderless"
            // Thêm w-full để nó lấp đầy container flex
            className="!p-0 text-[16px] font-medium w-full "
            // 2. Hiển thị nội dung khi không tìm thấy
            notFoundContent={<div className="text-center p-2">Không có kết quả phù hợp</div>}
          />
        </div>

        <Divider type="vertical" className="h-[70px] w-[1px] mx-3" />

        {/* Departure date */}
        <div className="flex-[3]">
          <p className="m-0 mb-1 text-[16px] font-medium text-[#7BBCB0] flex items-center gap-2">
            <Calendar />
            Ngày đi
          </p>
          <DatePicker
            format="dddd, DD/MM/YYYY"
            variant="borderless"
            className="!p-0 text-[18px] font-medium"
            suffixIcon=""
            itemScope
            value={departureDate} // <-- Kết nối
            onChange={onChangeDate} // <-- Kết nối
            placeholder="Chọn ngày đi"
            inputReadOnly
          />
        </div>

        <Divider type="vertical" className="h-[70px] w-[1px] ml-3 mr-[11px]" />

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
          <Button className="!h-full !border-[#7BBCB0]" onClick={handleSearch}>
            <SearchOutlined className="text-[20px] px-[6px] !text-[#7BBCB0]" />
          </Button>
        </div>
      </Flex>
    </div>
  );
};

export default Tours;
