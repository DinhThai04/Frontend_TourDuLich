// import React, { useEffect, useState } from 'react';
// import { Skeleton, Table } from 'antd';
// import Container from '@/components/Share/Container';
// import type { ITour } from '@/types/Tour';

// export const mockLikedTours: ITour[] = [
//   {
//     id: 1,
//     tourTitle: 'Tour Nhật Bản 5 ngày 4 đêm',
//     tourProgram: 'Khám phá Nhật Bản từ Tokyo đến Kyoto',
//     description: 'Trải nghiệm văn hóa, ẩm thực và ngắm hoa anh đào',
//     duration: 5,
//     basePrice: 12000000,
//     imageIds: [
//       'https://images.unsplash.com/photo-1560369311-1a12e1c8729c?auto=format&fit=crop&w=800&q=80',
//       'https://images.unsplash.com/photo-1580159746530-c33aa6a16223?auto=format&fit=crop&w=800&q=80',
//     ],
//     itineraries: [
//       {
//         id: 101,
//         dayNumber: 1,
//         title: 'Tokyo',
//         description: 'Tham quan đền Asakusa',
//         meal: 'Trưa, Tối',
//       },
//       {
//         id: 102,
//         dayNumber: 2,
//         title: 'Kyoto',
//         description: 'Ngắm chùa vàng Kinkaku-ji',
//         meal: 'Sáng, Trưa, Tối',
//       },
//     ],
//     departureCity: { city: 'Hà Nội', type: 'airport' },
//     destinationCity: { city: 'Tokyo', type: 'airport' },
//     tourPrice: {
//       id: 1,
//       adultPrice: 12000000,
//       childPrice: 9000000,
//       infantPrice: 4000000,
//       toddlerPrice: 2000000,
//       singleSupplementPrice: 3000000,
//     },
//     vehicle: { id: 'plane', name: 'Máy bay' },
//   },
//   {
//     id: 2,
//     tourTitle: 'Tour Hàn Quốc 4 ngày 3 đêm',
//     tourProgram: 'Khám phá Seoul và Busan',
//     description: 'Thưởng thức ẩm thực, mua sắm và tham quan các điểm nổi tiếng',
//     duration: 4,
//     basePrice: 9500000,
//     imageIds: [
//       'https://images.unsplash.com/photo-1570867183347-c4b5de45a0f2?auto=format&fit=crop&w=800&q=80',
//     ],
//     itineraries: [
//       {
//         id: 103,
//         dayNumber: 1,
//         title: 'Seoul',
//         description: 'Tham quan cung điện Gyeongbokgung',
//         meal: 'Trưa, Tối',
//       },
//       {
//         id: 104,
//         dayNumber: 2,
//         title: 'Busan',
//         description: 'Tắm biển Haeundae',
//         meal: 'Sáng, Trưa, Tối',
//       },
//     ],
//     departureCity: { city: 'Hồ Chí Minh', type: 'airport' },
//     destinationCity: { city: 'Seoul', type: 'airport' },
//     tourPrice: {
//       id: 2,
//       adultPrice: 9500000,
//       childPrice: 7000000,
//       infantPrice: 3000000,
//       toddlerPrice: 1500000,
//       singleSupplementPrice: 2000000,
//     },
//     vehicle: { id: 'plane', name: 'Máy bay' },
//   },
//   {
//     id: 3,
//     tourTitle: 'Tour Thái Lan 3 ngày 2 đêm',
//     tourProgram: 'Trải nghiệm Bangkok và Pattaya',
//     description: 'Tham quan đền nổi tiếng, phố đi bộ, chợ nổi',
//     duration: 3,
//     basePrice: 6800000,
//     imageIds: [
//       'https://images.unsplash.com/photo-1588673153384-5b0d1d0cb8d5?auto=format&fit=crop&w=800&q=80',
//     ],
//     itineraries: [
//       {
//         id: 105,
//         dayNumber: 1,
//         title: 'Bangkok',
//         description: 'Tham quan đền Wat Arun',
//         meal: 'Trưa, Tối',
//       },
//       {
//         id: 106,
//         dayNumber: 2,
//         title: 'Pattaya',
//         description: 'Tham quan đảo Coral',
//         meal: 'Sáng, Trưa, Tối',
//       },
//     ],
//     departureCity: { city: 'Đà Nẵng', type: 'airport' },
//     destinationCity: { city: 'Bangkok', type: 'airport' },
//     tourPrice: {
//       id: 3,
//       adultPrice: 6800000,
//       childPrice: 5000000,
//       infantPrice: 2000000,
//       toddlerPrice: 1000000,
//       singleSupplementPrice: 1500000,
//     },
//     vehicle: { id: 'plane', name: 'Máy bay' },
//   },
//   {
//     id: 4,
//     tourTitle: 'Tour Singapore 3 ngày 2 đêm',
//     tourProgram: 'Khám phá Marina Bay và Sentosa',
//     description: 'Vui chơi, mua sắm, check-in các địa điểm nổi tiếng',
//     duration: 3,
//     basePrice: 10500000,
//     imageIds: [
//       'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80',
//     ],
//     itineraries: [
//       {
//         id: 107,
//         dayNumber: 1,
//         title: 'Marina Bay',
//         description: 'Tham quan Gardens by the Bay',
//         meal: 'Trưa, Tối',
//       },
//       {
//         id: 108,
//         dayNumber: 2,
//         title: 'Sentosa',
//         description: 'Vui chơi Universal Studio',
//         meal: 'Sáng, Trưa, Tối',
//       },
//     ],
//     departureCity: { city: 'Hà Nội', type: 'airport' },
//     destinationCity: { city: 'Singapore', type: 'airport' },
//     tourPrice: {
//       id: 4,
//       adultPrice: 10500000,
//       childPrice: 7500000,
//       infantPrice: 3500000,
//       toddlerPrice: 1500000,
//       singleSupplementPrice: 2000000,
//     },
//     vehicle: { id: 'plane', name: 'Máy bay' },
//   },
// ];

// const Liked: React.FC = () => {
//   const [tours, setTours] = useState<ITour[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     setTours(mockLikedTours);
//     setLoading(false);
//   }, []);

//   const columns = [
//     {
//       title: 'Tour',
//       dataIndex: 'tourTitle',
//       key: 'tourTitle',
//       render: (text: string, record: ITour) => (
//         <div className="flex items-center gap-2">
//           <img src={record.imageIds[0]} alt={text} className="w-16 h-12 object-cover rounded-md" />
//           <span>{text}</span>
//         </div>
//       ),
//     },
//     {
//       title: 'Chương trình',
//       dataIndex: 'tourProgram',
//       key: 'tourProgram',
//     },
//     {
//       title: 'Khởi hành',
//       dataIndex: ['departureCity', 'city'],
//       key: 'departureCity',
//     },
//     {
//       title: 'Điểm đến',
//       dataIndex: ['destinationCity', 'city'],
//       key: 'destinationCity',
//     },
//     {
//       title: 'Phương tiện',
//       dataIndex: ['vehicle', 'name'],
//       key: 'vehicle',
//     },
//     {
//       title: 'Giá cơ bản',
//       dataIndex: 'basePrice',
//       key: 'basePrice',
//       render: (price: number) =>
//         price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
//     },
//   ];

//   return (
//     <Container>
//       <h3 className="text-xl font-semibold !mb-6">Tour yêu thích đã lưu</h3>

//       {loading ? (
//         <Skeleton active paragraph={{ rows: 4 }} />
//       ) : tours.length === 0 ? (
//         <p>Chưa có tour nào được lưu.</p>
//       ) : (
//         <Table
//           dataSource={tours}
//           columns={columns}
//           rowKey="id"
//           scroll={{ x: 'max-content', y: 400 }}
//           pagination={{ pageSize: 5 }}
//           locale={{ emptyText: 'Chưa có tour nào được lưu.' }}
//         />
//       )}
//     </Container>
//   );
// };

// export default Liked;
