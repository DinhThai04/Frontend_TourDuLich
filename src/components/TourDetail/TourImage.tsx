import { Image, Row, Col, Carousel, Button } from "antd";
import { useState, useRef } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

interface TourImagesProps {
  imageIds: string[];
}

export default function TourImages({ imageIds }: TourImagesProps) {
  if (!imageIds || imageIds.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const carouselRef = useRef<any>(null);

  // Tính toán số lượng ảnh còn lại (trừ đi 3 ảnh đầu tiên)
  const remainingCount = Math.max(0, imageIds.length - 2);
  
  // Chỉ hiển thị 3 ảnh đầu tiên trong cột nhỏ
  const visibleSideImages = imageIds.slice(0, 2);
  
  // Chiều cao của ảnh lớn và các thông số
  const mainImageHeight = 435;
  const gutter = 5; // Khoảng cách giữa các ảnh nhỏ
  const sideImageHeight = (mainImageHeight - gutter * 2) / 3; // Trừ đi 2 gutter (giữa 3 ảnh)

  const handleSelectImage = (index: number) => {
    setActiveIndex(index);
    carouselRef.current?.goTo(index);
  };

  const handlePrev = () => {
    const prevIndex = activeIndex === 0 ? imageIds.length - 1 : activeIndex - 1;
    setActiveIndex(prevIndex);
    carouselRef.current?.prev();
  };

  const handleNext = () => {
    const nextIndex = activeIndex === imageIds.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
    carouselRef.current?.next();
  };

  const handleImageClick = () => {
    setIsPreviewVisible(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewVisible(false);
  };

  return (
    <Row gutter={12}>
      {/* Cột nhỏ ảnh */}
      <Col span={6}>
        <Row gutter={[0, gutter]} style={{ height: mainImageHeight }}>
          {/* Hiển thị 3 ảnh đầu tiên bình thường */}
          {visibleSideImages.map((img, idx) => (
            <Col span={24} key={idx}>
              <div
  style={{
    width: "100%",
    height: sideImageHeight,
    overflow: "hidden",
    borderRadius: 4,
    cursor: "pointer",
    border: idx === activeIndex ? "2px solid #0B5DA7" : "2px solid transparent",
    position: "relative"
  }}
  onClick={() => handleSelectImage(idx)}
>
  <div style={{ width: "100%", height: "100%" }}>
    <Image
      src={img}
      preview={false}
      width="100%"
      height="100%"
      style={{
        objectFit: "cover"
      }}
    />
  </div>
</div>
            </Col>
          ))}
          
          {/* Hiển thị ảnh thứ 4 với overlay và số lượng còn lại (nếu có nhiều hơn 3 ảnh) */}
          {remainingCount > 0 && (
            <Col span={24}>
              <div
                style={{
                  width: "100%",
                  height: sideImageHeight,
                  overflow: "hidden",
                  borderRadius: 4,
                  cursor: "pointer",
                  position: "relative"
                }}
                onClick={() => handleSelectImage(3)} // Chọn ảnh thứ 4
              >
                <Image
                  src={imageIds[3]} // Hiển thị ảnh thứ 4
                  preview={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "blur(2px) brightness(0.7)"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0, 0, 0, 0.4)",
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "bold"
                  }}
                >
                  +{remainingCount}
                </div>
              </div>
            </Col>
          )}
        </Row>
      </Col>

      {/* Ảnh lớn với Carousel */}
      <Col span={18}>
        <div style={{ position: "relative" }}>
          <Carousel
            ref={carouselRef}
            dots={false}
            afterChange={(current) => setActiveIndex(current)}
            arrows={false}
          >
            {imageIds.map((img, idx) => (
              <div key={idx}>
                <Image
                  src={img}
                  height={mainImageHeight}
                  width="100%"
                  style={{
                    borderRadius: 4,
                    objectFit: "cover",
                    cursor: "pointer"
                  }}
                  onClick={handleImageClick}
                  preview={{
                    visible: isPreviewVisible && idx === activeIndex,
                    onVisibleChange: (visible) => {
                      if (!visible) handlePreviewClose();
                    },
                    mask: null,
                    src: img
                  }}
                />
              </div>
            ))}
          </Carousel>

          {/* Custom arrows */}
          {imageIds.length > 1 && (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<LeftOutlined />}
                onClick={handlePrev}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#0B5DA7",
                  border: "none",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                }}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<RightOutlined />}
                onClick={handleNext}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#0B5DA7",
                  border: "none",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                }}
              />
            </>
          )}
        </div>
      </Col>

      {/* Preview tất cả ảnh */}
      <Image.PreviewGroup
        preview={{
          visible: isPreviewVisible,
          onVisibleChange: (visible) => {
            if (!visible) handlePreviewClose();
          },
          current: activeIndex,
          onChange: (current) => {
            setActiveIndex(current);
            carouselRef.current?.goTo(current);
          }
        }}
      >
        {imageIds.map((img, idx) => (
          <Image key={idx} src={img} style={{ display: 'none' }} />
        ))}
      </Image.PreviewGroup>
    </Row>
  );
}