import { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { Link } from 'react-router-dom';
import { getDepartureByTourId } from '@/services/tourServices';
import type { ITour, ITourDeparture } from '@/types/Tour';
import { formatCurrencyVND, formatDatetime, toVietnamDate } from '@/utils';
import { isBookableDeparture, tourScheduleLink } from '@/utils/tourSchedule';

function nextBookableDeparture(departures: ITourDeparture[]) {
  return departures
    .map(departure => ({ departure, startsAt: toVietnamDate(departure.departureDate)?.getTime() ?? 0 }))
    .filter(({ departure, startsAt }) => startsAt > Date.now() && isBookableDeparture(departure))
    .sort((left, right) => left.startsAt - right.startsAt)[0]?.departure ?? null;
}

export default function TourComparison({ tours, onClose }: { tours: ITour[]; onClose: () => void }) {
  const [departures, setDepartures] = useState<Record<number, ITourDeparture | null | 'unavailable'>>({});

  useEffect(() => {
    const controller = new AbortController();
    for (const tour of tours) {
      void getDepartureByTourId(tour.id, controller.signal).then(({ code, result }) => {
        if (!controller.signal.aborted) setDepartures(previous => ({
          ...previous, [tour.id]: code === 1000 ? nextBookableDeparture(result) : 'unavailable',
        }));
      }).catch(() => {
        if (!controller.signal.aborted) setDepartures(previous => ({ ...previous, [tour.id]: 'unavailable' }));
      });
    }
    return () => controller.abort();
  }, [tours]);

  const rows = [
    { label: 'Giá người lớn', cell: (tour: ITour) => {
      const departure = departures[tour.id];
      const fare = departure && departure !== 'unavailable' ? departure.tourPrice?.adultPrice : undefined;
      return fare != null ? formatCurrencyVND(fare)
        : tour.basePrice > 0 ? `Từ ${formatCurrencyVND(tour.basePrice)}` : 'Đang cập nhật';
    } },
    { label: 'Thời lượng', cell: (tour: ITour) => `${tour.duration} ngày` },
    { label: 'Khởi hành từ', cell: (tour: ITour) => tour.departureCity?.city ?? 'Đang cập nhật' },
    { label: 'Lịch gần nhất còn chỗ', cell: (tour: ITour) => {
      const departure = departures[tour.id];
      if (departure === undefined) return <span role="status">Đang kiểm tra…</span>;
      if (departure === 'unavailable') return 'Chưa kiểm tra được lịch';
      if (!departure) return 'Chưa có lịch còn chỗ';
      return <Link to={tourScheduleLink(tour.id, departure.id)}>
        {formatDatetime(departure.departureDate)} · còn {departure.availableSeats} chỗ
      </Link>;
    } },
  ];

  return <Modal open title="So sánh tour" onCancel={onClose} footer={null} width={960}>
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng so sánh tour">
      <table className="w-full min-w-[32rem] border-collapse text-left">
        <thead><tr className="bg-[#edf5f2]">
          <th scope="col" className="p-3">Thông tin</th>
          {tours.map(tour => <th key={tour.id} scope="col" className="p-3">
            <Link to={`/tours/detail/${tour.id}`}>{tour.tourTitle}</Link>
          </th>)}
        </tr></thead>
        <tbody>{rows.map(row => <tr key={row.label} className="border-b border-[#dce7e2]">
          <th scope="row" className="p-3">{row.label}</th>
          {tours.map(tour => <td key={tour.id} className="p-3">{row.cell(tour)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <p className="mt-3 text-sm text-slate-600">Giá và số chỗ được xác nhận lại khi đặt tour.</p>
  </Modal>;
}
