import type { TourFormValues } from '@/types/adminForms';
import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Select, Upload, Space, Card, Tooltip, Alert, message } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import type { ILocation, ITourPrice, IVehicle, ITour } from '@/types/Tour';
import { imageFileError, imageBatchError } from '@/utils/tourMedia';
import { getAllDepartures, getAllDestinations, getAllPrice, getAllVehicles } from '@/services/tourServices';

const { TextArea } = Input;
const { Option } = Select;

interface AddTourProps {
  onSubmit?: (values: TourFormValues) => Promise<boolean> | boolean;
  pendingTour?: ITour | null;
  onSavingChange?: (saving: boolean) => void;
  onSkipImages?: () => void;
}

const AddNewTour: React.FC<AddTourProps> = ({ onSubmit, pendingTour, onSavingChange, onSkipImages }) => {
  const [form] = Form.useForm<TourFormValues>();
  const [saving, setSaving] = useState(false);
  const inFlight = React.useRef(false);
  const [departureList, setDepartureList] = useState<ILocation[]>([]);
  const [destinationList, setDestinationList] = useState<ILocation[]>([]);
  const [vehicleList, setVehicleList] = useState<IVehicle[]>([]);
  const [tourPriceList, setTourPriceList] = useState<ITourPrice[]>([]);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [loadingReference, setLoadingReference] = useState(false);

  /**
   * Four independent lookups: a failure in one must not blank the other selects, but it must be
   * visible — otherwise the operator sees empty dropdowns with no hint that data failed to load.
   */
  const loadReferenceData = useCallback(async () => {
    setLoadingReference(true);
    setReferenceError(null);
    const [destinations, departures, vehicles, prices] = await Promise.allSettled([
      getAllDestinations(),
      getAllDepartures(),
      getAllVehicles(),
      getAllPrice(),
    ]);
    const failed: string[] = [];
    if (destinations.status === 'fulfilled' && destinations.value.code === 1000) setDestinationList(destinations.value.result);
    else failed.push('điểm đến');
    if (departures.status === 'fulfilled' && departures.value.code === 1000) setDepartureList(departures.value.result);
    else failed.push('điểm khởi hành');
    if (vehicles.status === 'fulfilled' && vehicles.value.code === 1000) setVehicleList(vehicles.value.result);
    else failed.push('phương tiện');
    if (prices.status === 'fulfilled' && prices.value.code === 1000) setTourPriceList(prices.value.result);
    else failed.push('bảng giá');
    setReferenceError(failed.length ? `Chưa tải được ${failed.join(', ')}. Kiểm tra kết nối rồi thử lại.` : null);
    setLoadingReference(false);
  }, []);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  const handleFinish = async (values: TourFormValues) => {
    if (inFlight.current) return;
    const imageError = imageBatchError(values.files);
    if (imageError) { message.error(imageError); return; }
    if (pendingTour && !values.files?.length) { message.error('Chọn lại ảnh cần tải lên cho tour này'); return; }
    inFlight.current = true; setSaving(true); onSavingChange?.(true);
    try { if (onSubmit && await onSubmit(values)) form.resetFields(); }
    finally { inFlight.current = false; setSaving(false); onSavingChange?.(false); }
  };


  return (
    <Card
      title="Thêm Tour Mới"
      variant="borderless"
      style={{
        maxWidth: 800,
        margin: '0 auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 12,
      }}
    >
      {referenceError && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={referenceError}
        action={<Button size="small" onClick={() => void loadReferenceData()} loading={loadingReference}>Tải lại</Button>} />}
      {pendingTour && <Alert type="warning" showIcon style={{ marginBottom: 16 }}
        message={`Tour #${pendingTour.id} — ${pendingTour.tourTitle} đã được tạo`}
        description="Ảnh chưa hoàn tất. Giữ hoặc chọn lại ảnh bên dưới rồi thử tải lại; thao tác này không tạo tour mới." />}
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        disabled={saving}
      >
        <Form.Item
          label="Mã chương trình"
          name="tourProgram"
          rules={[{ required: true, message: 'Vui lòng nhập tên tour!' }]}
        >
          <Input disabled={!!pendingTour} />
        </Form.Item>

        <Form.Item
          label="Tiêu đề"
          name="tourTitle"
          rules={[{ required: true, message: 'Vui lòng nhập chương trình!' }]}
        >
          <Input placeholder="VD: Đà Nẵng - Hội An - Huế" disabled={!!pendingTour} />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả tour!' }]}
        >
          <TextArea rows={3} placeholder="Giới thiệu ngắn gọn về tour..." disabled={!!pendingTour} />
        </Form.Item>

        <Space size="large" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Điểm khởi hành */}
          <Form.Item
            label="Điểm khởi hành"
            name="departureLocationId"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Chọn điểm khởi hành!' }]}
          >
            <Select placeholder="Chọn điểm đi" disabled={!!pendingTour}>
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
            <Select placeholder="Chọn điểm đến" disabled={!!pendingTour}>
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
            <Select placeholder="Chọn combo giá" optionLabelProp="label" disabled={!!pendingTour}>
              {tourPriceList.map((item) => {
                const label = `Người lớn: ${item.adultPrice.toLocaleString()} | Trẻ em: ${item.childPrice.toLocaleString()} | Trẻ nhỏ: ${item.toddlerPrice.toLocaleString()} | Em bé: ${item.infantPrice.toLocaleString()} | Phụ thu: ${item.singleSupplementPrice.toLocaleString()}`;

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
            <Select placeholder="Chọn phương tiện" disabled={!!pendingTour}>
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
            rules={[{ required: true, message: 'Vui lòng nhập thời lượng tour!' }]}
          >
            <InputNumber min={1} max={30} precision={0} style={{ width: '100%' }} disabled={!!pendingTour} />
          </Form.Item>
        </Space>

        <Form.Item
          label="Hình ảnh tour"
          name="files"
          extra="Tối đa 10 ảnh/tour, 5 MB/ảnh. Định dạng JPEG, PNG hoặc WebP."
          valuePropName="fileList"
          getValueFromEvent={(e) => e.fileList}
        >
          <Upload listType="picture" accept="image/jpeg,image/png,image/webp" maxCount={10} disabled={saving}
            beforeUpload={file => { const error = imageFileError(file); if (error) { message.error(error); return Upload.LIST_IGNORE; } return false; }} multiple>
            <Button disabled={saving} icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>


        <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" icon={<SaveOutlined />} disabled={saving} loading={saving} htmlType={pendingTour ? 'button' : 'submit'}
            onClick={pendingTour ? () => void handleFinish(form.getFieldsValue()) : undefined}>
            {pendingTour ? 'Thử tải lại ảnh' : 'Lưu tour và ảnh'}
          </Button>
          {pendingTour && <Button disabled={saving} onClick={onSkipImages} style={{ marginLeft: 8 }}>Để bổ sung ảnh sau</Button>}
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddNewTour;
