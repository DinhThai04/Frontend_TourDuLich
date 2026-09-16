import { useRef } from 'react';
import { Form, Input, DatePicker, Select, Row, Col, Button, Divider, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export default function ListOfCustomerInfo({
  onFormReady,
  // personalFormGetter,
  onCustomersChange,
}: {
  onFormReady?: (form: any) => void;
  /** optional getter function provided by parent to read personal info form values */
  personalFormGetter?: (form: any) => any;
  /** notify parent when customers change */
  onCustomersChange?: (customers: any[]) => void;
}) {
  const [form] = Form.useForm();

  if (onFormReady) onFormReady(form);
  const idCounter = useRef(1);

  const addCustomer = (type: 'ADULT' | 'CHILD' | 'TODDLER' | 'INFANT') => {
    const customers = form.getFieldValue('customers') || [];

    idCounter.current += 1;
    const newItem = {
      id: idCounter.current,
      type,
      fullName: '',
      gender: undefined,
      birthDate: null,
      address: '',
    };
    form.setFieldsValue({ customers: [...customers, newItem] });
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        name="list_of_customers"
        onValuesChange={() => {
          if (onCustomersChange) onCustomersChange(form.getFieldValue('customers') || []);
        }}
      >
        <Title level={4}>Hành khách</Title>

        {/* Add buttons */}
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Người lớn</p>
                <p className="text-xs text-gray-500">Từ 12 tuổi trở lên</p>
              </div>
              <Button type="primary" className="bg-[#7BBCB0]!" onClick={() => addCustomer('ADULT')}>
                + Thêm
              </Button>
            </div>
          </Col>
          <Col span={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Trẻ em</p>
                <p className="text-xs text-gray-500">Từ 5 - 11 tuổi</p>
              </div>
              <Button type="primary" className="bg-[#7BBCB0]!" onClick={() => addCustomer('CHILD')}>
                + Thêm
              </Button>
            </div>
          </Col>
          <Col span={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Trẻ nhỏ</p>
                <p className="text-xs text-gray-500">Từ 2 - 4 tuổi</p>
              </div>
              <Button
                type="primary"
                className="bg-[#7BBCB0]!"
                onClick={() => addCustomer('TODDLER')}
              >
                + Thêm
              </Button>
            </div>
          </Col>
          <Col span={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Em bé</p>
                <p className="text-xs text-gray-500">Dưới 2 tuổi</p>
              </div>
              <Button
                type="primary"
                className="bg-[#7BBCB0]!"
                onClick={() => addCustomer('INFANT')}
              >
                + Thêm
              </Button>
            </div>
          </Col>
        </Row>

        <Divider />

        <Title level={5}>Thông tin hành khách</Title>

        <Form.List name="customers">
          {(fields, { remove }) => (
            <>
              {fields.length === 0 && (
                <p style={{ color: '#888' }}>Chưa có hành khách nào được thêm.</p>
              )}

              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={20}>
                      <p className="font-bold mb-2">
                        {index + 1}.{' '}
                        <Form.Item {...restField} name={[name, 'type']} noStyle>
                          <>{/* will render type label via value */}</>
                        </Form.Item>
                        <span>
                          {form.getFieldValue(['customers', name, 'type']) === 'ADULT'
                            ? 'Người lớn'
                            : form.getFieldValue(['customers', name, 'type']) === 'CHILD'
                              ? 'Trẻ em'
                              : form.getFieldValue(['customers', name, 'type']) === 'TODDLER'
                                ? 'Trẻ nhỏ'
                                : 'Em bé'}
                        </span>
                      </p>
                    </Col>
                    <Col span={4} className="text-right">
                      <Button type="link" danger onClick={() => remove(name)}>
                        Xóa
                      </Button>
                    </Col>

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

                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'birthDate']}
                        label="Ngày sinh"
                        rules={[
                          { required: true, message: 'Chọn ngày sinh' },
                          {
                            validator: (_, value) => {
                              if (!value) return Promise.resolve();

                              const type = form.getFieldValue(['customers', name, 'type']);
                              const today = dayjs();
                              const age = today.diff(value, 'year');

                              // Không cho phép ngày sinh trong tương lai
                              if (value.isAfter(today)) {
                                return Promise.reject('Ngày sinh không được lớn hơn ngày hiện tại');
                              }

                              // Validate theo từng loại
                              switch (type) {
                                case 'ADULT':
                                  if (age < 12)
                                    return Promise.reject('Người lớn phải từ 12 tuổi trở lên');
                                  break;

                                case 'CHILD':
                                  if (age < 5 || age > 11)
                                    return Promise.reject('Trẻ em phải từ 5 đến 11 tuổi');
                                  break;

                                case 'TODDLER':
                                  if (age < 2 || age > 4)
                                    return Promise.reject('Trẻ nhỏ phải từ 2 đến 4 tuổi');
                                  break;

                                case 'INFANT':
                                  if (age >= 2) return Promise.reject('Em bé phải dưới 2 tuổi');
                                  break;

                                default:
                                  break;
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item {...restField} name={[name, 'address']} label="Địa chỉ">
                        <Input placeholder="Nhập địa chỉ" />
                      </Form.Item>
                    </Col>

                    {/* Hidden type field so type persists */}
                    <Form.Item {...restField} name={[name, 'type']} hidden initialValue="adult">
                      <Input />
                    </Form.Item>
                  </Row>
                </div>
              ))}
            </>
          )}
        </Form.List>

        {/* helper: if parent wants to ensure first customer exists, they can call this exposed method via ref */}

        <Divider />

        <Title level={5}>Ghi chú</Title>
        <Form.Item name="note">
          <Input.TextArea
            rows={3}
            placeholder="Vui lòng nhập nội dung lời nhắn bằng tiếng Việt hoặc tiếng Anh"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
