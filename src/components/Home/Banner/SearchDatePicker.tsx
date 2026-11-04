import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

export default function SearchDatePicker({ value, onChange }: { value: Dayjs | null; onChange: (value: Dayjs | null) => void }) {
  return <DatePicker value={value} onChange={onChange} defaultOpen autoFocus inputReadOnly
    // Các chuyến đã khởi hành không còn chỗ để đặt nên lịch chỉ mở từ hôm nay.
    disabledDate={(current) => !!current && current.isBefore(dayjs(), 'day')}
    format="dddd, DD/MM/YYYY" variant="borderless" placeholder="Chọn ngày đi"
    className="!p-0 text-[18px] font-medium" suffixIcon="" />;
}
