export type ChatPageContext = { kind: 'general' | 'tour' | 'checkout' | 'policies'; tourId?: number; tourTitle?: string; bookingId?: number };
export function chatPrompts(context: ChatPageContext) {
  if (context.kind === 'checkout') return [context.bookingId ? `Tra cứu booking #${context.bookingId}: tôi còn bao lâu để thanh toán?` : 'Tôi cần chuẩn bị thông tin gì để đặt tour?', 'Giữ chỗ và thanh toán như thế nào?', 'Tôi kiểm tra trạng thái thanh toán ở đâu?'];
  if (context.kind === 'tour' && context.tourId) return ['Xem lịch trình tour này', 'Giá tham khảo tour này', 'Tour này còn lịch khởi hành không?'];
  if (context.kind === 'policies') return ['Chính sách giữ chỗ và thanh toán', 'Tôi theo dõi đơn đặt tour ở đâu?', 'Tôi cần chuẩn bị gì trước khi khởi hành?'];
  return ['Gợi ý tour miền Bắc 3 ngày', 'Tìm tour biển cho gia đình', 'So sánh các tour trong danh sách vừa tìm'];
}
