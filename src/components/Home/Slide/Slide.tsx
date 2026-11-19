import { Link } from 'react-router-dom';
import { Alert, Button, Skeleton } from 'antd';
import Container from '@/components/Share/Container';
import ResponsiveImage from '@/components/Share/ResponsiveImage';
import { normalizeTourText, tourInterests } from '../tourInterests';
import { useHomeCatalog } from '../homeCatalogContext';
const experiences = [
  { id: 'sea', title: 'Về miền biển', text: 'Dành những ngày thảnh thơi bên sóng nước.' },
  { id: 'nature', title: 'Lên miền núi', text: 'Đổi nhịp sống giữa núi rừng và những cung đường xanh.' },
  { id: 'culture', title: 'Ghé miền di sản', text: 'Khám phá những dấu ấn và cảnh sắc làm nên Việt Nam.' },
];
export default function Slide() {
  const { tours, status, retry } = useHomeCatalog();
  const used = new Set<number>();
  const available = experiences.flatMap(experience => {
    const matches = tours.filter(tour => tourInterests.find(group => group.id === experience.id)?.matches(tour));
    if (experience.id === 'nature') matches.sort((a, b) => Number(/moc chau|sa pa|sapa|ha giang|ta xua|nui/.test(normalizeTourText(b.tourTitle))) - Number(/moc chau|sa pa|sapa|ha giang|ta xua|nui/.test(normalizeTourText(a.tourTitle))));
    const tour = matches.find(item => !used.has(item.id) && item.imageIds?.length) ?? matches.find(item => item.imageIds?.length) ?? matches[0];
    if (!tour) return [];
    used.add(tour.id);
    return [{ ...experience, tour }];
  });
  return <section className="home-section home-inspiration home-inspiration-editorial"><Container>
    <div className="home-section-heading"><p className="home-eyebrow">CHỌN CẢM HỨNG CHO HÀNH TRÌNH</p>
      <h2>Một Việt Nam, nhiều cách khám phá</h2><p>Một ngày bên biển, một chuyến lên núi hay một lần ghé miền di sản. Bạn muốn bắt đầu ở đâu?</p></div>
    {status === 'loading' ? <Skeleton active paragraph={{ rows: 4 }} /> : status === 'error' ? <Alert type="info" message="Chưa tải được gợi ý trải nghiệm" action={<Button onClick={retry}>Thử lại</Button>} /> : available.length ? <div className="home-inspiration-mosaic" data-count={available.length}>{available.map((item, index) => <Link key={item.id} to={`/?experience=${item.id}#tour-noi-bat`} className={`home-experience-card home-inspiration-tile ${index === 0 ? 'home-inspiration-tile--lead' : ''}`}>
      <div className="home-experience-image"><ResponsiveImage src={item.tour.imageIds?.[0]} alt={`Ảnh tour ${item.tour.tourTitle}`} width={960} height={720} imageWidth={index === 0 ? 960 : 640} sizes={index === 0 ? '(max-width:767px) calc(100vw - 32px), 720px' : '(max-width:767px) 50vw, 520px'} /></div>
      {item.tour.destinationCity?.city && <span className="home-inspiration-place">{item.tour.destinationCity.city}</span>}
      <div className="home-experience-copy"><h3>{item.title}</h3><p>{item.text}</p><span>Khám phá hành trình <span aria-hidden="true">→</span></span></div>
    </Link>)}</div> : <Link className="home-text-link" to="/tours">Khám phá danh sách tour <span aria-hidden="true">→</span></Link>}
  </Container></section>;
}
