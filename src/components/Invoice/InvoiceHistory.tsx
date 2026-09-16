import { List, Card, Typography } from 'antd';

const { Title, Text } = Typography;

export default function InvoiceHistory() {
	const data = [
		{ id: 'inv-1', amount: 1000000, date: '2025-09-01' },
		{ id: 'inv-2', amount: 2500000, date: '2025-09-15' },
	];

	return (
		<div>
			<Title level={5}>Lịch sử hóa đơn</Title>
			<List
				dataSource={data}
				renderItem={(item) => (
					<List.Item key={item.id}>
						<Card style={{ width: '100%' }}>
							<Text strong>{item.id}</Text>
							<br />
							<Text>{item.date}</Text>
							<br />
							<Text>{item.amount.toLocaleString('vi-VN')} đ</Text>
						</Card>
					</List.Item>
				)}
			/>
		</div>
	);
}
