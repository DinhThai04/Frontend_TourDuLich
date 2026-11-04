/** DatePicker represents the intended Vietnam wall time; do not convert its clock to UTC. */
export function departureWallTime(value: { isValid(): boolean; format(pattern: string): string } | null | undefined): string {
  if (!value?.isValid()) throw new Error('Vui lòng chọn ngày giờ hợp lệ');
  return value.format('YYYY-MM-DDTHH:mm:ss');
}
