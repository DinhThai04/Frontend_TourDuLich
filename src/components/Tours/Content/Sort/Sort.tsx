import { Select } from 'antd';
import type { useSearchParams } from 'react-router-dom';

interface IProps {
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}

const SORT_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['newest', 'Mới nhất'],
  ['dateSoon', 'Ngày đi gần nhất'],
  ['priceLow', 'Giá thấp đến cao'],
  ['priceHigh', 'Giá cao đến thấp'],
];

const Sort = ({ searchParams, setSearchParams }: IProps) => {
  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    newParams.set('page', '0');
    setSearchParams(newParams);
  };

  const urlSort = searchParams.get('sort');
  const currentSort = SORT_LABELS.some(([key]) => key === urlSort) ? urlSort! : 'newest';

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <span className="text-[14px] font-medium text-[#6B7280] whitespace-nowrap">Sắp xếp theo:</span>
      <Select
        aria-label="Sắp xếp tour"
        value={currentSort}
        className="w-[184px]"
        onChange={handleSortChange}
        options={SORT_LABELS.map(([value, label]) => ({ value, label }))}
      />
    </div>
  );
};

export default Sort;
