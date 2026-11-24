export type ChatPageContext =
  | { kind: 'general' | 'policies' }
  | { kind: 'tour'; tourId: number; tourTitle?: string; departureId?: number }
  | { kind: 'checkout'; bookingId?: number };
export function chatPrompts(context: ChatPageContext) {
  if (context.kind === 'checkout') return [context.bookingId ? `Tra cứu booking #${context.bookingId}: tôi còn bao lâu để thanh toán?` : 'Tôi cần chuẩn bị thông tin gì để đặt tour?', 'Giữ chỗ và thanh toán như thế nào?', context.bookingId ? 'Tôi bị trừ tiền rồi, giờ làm gì?' : 'Tôi kiểm tra trạng thái thanh toán ở đâu?'];
  if (context.kind === 'tour') return ['Xem lịch trình tour này', 'Giá tham khảo tour này',
    context.departureId ? 'Ngày đã chọn còn chỗ không?' : 'Tour này còn lịch khởi hành không?',
    ...(context.departureId ? ['Điểm tập trung ở đâu?'] : [])];
  if (context.kind === 'policies') return ['Chính sách giữ chỗ và thanh toán', 'Tôi theo dõi đơn đặt tour ở đâu?', 'Tôi cần chuẩn bị gì trước khi khởi hành?'];
  return ['Cuối tuần đi đâu với 5 triệu cho 2 người lớn?', 'Tìm tour biển cho gia đình', 'So sánh các tour trong danh sách vừa tìm'];
}
