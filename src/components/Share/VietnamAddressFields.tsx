import { Input, Select } from 'antd';
import { provinces, type AddressDraft } from '@/utils/vietnamAddress';

export default function VietnamAddressFields({ value, onChange, id }: {
  value?: AddressDraft;
  onChange?: (value: AddressDraft) => void;
  id?: string;
}) {
  const province = provinces.find(item => item.value === value?.province);
  const ward = province?.wards.find(item => item.value === value?.ward);

  return <div className="flex min-w-0 flex-col gap-2">
    <Select id={id} aria-label="Tỉnh hoặc thành phố" placeholder="Chọn tỉnh/thành phố"
      showSearch optionFilterProp="label" options={provinces} value={province?.value}
      onChange={province => onChange?.({ province })} />
    <Select aria-label="Xã hoặc phường" placeholder="Chọn xã/phường" showSearch optionFilterProp="label"
      options={province?.wards ?? []} value={ward?.value} disabled={!province}
      onChange={ward => onChange?.({ province: province?.value, ward })} />
    <Input aria-label="Số nhà, tên đường" placeholder="Nhập số nhà, tên đường"
      autoComplete="street-address" value={value?.street ?? ''} disabled={!ward} maxLength={255}
      onChange={event => onChange?.({ ...value, street: event.target.value })} />
  </div>;
}
