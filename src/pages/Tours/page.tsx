import Container from '@/components/Share/Container';
import Filter, { formatVehicleLabel } from '@/components/Tours/Filter/Filter';
import Sort from '@/components/Tours/Content/Sort/Sort';
import List, { type TourRatingInfo } from '@/components/Tours/Content/List/List';
import { Alert, Button, Drawer, Empty, Pagination, Skeleton } from 'antd';
import { FilterOutlined, CloseOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ITour, IVehicle } from '@/types/Tour';
import { Link, useSearchParams } from 'react-router-dom';
import { searchTours } from '@/services/tourServices';
import { getHighReviews } from '@/services/authServices';
import { BUDGET_BUCKETS, budgetKeyFromParams, clearTourFilters, TOUR_FILTER_KEYS, tourSearchQuery } from '@/utils/tourSearch';
import { tourInterests } from '@/components/Home/tourInterests';
import dayjs from 'dayjs';

const EXPERIENCE_LABELS: Record<string, string> = {
  sea: 'Về miền biển',
  nature: 'Lên miền núi',
  culture: 'Ghé miền di sản',
};

export default function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [retry, setRetry] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, TourRatingInfo>>({});
  const [result, setResult] = useState<{ key: string; tours: ITour[]; total: number; error: boolean } | null>(null);
  const resultsTop = useRef<HTMLDivElement>(null);

  const queryString = searchParams.toString();
  const experience = searchParams.get('experience');
  const requestKey = queryString + ':' + retry;
  const { page, size } = tourSearchQuery(searchParams, 6);
  const loading = result?.key !== requestKey;
  const rawTours = result ? result.tours : null;
  const rawTotal = result ? result.total : 0;

  // Apply optional ?experience= filter (from Home inspiration cards)
  const { tours, total } = useMemo(() => {
    if (!rawTours) return { tours: null, total: 0 };
    if (!experience) return { tours: rawTours, total: rawTotal };
    const matcher = tourInterests.find((g) => g.id === experience);
    if (!matcher) return { tours: rawTours, total: rawTotal };
    const filtered = rawTours.filter(matcher.matches);
    return { tours: filtered, total: filtered.length };
  }, [rawTours, rawTotal, experience]);

  useEffect(() => {
    let active = true;
    void getHighReviews(50)
      .then((res) => {
        if (!active || res.code !== 1000 || !Array.isArray(res.result)) return;
        const grouped: Record<number, { sum: number; count: number }> = {};
        for (const r of res.result) {
          if (!r.tourId || typeof r.rating !== 'number') continue;
          const prev = grouped[r.tourId] ?? { sum: 0, count: 0 };
          grouped[r.tourId] = { sum: prev.sum + r.rating, count: prev.count + 1 };
        }
        const map: Record<number, TourRatingInfo> = {};
        for (const [id, val] of Object.entries(grouped)) {
          map[Number(id)] = { avg: val.sum / val.count, count: val.count };
        }
        setRatingsMap(map);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const effectiveDefaultSize = experience ? 50 : 6;
    const { query, page: requestedPage, size: requestedSize } =
      tourSearchQuery(new URLSearchParams(queryString), effectiveDefaultSize);
    if (experience) query.set('size', '50');
    void searchTours(query, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        if (response.code !== 1000) throw new Error('Catalog unavailable');
        setResult({
          key: requestKey,
          tours: response.result.content,
          total: response.result.totalElements,
          error: false,
        });
        const lastPage = Math.max(0, Math.ceil(response.result.totalElements / requestedSize) - 1);
        if (!experience && requestedPage > lastPage && response.result.totalElements > 0) {
          const params = new URLSearchParams(queryString);
          params.set('page', String(lastPage));
          setSearchParams(params, { replace: true });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key: requestKey, tours: [], total: 0, error: true });
      });
    return () => controller.abort();
  }, [queryString, requestKey, experience, setSearchParams]);

  // Earliest departure date for dynamic header subtitle
  const earliestDate = useMemo(() => {
    if (!tours?.length) return null;
    let min: string | null = null;
    for (const t of tours) {
      for (const d of t.departures ?? []) {
        if (d.departureDate && (!min || d.departureDate < min)) {
          min = d.departureDate;
        }
      }
    }
    return min ? dayjs(min).format('DD/MM/YYYY') : null;
  }, [tours]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    const removeKeys = (keys: string[]) => {
      const next = new URLSearchParams(searchParams);
      for (const k of keys) next.delete(k);
      next.set('page', '0');
      setSearchParams(next, { replace: true });
    };

    if (experience && EXPERIENCE_LABELS[experience]) {
      chips.push({
        key: 'experience',
        label: EXPERIENCE_LABELS[experience],
        onRemove: () => removeKeys(['experience']),
      });
    }
    const bKey = budgetKeyFromParams(searchParams.get('minP'), searchParams.get('maxP'));
    if (bKey) {
      const bucket = BUDGET_BUCKETS.find((b) => b.key === bKey);
      if (bucket) {
        chips.push({
          key: 'budget',
          label: bucket.label,
          onRemove: () => removeKeys(['minP', 'maxP']),
        });
      }
    }
    const dep = searchParams.get('dep');
    if (dep) {
      chips.push({
        key: 'dep',
        label: `Khởi hành: ${dep}`,
        onRemove: () => removeKeys(['dep']),
      });
    }
    const dest = searchParams.get('dest');
    if (dest) {
      chips.push({
        key: 'dest',
        label: `Điểm đến: ${dest}`,
        onRemove: () => removeKeys(['dest']),
      });
    }
    const depD = searchParams.get('depD');
    if (depD && dayjs(depD).isValid()) {
      chips.push({
        key: 'depD',
        label: `Ngày đi: ${dayjs(depD).format('DD/MM/YYYY')}`,
        onRemove: () => removeKeys(['depD']),
      });
    }
    const veh = searchParams.get('veh');
    if (veh) {
      for (const id of veh.split(',').filter(Boolean)) {
        const found = vehicles.find((v) => String(v.id) === id);
        chips.push({
          key: `veh-${id}`,
          label: formatVehicleLabel(found?.name ?? id),
          onRemove: () => {
            const remaining = veh.split(',').filter((x) => x && x !== id);
            const next = new URLSearchParams(searchParams);
            if (remaining.length) next.set('veh', remaining.join(','));
            else next.delete('veh');
            next.set('page', '0');
            setSearchParams(next, { replace: true });
          },
        });
      }
    }
    return chips;
  }, [searchParams, experience, vehicles, setSearchParams]);

  const handleClearAll = useCallback(() => {
    const cleared = clearTourFilters(searchParams, [...TOUR_FILTER_KEYS, 'experience']);
    setSearchParams(cleared, { replace: true });
  }, [searchParams, setSearchParams]);

  const startIndex = total === 0 ? 0 : page * size + 1;
  const endIndex = Math.min(total, (page + 1) * size);

  return (
    <div className="bg-[#F8FAFA] min-h-[70vh] pb-16">
      {/* Compact Header Band (<= 120px) */}
      <div
        className="border-b border-[#E5E7EB]"
        style={{ background: 'linear-gradient(180deg, #E6F4F1 0%, #F8FAFA 100%)' }}
      >
        <Container className="py-6">
          <nav aria-label="Đường dẫn" className="text-[13px] text-[#6B7280] mb-1.5 flex items-center gap-2">
            <Link to="/" className="text-[#1F7A6E] no-underline hover:underline">
              Trang chủ
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-[#1F2937] font-medium">Tour du lịch</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
            <h1 className="m-0 text-[28px] md:text-[32px] leading-[1.2] font-bold text-[#134E48]">
              Tour du lịch
            </h1>
            <p className="m-0 text-[14px] text-[#6B7280]">
              {loading
                ? 'Đang cập nhật hành trình...'
                : earliestDate
                  ? `${total} hành trình khởi hành từ ${earliestDate}`
                  : `${total} hành trình đang mở đặt chỗ`}
            </p>
          </div>
        </Container>
      </div>

      {/* Main 2-column grid in unified 1240px container */}
      <Container className="pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-8 items-start">
          {/* Desktop Sticky Filter */}
          <aside className="hidden lg:block sticky top-[88px]">
            <Filter
              tours={tours}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              onVehiclesLoaded={setVehicles}
            />
          </aside>

          {/* Right List Column */}
          <div ref={resultsTop} className="min-w-0 scroll-mt-24" aria-busy={loading}>
            {/* Top Bar (flush with cards) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Button
                  className="lg:!hidden !h-[40px] !rounded-[10px] !border-[#E5E7EB] !text-[#134E48] !font-semibold"
                  icon={<FilterOutlined />}
                  onClick={() => setMobileFilterOpen(true)}
                >
                  Bộ lọc{activeChips.length > 0 ? ` (${activeChips.length})` : ''}
                </Button>
                <p role="status" className="m-0 text-[15px] text-[#6B7280]">
                  {loading ? (
                    'Đang tìm chuyến đi…'
                  ) : (
                    <>
                      <strong className="text-[#134E48] font-bold">{total} chuyến đi</strong>
                      {experience && EXPERIENCE_LABELS[experience] ? ` · ${EXPERIENCE_LABELS[experience]}` : ''}
                    </>
                  )}
                </p>
              </div>
              <Sort searchParams={searchParams} setSearchParams={setSearchParams} />
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5 py-2.5 px-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                <span className="text-[13px] font-medium text-[#6B7280] mr-1">Đang lọc:</span>
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] text-[#134E48] text-[13px] font-medium px-3 py-1 border-0 cursor-pointer hover:bg-[#D4ECE6] transition-colors"
                  >
                    <span>{chip.label}</span>
                    <CloseOutlined className="text-[10px]" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="ml-auto text-[13px] font-semibold text-[#1F7A6E] bg-transparent border-0 cursor-pointer hover:underline"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Content States */}
            {loading ? (
              <div className="flex flex-col gap-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                    <Skeleton active avatar={{ shape: 'square', size: 120 }} paragraph={{ rows: 3 }} />
                  </div>
                ))}
              </div>
            ) : result?.error ? (
              <Alert
                type="info"
                showIcon
                style={{ background: '#E6F4F1', borderColor: '#A7D7CF' }}
                message="Chưa tải được danh sách tour"
                description="Vui lòng thử lại khi kết nối ổn định."
                action={<Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button>}
              />
            ) : tours?.length ? (
              <List tours={tours} ratingsMap={ratingsMap} />
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl py-12 px-6 text-center">
                <Empty
                  description={
                    <span className="text-[15px] text-[#6B7280]">
                      Không tìm thấy chuyến đi phù hợp với bộ lọc hiện tại.
                    </span>
                  }
                >
                  {activeChips.length > 0 && (
                    <Button
                      type="primary"
                      className="!bg-[#1F7A6E] hover:!bg-[#176258] !h-[40px] !px-5 !rounded-[10px] !font-semibold"
                      onClick={handleClearAll}
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </Empty>
              </div>
            )}

            {/* Compact Pagination + Range Text */}
            {!loading && total > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5E7EB]">
                <span className="text-[13px] text-[#6B7280]">
                  Hiển thị <strong className="text-[#1F2937]">{startIndex}–{endIndex}</strong> / {total} chuyến
                </span>
                {!experience && total > size && (
                  <Pagination
                    current={page + 1}
                    pageSize={size}
                    total={total}
                    responsive
                    showSizeChanger={false}
                    onChange={(next) => {
                      const params = new URLSearchParams(searchParams);
                      params.set('page', String(next - 1));
                      setSearchParams(params);
                      resultsTop.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile Filter Bottom Sheet (< 768px / < lg) */}
      <Drawer
        title={<span className="text-[#134E48] font-bold text-[16px]">Bộ lọc chuyến đi</span>}
        placement="bottom"
        height="82vh"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        footer={
          <div className="flex items-center gap-3">
            {activeChips.length > 0 && (
              <Button onClick={handleClearAll} className="!h-[42px] !rounded-[10px]">
                Xóa lọc
              </Button>
            )}
            <Button
              type="primary"
              block
              className="!h-[42px] !rounded-[10px] !bg-[#1F7A6E] hover:!bg-[#176258] !font-semibold"
              onClick={() => setMobileFilterOpen(false)}
            >
              Xem {total} kết quả
            </Button>
          </div>
        }
      >
        <Filter
          tours={tours}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          onVehiclesLoaded={setVehicles}
        />
      </Drawer>
    </div>
  );
}
