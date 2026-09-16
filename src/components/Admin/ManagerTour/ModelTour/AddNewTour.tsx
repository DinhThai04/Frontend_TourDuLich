import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Select, Upload, Space, Card, Tooltip } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import type { ILocation, ITourPrice, IVehicle } from '@/types/Tour';
import { getAllDepartures, getAllDestinations, getAllPrice, getAllVehicles } from '@/services/tourServices';

const { TextArea } = Input;
const { Option } = Select;

interface AddTourProps {
  onSubmit?: (values: any) => void;
}

const AddNewTour: React.FC<AddTourProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [departureList, setDepartureList] = useState<ILocation[]>([]);
  const [destinationList, setDestinationList] = useState<ILocation[]>([]);
  const [vehicleList, setVehicleList] = useState<IVehicle[]>([]);
  const [tourPriceList, setTourPriceList] = useState<ITourPrice[]>([]);

  const fetchDataDestinations = async () => {
    try {
      const res = await getAllDestinations();
      if (res.code === 1000) {
        setDestinationList(res.result);
      }
    } catch (error) {
      console.error("Failed to fetch destinations combobox:", error);
    }
  }

  const fetchDataDepartures = async () => {
    try {
      const res = await getAllDepartures();
      if (res.code === 1000) {
        setDepartureList(res.result);
      }
    } catch (error) {
      console.error("Failed to fetch departures combobox:", error);
    }
  }

  const fetchDataVehicles = async () => {
    try {
      const res = await getAllVehicles();
      if (res.code === 1000) {
        setVehicleList(res.result);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles combobox:", error);
    }
  }

  const fetchDataTourPrice = async () => {
    try {
      const res = await getAllPrice();
      if (res.code === 1000) {
        setTourPriceList(res.result);
      }
    } catch (error) {
      console.error("Failed to fetch tour price combobox:", error);
    }
  }

  useEffect(() => {
    fetchDataDestinations();
    fetchDataDepartures();
    fetchDataVehicles();
    fetchDataTourPrice();
  }, []);

  const handleFinish = async (values: any) => {
    if (onSubmit) await onSubmit(values); // <-- thêm await
    form.resetFields();
  };


  return (
    <Card
      title="Thêm Tour Mới"
      bordered={false}
      style={{
        maxWidth: 800,
        margin: '0 auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 12,
      }}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Mã chương trình"
          name="tourProgram"
          rules={[{ required: true, message: 'Vui lòng nhập tên tour!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tiêu đề"
          name="tourTitle"
          rules={[{ required: true, message: 'Vui lòng nhập chương trình!' }]}
        >
          <Input placeholder="VD: Đà Nẵng - Hội An - Huế" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <TextArea rows={3} placeholder="Giới thiệu ngắn gọn về tour..." />
        </Form.Item>

        <Space size="large" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Điểm khởi hành */}
          <Form.Item
            label="Điểm khởi hành"
            name="departureLocationId"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Chọn điểm khởi hành!' }]}
          >
            <Select placeholder="Chọn điểm đi">
              {departureList.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.city}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Điểm đến */}
          <Form.Item
            label="Điểm đến"
            name="destinationLocationId"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Chọn điểm đến!' }]}
          >
            <Select placeholder="Chọn điểm đến">
              {destinationList.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.city}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Combo giá"
            name="tourPriceId"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Chọn combo giá!' }]}
          >
            <Select placeholder="Chọn combo giá" optionLabelProp="label">
              {tourPriceList.map((item) => {
                const label = `Người lớn: ${item.adultPrice.toLocaleString()} | Trẻ em: ${item.childPrice.toLocaleString()} | Em bé: ${item.toddlerPrice.toLocaleString()} | Sơ sinh: ${item.infantPrice.toLocaleString()} | Phụ thu: ${item.singleSupplementPrice.toLocaleString()}`;

                return (
                  <Option
                    key={item.id}
                    value={item.id}
                    label={`Combo ${item.id}`}
                  >
                    <Tooltip title={label} placement="right">
                      <div
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {label}
                      </div>
                    </Tooltip>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Space>

        <Space size="large" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Form.Item
            label="Phương tiện"
            name="vehicleId"
            style={{ flex: 1 }}
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn phương tiện">
              {vehicleList.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Thời lượng (ngày)" name="duration" style={{ flex: 1 }}>
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Giá cơ bản (VNĐ)" name="basePrice" style={{ flex: 1 }}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
        </Space>

        <Form.Item
          label="Hình ảnh tour"
          name="files"
          valuePropName="fileList"
          getValueFromEvent={(e) => e.fileList}
        >
          <Upload listType="picture" beforeUpload={() => false} multiple>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>


        <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
            Lưu Tour
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddNewTour;
