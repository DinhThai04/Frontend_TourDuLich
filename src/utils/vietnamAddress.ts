import rows from '@/data/vietnamAddress.json';
import { streetAddress } from './contactValidation';

export type AddressDraft = { province?: number; ward?: number; street?: string };

export const provinces = (rows as [number, string, [number, string][]][]).map(([value, label, wards]) => ({
  value,
  label,
  wards: wards.map(([value, label]) => ({ value, label })),
}));

export function formatVietnamAddress(value?: AddressDraft): string | undefined {
  const province = provinces.find(item => item.value === value?.province);
  const ward = province?.wards.find(item => item.value === value?.ward);
  const street = value?.street?.trim();
  if (!province || !ward || !street || !streetAddress.test(street) || !/[\p{L}\p{N}]/u.test(street)) return;
  const address = [street, ward.label, province.label].join(', ');
  if (address.length <= 255) return address;
}

export function parseVietnamAddress(address?: string | null): AddressDraft {
  const parts = address?.split(',').map(part => part.trim()) ?? [];
  const province = provinces.find(item => item.label === parts.at(-1));
  const ward = province?.wards.find(item => item.label === parts.at(-2));
  return ward ? { province: province?.value, ward: ward.value, street: parts.slice(0, -2).join(', ') } : {};
}

export const validateVietnamAddress = async (_rule: unknown, value?: AddressDraft) => {
  if (!formatVietnamAddress(value)) {
    throw new Error('Chọn tỉnh/thành phố, xã/phường và nhập số nhà, tên đường hợp lệ. Tổng địa chỉ tối đa 255 ký tự.');
  }
};
