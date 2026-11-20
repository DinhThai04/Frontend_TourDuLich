import PriceBreakdown from '@/components/Share/PriceBreakdown';
import { Button, Card, Descriptions, InputNumber, Typography } from 'antd';
import type { PartyCounts } from '@/utils/booking';
import { countParty, PARTY_TYPES, PASSENGER_LABELS, quoteParty, tourPriceNote } from '@/utils/booking';
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

export default function TourDetailCard({
  tourData, selectedDeparture, departureLoading, party, onPartyChange, onSelectDeparture, onBook,
}: TourDetailCardProps) {
  const departureDate = selectedDeparture && dayjs(selectedDeparture.departureDate).format('DD/MM/YYYY');
  const adultPrice = departureAdultPrice(tourData, selectedDeparture);
  const childPrice = selectedDeparture?.tourPrice?.childPrice;
  const partySize = countParty(party);
  const canBook = selectedDeparture !== null && isBookableDeparture(selectedDeparture) && selectedDeparture.availableSeats >= partySize;
  const quote = selectedDeparture?.tourPrice ? quoteParty(party, selectedDeparture.tourPrice) : [];

  return (
    <Card className="tour-detail-booking-card">
      <Typography.Text strong>{departureDate ? `Giá người lớn · ${departureDate}` : 'Giá từ / khách'}</Typography.Text>
      <Typography.Title level={3} className="!mt-2 !mb-3 !text-[#155e54]">
        {adultPrice == null ? 'Đang cập nhật' : formatCurrencyVND(adultPrice)}
      </Typography.Title>
      <Descriptions column={1} size="small">
        <Descriptions.Item label={selectedDeparture ? 'Mã tour' : 'Mã chương trình'}>
          {selectedDeparture?.tourCode ?? tourData.tourProgram}
        </Descriptions.Item>
        <Descriptions.Item label="Khởi hành từ">{tourData.departureCity?.city ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Thời gian">{tourData.duration} ngày</Descriptions.Item>
        {selectedDeparture && <Descriptions.Item label="Số chỗ còn">{selectedDeparture.availableSeats}</Descriptions.Item>}
        {childPrice != null && <Descriptions.Item label="Giá trẻ em (5–11 tuổi)">{formatCurrencyVND(childPrice)}</Descriptions.Item>}
      </Descriptions>
      <fieldset className="mt-3 grid grid-cols-2 gap-2">
        <legend className="mb-2 font-semibold">Hành khách</legend>
        {PARTY_TYPES.map(type => <label key={type} className="grid gap-1 text-sm">
          {PASSENGER_LABELS[type]}
          <InputNumber className="!w-full" min={0} max={40 - partySize + party[type]} precision={0}
            aria-label={PASSENGER_LABELS[type]} value={party[type]} onChange={value => {
              if (value == null || !Number.isInteger(value)) return;
              const next = { ...party, [type]: value };
              if (countParty(next) >= 1 && countParty(next) <= 40) onPartyChange(next);
            }} />
        </label>)}
      </fieldset>
      {quote.length > 0 && <div className="mt-3">
        <PriceBreakdown estimated lines={quote} total={quote.reduce((total, line) => total + line.amount, 0)}
          note={tourPriceNote(selectedDeparture?.tourPrice?.singleSupplementPrice)} />
      </div>}
      <Button type="primary" block className="!mt-4" loading={departureLoading}
        onClick={canBook ? onBook : onSelectDeparture}>
        {canBook ? 'Đặt ngay' : selectedDeparture ? 'Xem ngày còn chỗ' : 'Chọn ngày khởi hành'}
      </Button>
    </Card>
  );
}
