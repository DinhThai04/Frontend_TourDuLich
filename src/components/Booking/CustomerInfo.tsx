import { useEffect } from 'react';
import { Form, Input, Select, Row, Col, Button, Divider, Typography } from 'antd';
import type { FormInstance } from 'antd';
import type { CustomerResponse as CustomerProp } from '@/types/Booking';

const { Title } = Typography;
const { Option } = Select;

type CustomerType = CustomerProp & {
  type: 'adult' | 'child' | 'toddler' | 'infant';
};

export default function CustomerInfo({
  onFormReady,
  onFormSubmit,
}: {
  onFormReady?: (form: FormInstance) => void;
  onFormSubmit?: (data: any) => void;
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  return (
    <>
      {/* <Button
        type="dashed"
        onClick={() => {
          const values = form.getFieldsValue(true);
          console.log("Dữ liệu hiện tại trong form:", values);
        }}
        style={{ marginBottom: 16 }}
      >
        In dữ liệu form (Click)
      </Button> */}

      <Form
        layout="vertical"
        form={form}
        onFinish={(values) => {
          onFormSubmit?.(values);
        }}
      >
        <Title level={4}>Hành khách</Title>

        {/* --- Khu vực chọn loại khách --- */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <div className="rounded p-2">
              <p className="font-medium">Người lớn</p>
              <p className="text-sm text-gray-500">Từ 16 tuổi trở lên</p>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue, setFieldsValue }) => (
                  <Button
                    type="primary"
                    className="bg-[#7BBCB0]!"
                    block
                    onClick={() => {
                      const customers = getFieldValue('customers') || [];
                      setFieldsValue({
                        customers: [...customers, { type: 'adult' } as CustomerType],
                      });
                    }}
                  >
                    + Thêm
                  </Button>
                )}
              </Form.Item>
            </div>
          </Col>

          <Col span={6}>
            <div className="rounded p-2">
              <p className="font-medium">Trẻ em</p>
              <p className="text-sm text-gray-500">Từ 5 - 15 tuổi</p>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue, setFieldsValue }) => (
                  <Button
                    type="primary"
                    className="bg-[#7BBCB0]!"
                    block
                    onClick={() => {
                      const customers = getFieldValue('customers') || [];
                      setFieldsValue({
                        customers: [...customers, { type: 'child' } as CustomerType],
                      });
                    }}
                  >
                    + Thêm
                  </Button>
                )}
              </Form.Item>
            </div>
          </Col>

          <Col span={6}>
            <div className="rounded p-2">
              <p className="font-medium">Trẻ nhỏ</p>
              <p className="text-sm text-gray-500">Từ 2 - 4 tuổi</p>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue, setFieldsValue }) => (
                  <Button
                    type="primary"
                    className="bg-[#7BBCB0]!"
                    block
                    onClick={() => {
                      const customers = getFieldValue('customers') || [];
                      setFieldsValue({
                        customers: [...customers, { type: 'toddler' } as CustomerType],
                      });
                    }}
                  >
                    + Thêm
                  </Button>
                )}
              </Form.Item>
            </div>
          </Col>

          <Col span={6}>
            <div className="rounded p-2">
              <p className="font-medium">Em bé</p>
              <p className="text-sm text-gray-500">Dưới 2 tuổi</p>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue, setFieldsValue }) => (
                  <Button
                    type="primary"
                    className="bg-[#7BBCB0]!"
                    block
                    onClick={() => {
                      const customers = getFieldValue('customers') || [];
                      setFieldsValue({
                        customers: [...customers, { type: 'infant' } as CustomerType],
                      });
                    }}
                  >
                    + Thêm
                  </Button>
                )}
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Divider />

        <Title level={5}>Thông tin hành khách</Title>

        {/* --- Danh sách hành khách (Form.List) --- */}
        <Form.List name="customers">
          {(fields, { remove }) => (
            <>
              {fields.length === 0 && (
                <p style={{ color: '#888' }}>Chưa có hành khách nào được thêm.</p>
              )}

              {fields.map(({ key, name, ...restField }, index) => {
                const type = form.getFieldValue(['customers', name, 'type']);

                return (
                  <div
                    key={key}
                    style={{
                      marginBottom: 24,
                      borderBottom: '1px solid #eee',
                      paddingBottom: 16,
                    }}
                  >
                    <Row gutter={16} align="middle">
                      <Col span={20}>
                        <p className="font-bold mb-2">
                          {index + 1}.{' '}
                          {type === 'adult'
                            ? 'Người lớn'
                            : type === 'child'
                              ? 'Trẻ em'
                              : type === 'toddler'
                                ? 'Trẻ nhỏ'
                                : 'Em bé'}
                        </p>
                      </Col>
                      <Col span={4} className="text-right">
                        <Button type="link" danger onClick={() => remove(name)}>
                          Xóa
                        </Button>
                      </Col>

                      {/* Họ tên */}
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'fullName']}
                          label="Họ tên"
                          rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                          <Input placeholder="Nhập họ tên" />
                        </Form.Item>
                      </Col>

                      {/* Giới tính */}
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'gender']}
                          label="Giới tính"
                          rules={[{ required: true, message: 'Chọn giới tính' }]}
                        >
                          <Select placeholder="Chọn giới tính">
                            <Option value="male">Nam</Option>
                            <Option value="female">Nữ</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      {/* Ngày sinh */}
                      {/* <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "birthDate"]}
                          label="Ngày sinh"
                          rules={[
                            { required: true, message: "Chọn ngày sinh" },
                          ]}
                        >
                          <DatePicker
                            format="DD/MM/YYYY"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col> */}

                      {/* Địa chỉ */}
                      {/* <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "address"]}
                          label="Địa chỉ"
                          rules={[
                            { required: true, message: "Nhập địa chỉ" },
                          ]}
                        >
                          <Input placeholder="Nhập địa chỉ" />
                        </Form.Item>
                      </Col> */}

                      {/* Loại khách (ẩn) */}
                      <Form.Item {...restField} name={[name, 'type']} hidden initialValue={type}>
                        <Input />
                      </Form.Item>
                    </Row>
                  </div>
                );
              })}
            </>
          )}
        </Form.List>

        <Divider />

        <Title level={5}>Ghi chú</Title>
        <Form.Item name="note">
          <Input.TextArea
            rows={3}
            placeholder="Vui lòng nhập lời nhắn (tiếng Việt hoặc tiếng Anh)"
          />
        </Form.Item>
      </Form>
    </>
  );
}
