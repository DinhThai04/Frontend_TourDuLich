import Container from '@/components/Share/Container';
import Filter from '@/components/Tours/Filter/Filter';
import Sort from '@/components/Tours/Content/Sort/Sort';
import List from '@/components/Tours/Content/List/List';
import { Divider } from 'antd/lib';
import { useEffect, useState } from 'react';
import type { ITour } from '@/types/Tour';
import { Pagination } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { searchTours } from '@/services/tourServices';

const PAGE_SIZE: number = Number(import.meta.env.VITE_PAGE_SIZE) || 5;

const ToursPage = () => {
  const [tours, setTours] = useState<ITour[] | null>(null);
  const [totalElements, setTotalElements] = useState<number>(0);
  // Hook để đọc và ghi query params trên URL
  const [searchParams, setSearchParams] = useSearchParams();

  const handleChangePage = (page: number) => {
    // Tạo một bản sao của các params hiện tại (như dest, minP, sort...)
    const newParams = new URLSearchParams(searchParams);

    // Chỉ cập nhật lại tham số 'page'
    newParams.set('page', (page - 1).toString());

    // Đặt lại toàn bộ params
    setSearchParams(newParams);
  };

  const fetchTours = async () => {
    // 1. Tạo các tham số API từ URL
    const apiParams = new URLSearchParams();
    const dest = searchParams.get('dest') || '';
    const depD = searchParams.get('depD') || '';
    const minP = searchParams.get('minP') || '';
    const maxP = searchParams.get('maxP') || '';
    const veh = searchParams.get('veh') || '';
    const dep = searchParams.get('dep') || '';
    // 2. Xử lý Phân trang
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || PAGE_SIZE.toString() || '';
    // 3. Xử lý Sắp xếp (nếu có)
    const sort = searchParams.get('sort') || '';

    apiParams.set('dest', dest);
    apiParams.set('depD', depD);
    apiParams.set('minP', minP);
    apiParams.set('maxP', maxP);
    apiParams.set('veh', veh);
    apiParams.set('dep', dep);
    apiParams.set('page', page);
    apiParams.set('size', size);
    apiParams.set('sort', sort);

    console.log('>>>>>>>>check: ', apiParams.toString());

    const response = await searchTours(apiParams);
    if (response.code === 1000) {
      setTours(response.result?.content || []);
      setTotalElements(response.result?.totalElements || 0);
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 200,
      behavior: 'smooth',
    });
    fetchTours();
  }, [searchParams]);
  return (
    <div className="">
      <Container>
        <div className="text-center !mt-10 !mb-20">
          <h1 className="text-4xl !font-[700] text-gray-800 !mb-10">DANH SÁCH CHUYẾN ĐI</h1>
          <p className="text-[16px] text-gray-500 text-center">
            Khám phá các hành trình hấp dẫn với mức giá tốt nhất, cùng những điểm đến nổi bật trong
            và ngoài nước.
          </p>
        </div>
        <div className="flex flex-row gap-6 !mb-4">
          <div className="flex-3">
            <p className="text-[16px] font-bold">BỘ LỌC TÌM KIẾM</p>
          </div>
          <div className="flex-11 flex flex-col">
            <div className="flex flex-row justify-between">
              <div className="text-[16px] font-[600]">
                Chúng tôi tìm thấy{' '}
                <strong className="text-blue-400 text-2xl">{totalElements}</strong> chuyến đi cho
                quý khách
              </div>
              <Sort tours={tours} searchParams={searchParams} setSearchParams={setSearchParams} />
            </div>
            <Divider className="!mt-4 !mb-6" />
          </div>
        </div>
        <div className="flex flex-row gap-6">
          <div className="flex-3">
            <Filter tours={tours} searchParams={searchParams} setSearchParams={setSearchParams} />
          </div>
          <div className="flex-11">
            <List tours={tours} />
            <div className="flex justify-center !mt-8 !mb-[80px]">
              {tours && totalElements > PAGE_SIZE && tours?.length > 0 && (
                <Pagination
                  current={searchParams.get('page') ? Number(searchParams.get('page')) + 1 : 1}
                  pageSize={PAGE_SIZE}
                  total={totalElements}
                  onChange={handleChangePage}
                  showSizeChanger={false}
                />
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ToursPage;
