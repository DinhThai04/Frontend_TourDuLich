import { useEffect, useState } from 'react';
import { Alert, Select, Radio, DatePicker, Button, Checkbox, Space, Typography } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { getAllDepartures, getAllDestinations, getAllVehicles } from '@/services/tourServices';
import { settledRows } from '@/utils/settledRows';
import { BUDGET_BUCKETS, budgetKeyFromParams, budgetParams } from '@/utils/tourSearch';
import type { ILocation, ITour, IVehicle } from '@/types/Tour';
import type { useSearchParams } from 'react-router-dom';

dayjs.locale('vi');

const { Text } = Typography;

interface IProps {
  tours: ITour[] | null;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}

const FILTER_KEYS = ['dest', 'depD', 'minP', 'maxP', 'veh', 'dep'] as const;

const Filter = ({ searchParams, setSearchParams }: IProps) => {
  // State để lưu trữ các giá trị của bộ lọc
  const [budget, setBudget] = useState<string | null>(null);
  const [departure, setDeparture] = useState<ILocation[] | null>(null);
  const [destination, setDestination] = useState<ILocation[] | null>(null);
  const [vehicles, setVehicles] = useState<IVehicle[] | null>(null);
  const [departureDate, setDepartureDate] = useState<Dayjs | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);

  const [selectedTransports, setSelectedTransports] = useState<string[] | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  // Bản sao bộ lọc đang hiển thị trong URL; null ở lần render đầu để URL luôn được áp dụng.
  const [syncedFilters, setSyncedFilters] = useState<string | null>(null);

  useEffect(() => {
    // Chỉ đọc lại URL khi chính bộ lọc thay đổi (nút "Áp dụng", liên kết từ trang chủ).
    // Đổi sắp xếp hay chuyển trang cũng làm searchParams đổi, nhưng không được xóa các lựa
    // chọn người dùng đang soạn mà chưa bấm "Áp dụng".
    const key = FILTER_KEYS.map((name) => searchParams.get(name) ?? '').join('|');
    if (key === syncedFilters) return;
    setSyncedFilters(key);

    const dest = searchParams.get('dest');
    const depD = searchParams.get('depD');
    const minP = searchParams.get('minP');
    const maxP = searchParams.get('maxP');
    const veh = searchParams.get('veh');
    const dep = searchParams.get('dep');

    // Cập nhật state nội bộ của Filter để UI khớp với URL
    setSelectedDestination(dest);
    setSelectedDeparture(dep);
    // Lịch trình đã khởi hành không còn chỗ để đặt, nên bộ lọc không nhận ngày trong quá khứ.
    setDepartureDate(depD && dayjs(depD).isValid() && !dayjs(depD).isBefore(dayjs(), 'day') ? dayjs(depD) : null);
    setSelectedTransports(veh ? veh.split(',') : null);

    // Đồng bộ budget
    setBudget(budgetKeyFromParams(minP, maxP));
  }, [searchParams, syncedFilters]); // Phụ thuộc vào searchParams

  const handleApplyFilters = () => {
    // Tạo một bản sao của params hiện tại (ví dụ: để giữ 'sort')
    const newParams = new URLSearchParams(searchParams);

    // 1. Xử lý Budget (minP, maxP)
    newParams.delete('minP'); // Xóa key cũ
    newParams.delete('maxP');
    const range = budgetParams(budget);
    if (range) {
      newParams.set('minP', range.minP);
      if (range.maxP !== null) newParams.set('maxP', range.maxP);
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

  // Mỗi danh mục tải độc lập: một API lỗi không được làm mất dữ liệu của hai API còn lại.
  const getAllData = async () => {
    const [departures, destinations, vehicles] = await Promise.allSettled([
      getAllDepartures(),
      getAllDestinations(),
      getAllVehicles(),
    ]);

    return {
      departures: settledRows(departures),
      destinations: settledRows(destinations),
      vehicles: settledRows(vehicles),
      complete: [departures, destinations, vehicles].every(
        (result) => result.status === 'fulfilled' && result.value.code === 1000
      ),
    };
  };

  useEffect(() => {
    let active = true;
    setCatalogError(false);
    void getAllData()
      .then((data) => {
        if (!active) return;
        setDeparture(data.departures);
        setDestination(data.destinations);
        setVehicles(data.vehicles);
        setCatalogError(!data.complete);
      })
      .catch(() => { if (active) setCatalogError(true); });
    return () => { active = false; };
  }, [catalogAttempt]);

  return (
    <div className="!p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      {catalogError && <Alert type="warning" message="Chưa tải được các lựa chọn bộ lọc"
        action={<Button onClick={() => setCatalogAttempt(value => value + 1)}>Thử lại</Button>} />}
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <Text strong className="!mb-2">
              Ngân sách
            </Text>
            <Radio.Group
              onChange={(e: RadioChangeEvent) => setBudget(e.target.value === 'all' ? null : e.target.value)}
              value={budget ?? 'all'}
              className="mt-2"
            >
              <Space direction="vertical">
                <Radio value="all">Không giới hạn</Radio>
                {BUDGET_BUCKETS.map((bucket) => (
                  <Radio key={bucket.key} value={bucket.key}>{bucket.label}</Radio>
                ))}
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
              disabledDate={(current) => !!current && current.isBefore(dayjs(), 'day')}
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
