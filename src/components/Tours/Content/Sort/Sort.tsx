import type { ITour } from '@/types/Tour';
import { Select } from 'antd';
import type { useSearchParams } from 'react-router-dom';

// 2. Định nghĩa props mới
interface IProps {
  tours: ITour[] | null;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}

// Keys must stay in sync with the tour_service switch in TourService.searchTours, whose default
// branch orders by id DESC. A hand-edited link therefore has to render as 'newest' too, otherwise
// the dropdown quotes a sort the list is not actually using.
const SORT_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['newest', 'Mới nhất'],
  ['dateSoon', 'Ngày đi gần nhất'],
  ['priceLow', 'Giá thấp đến cao'],
  ['priceHigh', 'Giá cao đến thấp'],
];

const Sort = ({ searchParams, setSearchParams }: IProps) => {
  // 4. Hàm xử lý khi người dùng chọn sắp xếp
  const handleSortChange = (value: string) => {
    // Tạo bản sao của các params hiện tại (như filter, page...)
    const newParams = new URLSearchParams(searchParams);

    // Đặt giá trị 'sort' mới
    newParams.set('sort', value);
    // Khi sắp xếp, luôn quay về trang đầu tiên
    newParams.set('page', '0');

    // Cập nhật URL
    setSearchParams(newParams);
  };
  // 5. Đọc giá trị sort từ URL, nếu không có thì dùng 'newest' làm mặc định
  const urlSort = searchParams.get('sort');
  const currentSort = SORT_LABELS.some(([key]) => key === urlSort) ? urlSort! : 'newest';

  return (
    <div className="flex gap-2 items-center justify-center">
      <p className="!mb-0 text-[16px] font-[600]">Sắp xếp theo: </p>
      <div className="flex justify-between items-center text-[16px] font-[600]">
        <Select
          aria-label="Sắp xếp tour"
          value={currentSort} // <-- 6. Kết nối value từ URL
          className="w-48"
          onChange={handleSortChange} // <-- 7. Kết nối hàm xử lý
        >
          {SORT_LABELS.map(([key, label]) => (
            <Select.Option key={key} value={key}>
              <span className="text-[16px]">{label}</span>
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default Sort;
