import type { ITour } from '@/types/Tour';
import { Select } from 'antd';
import type { useSearchParams } from 'react-router-dom';

// 2. Định nghĩa props mới
interface IProps {
  tours: ITour[] | null;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}

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
  const currentSort = searchParams.get('sort') || 'newest';

  return (
    <div className="flex gap-2 items-center justify-center">
      <p className="!mb-0 text-[16px] font-[600]">Sắp xếp theo: </p>
      <div className="flex justify-between items-center text-[16px] font-[600]">
        <Select
          value={currentSort} // <-- 6. Kết nối value từ URL
          className="w-48"
          onChange={handleSortChange} // <-- 7. Kết nối hàm xử lý
        >
          <Select.Option value="newest">
            <span className="text-[16px]">Mới nhất</span>
          </Select.Option>
          <Select.Option value="dateSoon">
            <span className="text-[16px]">Ngày đi gần nhất</span>
          </Select.Option>
          <Select.Option value="priceLow">
            <span className="text-[16px]">Giá thấp đến cao</span>
          </Select.Option>
          <Select.Option value="priceHigh">
            <span className="text-[16px]">Giá cao đến thấp</span>
          </Select.Option>
        </Select>
      </div>
    </div>
  );
};

export default Sort;
