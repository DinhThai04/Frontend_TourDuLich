const labels = ['Thông tin hành khách', 'Giữ chỗ và thanh toán', 'Kết quả đặt tour'];
export default function JourneySteps({ current }: { current: number }) {
  return <ol className="journey-steps" aria-label="Các bước đặt tour">{labels.map((label, i) => <li key={label} aria-current={i === current ? 'step' : undefined} className={i <= current ? 'is-current' : ''}><span>{i + 1}</span>{label}</li>)}</ol>;
}
