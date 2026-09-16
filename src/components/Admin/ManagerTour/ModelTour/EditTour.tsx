import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Select, Upload, Space, Card, Tooltip } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import type { ILocation, ITourPrice, IVehicle } from '@/types/Tour';
import { getAllDepartures, getAllDestinations, getAllPrice, getAllVehicles } from '@/services/tourServices';

const { TextArea } = Input;
const { Option } = Select;

interface EditTourProps {
  data?: any;
  isEdit?: boolean;
  onSubmit?: (values: any) => void;
}

const EditTour: React.FC<EditTourProps> = ({ data, isEdit = false, onSubmit }) => {
  const [form] = Form.useForm();
  const [departureList, setDepartureList] = useState<ILocation[]>([]);
  const [destinationList, setDestinationList] = useState<ILocation[]>([]);
  const [vehicleList, setVehicleList] = useState<IVehicle[]>([]);
  const [tourPriceList, setTourPriceList] = useState<ITourPrice[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);

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

  // Khi data thay đổi, set giá trị cho form
  useEffect(() => {
    if (isEdit && data) {
      const initialFiles = data.imageIds?.map((url: string, index: number) => ({
        uid: `-${index}`,
        name: `image-${index}`,
        status: 'done',
        url,
      }));

      form.setFieldsValue({
        tourProgram: data.tourProgram,
        tourTitle: data.tourTitle,
        description: data.description,
        duration: data.duration,
        basePrice: data.basePrice,
        departureLocationId: data.departureCity?.id,
        destinationLocationId: data.destinationCity?.id,
        vehicleId: data.vehicle?.id,
        tourPriceId: data.tourPrice?.id,
        files: initialFiles,
      });
      setDeletedImageUrls([]); 
    } else {
      form.resetFields();
      setDeletedImageUrls([]);
    }
  }, [data, isEdit, form]);

  const handleRemove = (file: any) => {
    // Nếu file có url (là ảnh cũ từ server), thêm vào danh sách xóa
    if (file.url) {
      setDeletedImageUrls(prev => [...prev, file.url]);
    }
    return true; // Cho phép xóa
  };

  const handleFinish = async (values: any) => {
    if (onSubmit) {
      await onSubmit({
        ...values,
        deletedImageUrls
      });
    }
  };


  return (
    <Card
      title={"Chỉnh sửa Tour"}
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
          label="Tên chương trình"
          name="tourProgram"
          rules={[{ required: true, message: 'Vui lòng nhập tên tour!' }]}
        >
          <Input placeholder="VD: Hành trình miền Trung di sản" />
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
            rules={[{ required: true, message: 'Chọn phương tiện!' }]}
          >
            <Select placeholder="Chọn phương tiện">
              {vehicleList.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            label="Thời lượng (ngày)" 
            name="duration" 
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập thời lượng tour!' }]}
          >
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item 
            label="Giá cơ bản (VNĐ)" 
            name="basePrice" 
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập giá cơ bản!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(val) => val?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>
        </Space>

        <Form.Item
          label="Hình ảnh tour"
          name="files"
          valuePropName="fileList"
          getValueFromEvent={(e) => e.fileList}
        >
          <Upload listType="picture" beforeUpload={() => false} multiple onRemove={handleRemove}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
            Cập nhật Tour
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditTour;