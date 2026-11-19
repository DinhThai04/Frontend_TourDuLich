import type { ITour } from '@/types/Tour';
export const normalizeTourText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export const tourInterests = [
  { id: 'sea', label: 'Biển đảo', matches: (tour: ITour) => {
    const text = `${tour.tourTitle} ${tour.description ?? ''}`.toLowerCase().normalize('NFC');
    return /biển(?!\s+mây)|đảo/.test(text) || (!/[\u00c0-\u1ef9]/.test(text) && /\b(bien(?!\s+may)|dao)\b/.test(text));
  } },
  { id: 'nature', label: 'Núi rừng', matches: (tour: ITour) => /\b(nui|rung|thac)\b|cao nguyen|ruong bac thang|sa pa|sapa|moc chau|son la|ha giang|ba vi|da lat|tam dao|mai chau/.test(normalizeTourText(`${tour.tourTitle} ${tour.description ?? ''} ${tour.destinationCity?.city ?? ''}`)) },
  { id: 'relax', label: 'Nghỉ dưỡng', matches: (tour: ITour) => /nghi duong|resort/.test(normalizeTourText(`${tour.tourTitle} ${tour.description ?? ''}`)) },
  { id: 'culture', label: 'Khám phá văn hóa', matches: (tour: ITour) => /van hoa|di san|pho co|lang nghe/.test(normalizeTourText(`${tour.tourTitle} ${tour.description ?? ''}`)) },
  { id: 'short', label: 'Chuyến đi ngắn', matches: (tour: ITour) => tour.duration > 0 && tour.duration <= 3 },
];
