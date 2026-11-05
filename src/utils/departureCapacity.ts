export interface DepartureCapacity {
  id: number; tourId: number; tourCode: string; departureDate: string; returnDate: string;
  capacity: number | null; availableSeats: number; version: number;
  paidSeats: number; heldSeats: number; overdueHolds: number; historyCount: number;
  scheduleEditable: boolean; capacityReviewRequired: boolean; issues: string[]; blockingIssues: string[]; warnings: string[];
}
export function capacityUpdate(state: DepartureCapacity, capacity: number, confirmCapacity: boolean,
  dates?: { departureDate: string; returnDate: string }) {
  if (!Number.isInteger(capacity) || capacity < state.paidSeats + state.heldSeats || capacity > 32767)
    throw new Error('Tổng sức chứa không hợp lệ hoặc nhỏ hơn số chỗ đã chiếm');
  if (state.blockingIssues.length) throw new Error(state.blockingIssues.join('; '));
  if (state.capacityReviewRequired && !confirmCapacity) throw new Error('Cần xác nhận tổng sức chứa thực tế');
  return { id: state.id, tourId: state.tourId, capacity, expectedVersion: state.version, confirmCapacity,
    ...(state.scheduleEditable && dates ? dates : {}) };
}
