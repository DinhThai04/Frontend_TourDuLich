import { useState } from "react";
import { Card, Typography, Button } from "antd";
import {
    HeartOutlined,
    CalendarOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import type { ITour } from "@/types/Tour";

const { Text, Title } = Typography;


interface TourCardProps {
    tour: ITour;
}

export default function TourCard({ tour }: TourCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            style={{
                borderRadius: 12,
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                cursor: "pointer",
            }}
            bodyStyle={{ padding: 0 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Ảnh */}
            <div style={{ position: "relative", height: 290, overflow: "hidden" }}>
                <img
                    src={tour.imageIds[0]}
                    alt={tour.tourTitle}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: isHovered ? "scale(1.05)" : "scale(1)",
                        transition: "transform 0.4s ease-in-out",
                        display: "block",
                    }}
                />
                <Button
                    type="text"
                    icon={<HeartOutlined style={{ color: "white", fontSize: 20 }} />}
                    style={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}
                />
            </div>

            {/* Thanh xanh dưới ảnh */}
            <div style={{ height: 60, background: "#0B5DA7" }} />

            {/* Overlay trên: thông tin tour */}
            <div
                style={{
                    background: "rgba(255,255,255,0.95)",
                    padding: "12px 12px 0px 12px",
                    borderRadius: "12px 12px 0 0",
                    position: "absolute",
                    left: 10,
                    right: 10,
                    bottom: 72,
                    zIndex: 3,
                    transform: isHovered ? "translateY(-165%)" : "translateY(0)",
                    transition: "transform 0.4s ease-in-out",
                }}
            >
                <div style={{ height: 28 }}> {/* chiều cao cứng đủ cho cả 2 text */}
                    {isHovered ? (
                       <Text style={{ fontSize: 10, display: "block", fontWeight: "600" }}>
                        <Text style={{ fontSize: 10, fontWeight: "700" }}>Chương trình {tour.tourProgram}</Text> : {tour.tourTitle}
                        </Text>


                    ) : (
                        <Text style={{ fontSize: 12, fontWeight: 700, display: "block" }}>
                            {tour.tourTitle}
                        </Text>
                    )}
                </div>


                <div
                    style={{
                        display: isHovered ? "none" : "flex",
                        alignItems: "center",
                        marginTop: 12,
                        marginBottom:5
                    }}
                >
                    <GlobalOutlined style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 10, fontWeight: "bold", marginRight: 4 }}>
                        Khởi hành:
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0F5BA0" }}>
                        {tour.departureCity.city}
                    </Text>
                </div>

                <div
                    style={{
                        display: isHovered ? "none" : "flex",
                        alignItems: "center",
                        marginBottom:5
                    }}
                >
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 10, fontWeight: "bold", marginRight: 4 }}>
                        Mã chương trình:
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                        {tour.tourProgram} ({tour.duration})
                    </Text>
                </div>

                {isHovered && (
                    <div style={{ marginTop: 8 }}>
                        {/* <div>
                            <Text style={{ fontSize: 10, display: "block", fontWeight: "600" }}>
                            <Text style={{ fontSize: 10, fontWeight: "700" }}>Điểm tham quan: </Text> : {tour.attractions.join(", ")}
                            </Text>
                           
                        </div> */}


                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <Text style={{ fontSize: 11, fontWeight: "bold" }}>Thời gian:</Text> <Text style={{ fontSize: 11, fontWeight: 500 }}>{tour.duration}N{tour.duration-1}Đ</Text>
                            </div>
                            <div>
                                <Text style={{ fontSize: 11, fontWeight: "bold" }}>Phương tiện:</Text> <Text style={{ fontSize: 11, fontWeight: 500 }}>{tour.vehicle.name}</Text>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            <div
                style={{
                    background: "rgba(255,255,255,0.95)",
                    padding: "12px 12px 0px 12px",
                    position: "absolute",
                    left: 10,
                    right: 10,
                    bottom: 72,
                    zIndex: 2,
                    height: isHovered ? 170 : 0,
                    transition: "height 0.4s ease-in-out", 
                }}
            ></div>

            {/* Overlay dưới: giá và button */}
            <div
                style={{
                    background: "rgba(255,255,255,0.95)",
                    padding: "0 12px 12px 12px",
                    borderRadius: "0 0 12px 12px", // bo tròn phía dưới
                    position: "absolute",
                    left: 10,
                    right: 10,
                    bottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    zIndex: 3
                }}
            >
                <div>
                    <Text style={{ fontSize: 12, fontWeight: 600 }}>Giá từ</Text>
                    <Title level={4} style={{ color: "#D5382C", margin: 0 }}>
                        {tour.basePrice.toLocaleString("vi-VN")} đ
                    </Title>
                </div>

                <Button
                    type="link"
                    style={{
                        paddingRight: 0,
                        fontSize: 12,
                        fontWeight: "bold",
                        color: "#000000",
                    }}
                >
                    Xem chi tiết →
                </Button>
            </div>




        </Card>
    );
}