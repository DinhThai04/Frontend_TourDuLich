import { Typography } from "antd/lib";

const { Title } = Typography;

export default function BookingTitle() {
    return (
        <div style={{ textAlign: "center", marginBottom: "24px", color: "black" }}>
            <Title level={2} style={{ color: "black", margin: 0 }}>
              Đặt Tour Du Lịch
            </Title>
            <p>Điền thông tin của bạn để thực hiện đặt tour và thanh toán</p>
        </div>
    )
}