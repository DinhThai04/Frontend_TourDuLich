import { useState } from 'react';
import { Alert, Button, Radio, Spin, message } from 'antd';
import { useApiQuery } from '@/hooks';
import { chooseBookingPickup, getBookingPickup, type BookingPickupChoices } from '@/services/bookingServices';
import { formatDatetime } from '@/utils';
import { errorMessage } from '@/utils/errors';

export default function BookingPickupOptions({ bookingId }: { bookingId: number }) {
  const [choice, setChoice] = useState<string>();
  const [updated, setUpdated] = useState<BookingPickupChoices>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const { data, loading, error, refresh } = useApiQuery(async () => {
    const response = await getBookingPickup(bookingId);
    if (response.code !== 1000 || !response.result) throw new Error(response.message || 'Chưa tải được các điểm đón.');
    return response.result;
  }, { deps: [bookingId] });
  const latest = updated ?? data;

  if (loading && !latest) return <Spin size="small" />;
  if (error && !latest) return <Alert className="mt-3" type="warning" message={error}
    action={<Button size="small" onClick={() => void refresh()}>Tải lại</Button>} />;
  if (!latest) return null;

  const saved = latest.options.find(option => option.confirmationKey === latest.selectedKey);
  const selected = choice ?? latest.selectedKey;

  async function save() {
    if (!choice || saving) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const response = await chooseBookingPickup(bookingId, choice);
      if (response.code !== 1000 || !response.result) throw new Error(response.message || 'Chưa lưu được điểm đón.');
      setUpdated(response.result);
      setChoice(undefined);
      message.success('Đã lưu điểm đón cho cả đoàn.');
    } catch (failure) {
      setSaveError(errorMessage(failure));
      setChoice(undefined);
      setUpdated(undefined);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return <section className="mt-4 space-y-2 rounded-xl border border-[#d7e5e1] bg-[#f5faf8] p-4">
    <h3 className="m-0 font-semibold text-[#155449]">Điểm đón của cả đoàn</h3>
    {latest.pickupStatus === 'NEEDS_RECONFIRMATION' && <Alert type="warning" showIcon
      message="Điểm đón đã thay đổi. Vui lòng xác nhận lại hoặc liên hệ SGU Tour." />}
    {saved && <div className="text-sm">
      <strong>{saved.address}</strong>
      {saved.arrivalTime && <div>Giờ có mặt {saved.arrivalTime.slice(0, 5)} · giờ Việt Nam</div>}
      {saved.landmark && <div>{saved.landmark}</div>}
      {saved.directionsUrl && /^https:\/\//i.test(saved.directionsUrl) &&
        <a href={saved.directionsUrl} target="_blank" rel="noopener noreferrer">Xem chỉ đường</a>}
    </div>}
    {latest.options.length === 0 && <p className="m-0 text-sm text-slate-600">Chuyến này chưa công bố điểm đón.</p>}
    {!latest.editable && latest.options.length > 0 && !saved &&
      <p className="m-0 text-sm text-slate-600">Đã hết thời gian tự chọn. Liên hệ SGU Tour để xác nhận điểm đón.</p>}
    {latest.editable && <>
      <p className="m-0 text-xs text-slate-600">Chọn một điểm đón cho tất cả hành khách trong đơn.
        {latest.chooseUntil && ` Có thể chọn trước ${formatDatetime(latest.chooseUntil)}.`}
      </p>
      <Radio.Group value={selected} onChange={event => setChoice(event.target.value)} disabled={saving}
        className="flex flex-col gap-2">
        {latest.options.map(option => <Radio key={option.confirmationKey} value={option.confirmationKey}>
          {option.arrivalTime && `${option.arrivalTime.slice(0, 5)} · `}{option.address}
        </Radio>)}
      </Radio.Group>
      {saveError && <Alert type="error" message={saveError} />}
      <Button type="primary" size="small" disabled={!choice || choice === latest.selectedKey} loading={saving}
        onClick={() => void save()}>Xác nhận điểm đón</Button>
    </>}
  </section>;
}
