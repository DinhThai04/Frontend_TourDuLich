import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

export default function SearchDatePicker({
  value,
  onChange,
}: {
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
}) {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      inputReadOnly
      disabledDate={(current) => !!current && current.isBefore(dayjs(), 'day')}
      format="DD/MM/YYYY"
      variant="borderless"
      placeholder="Chọn ngày đi"
      className="!p-0 text-[16px] font-medium w-full"
      suffixIcon={null}
    />
  );
}
