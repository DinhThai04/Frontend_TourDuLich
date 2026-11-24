import Container from '@/components/Share/Container';
import Filter from '@/components/Tours/Filter/Filter';
import Sort from '@/components/Tours/Content/Sort/Sort';
import List from '@/components/Tours/Content/List/List';
import { lazy, Suspense } from 'react';
import { Alert, Button, Empty, Pagination, Skeleton } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type { ITour } from '@/types/Tour';
import { useSearchParams } from 'react-router-dom';
import { searchTours } from '@/services/tourServices';
import { clearTourFilters, TOUR_FILTER_KEYS, tourSearchQuery } from '@/utils/tourSearch';

const TourComparison = lazy(() => import('@/components/Tours/TourComparison'));

export default function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [comparedTours, setComparedTours] = useState<ITour[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [result, setResult] = useState<{ key: string; tours: ITour[]; total: number; error: boolean } | null>(null);
  const resultsTop = useRef<HTMLDivElement>(null);
  const queryString = searchParams.toString();
  const requestKey = queryString + ':' + retry;
  const { page, size } = tourSearchQuery(searchParams, Number(import.meta.env.VITE_PAGE_SIZE) || 10);
  const loading = result?.key !== requestKey;
  const tours = loading ? null : result.tours;
  const total = loading ? 0 : result.total;
  const hasDateFilter = searchParams.has('depD');
  const hasOtherFilters = TOUR_FILTER_KEYS.some(filter => filter !== 'depD' && searchParams.has(filter));
  const comparedIds = comparedTours.map(tour => Number(tour.id));

  function toggleComparison(tour: ITour) {
    setComparedTours(previous => {
      const selected = previous.some(item => Number(item.id) === Number(tour.id));
      if (selected) return previous.filter(item => Number(item.id) !== Number(tour.id));
      return previous.length < 3 ? [...previous, tour] : previous;
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    const { query, page: requestedPage, size: requestedSize } =
      tourSearchQuery(new URLSearchParams(queryString), Number(import.meta.env.VITE_PAGE_SIZE) || 10);
    void searchTours(query, controller.signal).then(response => {
      if (controller.signal.aborted) return;
      if (response.code !== 1000) throw new Error('Catalog unavailable');
      setResult({ key: requestKey, tours: response.result.content, total: response.result.totalElements, error: false });
      // A shared deep link can outlive the last page; show the last real page instead of
      // "15 tours found" next to an empty list.
      const lastPage = Math.max(0, Math.ceil(response.result.totalElements / requestedSize) - 1);
      if (requestedPage > lastPage && response.result.totalElements > 0) {
        const params = new URLSearchParams(queryString);
        params.set('page', String(lastPage));
        setSearchParams(params, { replace: true });
      }
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key: requestKey, tours: [], total: 0, error: true });
    });
    return () => controller.abort();
    // setSearchParams only changes identity together with queryString, so the request stays
    // keyed on the URL and the page correction cannot loop.
  }, [queryString, requestKey, setSearchParams]);

  return <Container className="!px-4">
    <div className="text-center !mt-10 !mb-10">
      <h1 className="text-3xl md:text-4xl font-bold !mb-5">DANH SÁCH CHUYẾN ĐI</h1>
      <p>Khám phá các hành trình hấp dẫn với mức giá tốt nhất.</p>
    </div>
    <div className="flex flex-col lg:flex-row gap-6 !mb-16">
      <aside className="w-full lg:w-1/4 shrink-0">
        <Button className="lg:!hidden !mb-4" onClick={() => setFiltersOpen(value => !value)}
          aria-expanded={filtersOpen} aria-controls="tour-search-filters">Bộ lọc tìm kiếm</Button>
        <div id="tour-search-filters" className={filtersOpen ? 'block' : 'hidden lg:block'}>
          <Filter tours={tours} searchParams={searchParams} setSearchParams={setSearchParams} />
        </div>
      </aside>
      <div ref={resultsTop} className="flex-1 min-w-0 scroll-mt-4" aria-busy={loading}>
        {!!comparedTours.length && <section aria-label="Tour đang chọn để so sánh"
          className="mb-4 rounded-xl border border-[#dce7e2] bg-[#f3f8f6] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span role="status">Đã chọn {comparedTours.length}/3 tour · chọn ít nhất 2 tour để so sánh</span>
            <Button type="primary" disabled={comparedTours.length < 2} onClick={() => setComparisonOpen(true)}>
              So sánh tour
            </Button>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {comparedTours.map(tour => <li key={tour.id} className="min-w-0">
              <Button size="small" title={tour.tourTitle} aria-label={`Bỏ so sánh ${tour.tourTitle}`} onClick={() => toggleComparison(tour)}>
                <span className="block max-w-[min(65vw,20rem)] truncate">{tour.tourTitle}</span>
                <span aria-hidden>×</span>
              </Button>
            </li>)}
          </ul>
        </section>}
        <div className="flex flex-wrap justify-between items-center gap-4 !mb-6">
          <p role="status">{loading ? 'Đang tìm tour…' : 'Tìm thấy ' + total + ' chuyến đi'}</p>
          <Sort tours={tours} searchParams={searchParams} setSearchParams={setSearchParams} />
        </div>
        {loading ? <Skeleton active paragraph={{ rows: 10 }} /> : result.error ?
          <Alert type="warning" showIcon message="Chưa tải được danh sách tour"
            description="Vui lòng thử lại khi kết nối ổn định."
            action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /> :
          tours?.length ? <List tours={tours} comparedIds={comparedIds}
            comparisonFull={comparedTours.length === 3} onCompare={toggleComparison} /> :
            <Empty description="Không có tour phù hợp">
              {(hasDateFilter || hasOtherFilters) && <div className="flex flex-wrap justify-center gap-2">
                {hasDateFilter && <Button type="primary"
                  onClick={() => setSearchParams(clearTourFilters(searchParams, ['depD']))}>Bỏ lọc ngày đi</Button>}
                {hasOtherFilters && <Button onClick={() => setSearchParams(clearTourFilters(searchParams))}>Xóa bộ lọc</Button>}
              </div>}
            </Empty>}
        {!loading && total > size && <div className="flex justify-center !mt-8">
          <Pagination current={page + 1} pageSize={size} total={total} responsive showSizeChanger={false}
            onChange={next => {
              const params = new URLSearchParams(searchParams); params.set('page', String(next - 1));
              setSearchParams(params);
              resultsTop.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
            }} />
        </div>}
      </div>
    </div>
    {comparisonOpen && <Suspense fallback={<p role="status">Đang tải bảng so sánh…</p>}>
      <TourComparison tours={comparedTours} onClose={() => setComparisonOpen(false)} />
    </Suspense>}
  </Container>;
}
