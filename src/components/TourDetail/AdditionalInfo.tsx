import { Row, Col, Typography } from "antd";
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  CarOutlined,
  CoffeeOutlined,
  TeamOutlined,
  PercentageOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function AdditionalInfo() {
  return (
    <div>
      <Title level={4} style={{ textAlign: "center", marginTop: 38 , marginBottom: 18, fontWeight: 700 }}>
        THÔNG TIN THÊM VỀ CHUYẾN ĐI
      </Title>
      <Row gutter={[32, 32]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <EnvironmentOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Text strong style={{ fontSize: 16, fontWeight: "bold", display: "block", marginTop: 4 }}>Điểm tham quan</Text>
          <Text>Hà Giang, Đồng Văn, Mã Pí Lèng, Cao Bằng, Thác Bản Giốc, Hồ Ba Bể, Mèo...</Text>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <CoffeeOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Text strong style={{ fontSize: 16, fontWeight: "bold", display: "block", marginTop: 4 }}>Ẩm thực</Text>
          <Text>Theo thực đơn</Text>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <TeamOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Text strong style={{ fontSize: 16, fontWeight: "bold", display: "block", marginTop: 4 }}>Đối tượng thích hợp</Text>
          <Text>Cặp đôi, Gia đình nhiều thế hệ, Thanh niên</Text>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <ClockCircleOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Text strong style={{ fontSize: 16, fontWeight: "bold", display: "block", marginTop: 4 }}>Thời gian lý tưởng</Text>
          <Text>Quanh năm</Text>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <CarOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Text strong style={{ fontSize: 16, fontWeight: "bold", display: "block", marginTop: 4 }}>Phương tiện</Text>
          <Text>Máy bay, Xe du lịch</Text>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <PercentageOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Text strong style={{ fontSize: 16, fontWeight: "bold", display: "block", marginTop: 4 }}>Khuyến mãi</Text>
          <Text>Đã bao gồm trong giá tour</Text>
        </Col>
      </Row>
    </div>
  );
}