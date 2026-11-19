import { useNavigate } from 'react-router-dom';
import CatalogTourCard from '@/components/Home/PopularTours/TourCard';
import type { ITour } from '@/types/Tour';

/** Related tours use the same visible price, dates and keyboard action as catalog cards. */
export default function TourCard({ tour }: { tour: ITour }) {
  const navigate = useNavigate();
  return <CatalogTourCard tour={tour} onBooking={id => navigate(`/tours/detail/${id}`)} />;
}
