import PriceBreakdown from '@/components/Share/PriceBreakdown';
import { Button, Card, Descriptions, Typography } from 'antd';
import type { PartyCounts } from '@/utils/booking';
import { countParty, PARTY_TYPES, PASSENGER_LABELS, quoteParty } from '@/utils/booking';
import dayjs from 'dayjs';
import type { ITour, ITourDeparture } from '@/types/Tour';
import { formatCurrencyVND } from '@/utils';
import { departureAdultPrice, isBookableDeparture } from '@/utils/tourSchedule';

type TourDetailCardProps = {
  tourData: ITour;
  selectedDeparture: ITourDeparture | null;
  departureLoading: boolean;
  party: PartyCounts;
  onPartyChange: (party: PartyCounts) => void;
  onSelectDeparture: () => void;
  onBook: () => void;
};

const AGE_HINTS: Record<(typeof PARTY_TYPES)[number], string> = {
  ADULT: 'Từ 12 tuổi',
  CHILD: '5–11 tuổi',
  TODDLER: '2–4 tuổi',
  INFANT: 'Dưới 2 tuổi',
};

export default function TourDetailCard({
  tourData, selectedDeparture, departureLoading, party, onPartyChange, onSelectDeparture, onBook,
}: TourDetailCardProps) {
  const departureDate = selectedDeparture && dayjs(selectedDeparture.departureDate).format('DD/MM/YYYY');
  const adultPrice = departureAdultPrice(tourData, selectedDeparture);
  const partySize = countParty(party);
  const maxSeats = selectedDeparture ? Math.min(40, selectedDeparture.availableSeats) : 40;
  const canBook = selectedDeparture !== null && isBookableDeparture(selectedDeparture) && selectedDeparture.availableSeats >= partySize;
  const quote = selectedDeparture?.tourPrice ? quoteParty(party, selectedDeparture.tourPrice) : [];
  const totalAmount = quote.reduce((sum, line) => sum + line.amount, 0);

  const adjustParty = (type: (typeof PARTY_TYPES)[number], delta: number) => {
    const min = type === 'ADULT' ? 1 : 0;
    const nextVal = party[type] + delta;
    if (nextVal < min) return;
    const next = { ...party, [type]: nextVal };
    const nextTotal = countParty(next);
    if (nextTotal >= 1 && nextTotal <= maxSeats) {
      onPartyChange(next);
    }
  };

  return (
    <Card className="tour-detail-booking-card" styles={{ body: { padding: '16px 18px' } }}>
      <div className="flex items-baseline justify-between gap-2">
        <Typography.Text strong className="text-xs text-[#134E48]">
          {departureDate ? `Khởi hành ${departureDate}` : 'Giá từ / khách'}
        </Typography.Text>
        {selectedDeparture && (
          <span className="inline-block rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">
            Còn {selectedDeparture.availableSeats} chỗ
          </span>
        )}
      </div>
      <Typography.Title level={3} className="!mt-0.5 !mb-2 !text-[#134E48]">
        {adultPrice == null ? 'Đang cập nhật' : formatCurrencyVND(adultPrice)}
      </Typography.Title>

      <Descriptions column={2} size="small" className="border-b border-slate-200 pb-2 [&_.ant-descriptions-item]:!pb-1">
        <Descriptions.Item label="Mã">{selectedDeparture?.tourCode ?? tourData.tourProgram}</Descriptions.Item>
        <Descriptions.Item label="Thời gian">{tourData.duration} ngày</Descriptions.Item>
        <Descriptions.Item label="Khởi hành" span={2}>{tourData.departureCity?.city ?? '—'}</Descriptions.Item>
      </Descriptions>

      <fieldset className="mt-2.5 border-0 p-0">
        <div className="mb-1.5 flex items-center justify-between">
          <legend className="text-xs font-semibold text-[#134E48]">Hành khách</legend>
          {selectedDeparture && (
            <span className="text-[11px] text-[#6B7280]">
              Đã chọn {partySize} / {selectedDeparture.availableSeats} chỗ
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PARTY_TYPES.map((type) => {
            const min = type === 'ADULT' ? 1 : 0;
            const atMin = party[type] <= min;
            const atMax = partySize >= maxSeats;
            return (
              <div
                key={type}
                className="flex items-center justify-between gap-1 rounded-lg border border-slate-200/80 bg-[#F8FAFA] px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight text-[#1F2937]">{PASSENGER_LABELS[type]}</div>
                  <div className="text-[10px] leading-tight text-[#6B7280]">{AGE_HINTS[type]}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={atMin}
                    aria-label={`Giảm số ${PASSENGER_LABELS[type]}`}
                    onClick={() => adjustParty(type, -1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-slate-300 bg-white text-xs font-semibold text-[#134E48] transition hover:border-[#1F7A6E] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-xs font-semibold tabular-nums text-[#1F2937]">
                    {party[type]}
                  </span>
                  <button
                    type="button"
                    disabled={atMax}
                    aria-label={`Tăng số ${PASSENGER_LABELS[type]}`}
                    onClick={() => adjustParty(type, 1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-slate-300 bg-white text-xs font-semibold text-[#134E48] transition hover:border-[#1F7A6E] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {quote.length > 0 && (
        <div className="mt-2.5">
          <PriceBreakdown collapsible hideTotal estimated lines={quote} total={totalAmount} />
        </div>
      )}

      <div className="mt-3 border-t border-slate-200 pt-2.5">
        {quote.length > 0 && (
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Tổng dự kiến</span>
            <strong aria-live="polite" className="text-lg font-bold text-[#134E48]">
              {formatCurrencyVND(totalAmount)}
            </strong>
          </div>
        )}
        <Button
          type="primary"
          block
          size="large"
          loading={departureLoading}
          onClick={canBook ? onBook : onSelectDeparture}
        >
          {canBook ? 'Đặt ngay' : selectedDeparture ? 'Chọn ngày khác còn chỗ' : 'Chọn ngày khởi hành'}
        </Button>
      </div>
    </Card>
  );
}
