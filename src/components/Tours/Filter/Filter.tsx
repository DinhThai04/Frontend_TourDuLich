import { useEffect, useState } from 'react';
import { Select, Radio, DatePicker, Button, Checkbox, Space, Typography } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { getAllDepartures, getAllDestinations, getAllVehicles } from '@/services/tourServices';
import type { ILocation, ITour, IVehicle } from '@/types/Tour';
import type { useSearchParams } from 'react-router-dom';

dayjs.locale('vi');

const { Text } = Typography;

interface IProps {
  tours: ITour[] | null;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}

const getBudgetStateFromParams = (minP: string | null, maxP: string | null): string | null => {
  if (minP === '0' && maxP === '5000000') return '<5';
  if (minP === '5000000' && maxP === '10000000') return '5-10';
  if (minP === '10000000' && maxP === '20000000') return '10-20';
  if (minP === '20000000' && !maxP) return '>20';
  return null; // Không giới hạn
};

const Filter = ({ searchParams, setSearchParams }: IProps) => {
  // State để lưu trữ các giá trị của bộ lọc
  const [budget, setBudget] = useState<string | null>(null);
  const [departure, setDeparture] = useState<ILocation[] | null>(null);
  const [destination, setDestination] = useState<ILocation[] | null>(null);
  const [vehicles, setVehicles] = useState<IVehicle[] | null>(null);
  const [departureDate, setDepartureDate] = useState<Dayjs | null>(null);

  const [selectedTransports, setSelectedTransports] = useState<string[] | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  useEffect(() => {
    // Đọc các giá trị từ URL
    const dest = searchParams.get('dest');
    const depD = searchParams.get('depD');
    const minP = searchParams.get('minP');
    const maxP = searchParams.get('maxP');
    const veh = searchParams.get('veh');
    const dep = searchParams.get('dep');

    // Cập nhật state nội bộ của Filter để UI khớp với URL
    if (dest) setSelectedDestination(dest);
    if (dep) setSelectedDeparture(dep);
    if (depD) setDepartureDate(dayjs(depD));
    if (veh) setSelectedTransports(veh.split(',')); // Chuyển "1,2" thành ["1", "2"]

    // Đồng bộ budget
    const budgetState = getBudgetStateFromParams(minP, maxP);
    setBudget(budgetState);
  }, [searchParams]); // Phụ thuộc vào searchParams

  const handleApplyFilters = () => {
    // Tạo một bản sao của params hiện tại (ví dụ: để giữ 'sort')
    const newParams = new URLSearchParams(searchParams);

    // 1. Xử lý Budget (minP, maxP)
    newParams.delete('minP'); // Xóa key cũ
    newParams.delete('maxP');
    if (budget) {
      switch (budget) {
        case '<5':
          newParams.set('minP', '0');
          newParams.set('maxP', '5000000');
          break;
        case '5-10':
          newParams.set('minP', '5000000');
          newParams.set('maxP', '10000000');
          break;
        case '10-20':
          newParams.set('minP', '10000000');
          newParams.set('maxP', '20000000');
          break;
        case '>20':
          newParams.set('minP', '20000000');
          break;
      }
    }

    // 2. Xử lý Điểm đến (dest)
    if (selectedDestination) newParams.set('dest', selectedDestination);
    else newParams.delete('dest');

    // 3. Xử lý Điểm đi (dep)
    if (selectedDeparture) newParams.set('dep', selectedDeparture);
    else newParams.delete('dep');

    // 4. Xử lý Ngày đi (depD)
    if (departureDate) newParams.set('depD', departureDate.format('YYYY-MM-DD'));
    else newParams.delete('depD');

    // 5. Xử lý Phương tiện (veh)
    if (selectedTransports && selectedTransports.length > 0) {
      newParams.set('veh', selectedTransports.join(',')); // Chuyển ["1", "2"] thành "1,2"
    } else {
      newParams.delete('veh');
    }

    // 6. Reset về trang đầu tiên khi lọc
    newParams.set('page', '0');

    // 7. CẬP NHẬT URL (việc này sẽ trigger fetchTours trong ToursPage)
    setSearchParams(newParams);
  };

  const getAllData = async () => {
    const [departures, destinations, vehicles] = await Promise.all([
      getAllDepartures(),
      getAllDestinations(),
      getAllVehicles(),
    ]);

    return { departures, destinations, vehicles };
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllData();
      if (
        data.departures.code === 1000 &&
        data.destinations.code === 1000 &&
        data.vehicles.code === 1000
      ) {
        setDeparture(data.departures.result);
        setDestination(data.destinations.result);
        setVehicles(data.vehicles.result);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="!p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <Text strong className="!mb-2">
              Ngân sách
            </Text>
            <Radio.Group
              onChange={(e: RadioChangeEvent) => setBudget(e.target.value)}
              value={budget}
              className="mt-2"
            >
              <Space direction="vertical">
                <Radio value={null}>Không giới hạn</Radio>
                <Radio value="<5">Dưới 5 triệu</Radio>
                <Radio value="5-10">Từ 5 - 10 triệu</Radio>
                <Radio value="10-20">Từ 10 - 20 triệu</Radio>
                <Radio value=">20">Trên 20 triệu</Radio>
              </Space>
            </Radio.Group>
          </div>

          <div className="flex flex-col">
            <Text strong className="!mb-2">
              Điểm khởi hành
            </Text>
            <Select
              className="w-full !mt-2 "
              value={selectedDeparture}
              onChange={(value) => setSelectedDeparture(value)}
              options={departure ?? undefined}
              fieldNames={{ label: 'city', value: 'city' }}
              placeholder="Tất cả"
              allowClear
            />
          </div>
          <div className="flex flex-col">
            <Text strong className="!mb-2">
              Điểm đến
            </Text>
            <Select
              className="w-full mt-2"
              value={selectedDestination}
              onChange={(value) => {
                setSelectedDestination(value);
              }}
              options={destination ?? undefined}
              fieldNames={{ label: 'city', value: 'city' }}
              placeholder="Tất cả"
              allowClear
            />
          </div>
          {/* Ngày đi */}
          <div className="flex flex-col">
            <Text strong className="!mb-2">
              Ngày đi
            </Text>
            <DatePicker
              className="w-full mt-2"
              value={departureDate}
              onChange={(date) => setDepartureDate(date)}
              format="dddd, DD/MM/YYYY"
              placeholder="Chọn ngày đi"
            />
          </div>
          {/* Phương tiện */}
          <div className="flex flex-col">
            <Text strong className="!mb-2">
              Phương tiện
            </Text>
            <Checkbox.Group
              options={vehicles?.map((vehicle) => ({
                label: vehicle.name,
                value: vehicle.id,
              }))}
              value={selectedTransports ?? undefined}
              onChange={(checkedValues) => {
                setSelectedTransports(checkedValues as string[]);
              }}
              className="!mt-2"
            />
          </div>
        </div>

        {/* Nút Áp dụng */}
        <Button
          type="primary"
          size="large"
          className="w-full !mt-4 !bg-[#7BBCB0]"
          onClick={handleApplyFilters}
        >
          Áp dụng
        </Button>
      </Space>
    </div>
  );
};

export default Filter;
