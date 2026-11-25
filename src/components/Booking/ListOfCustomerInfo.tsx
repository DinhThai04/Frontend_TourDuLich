import type { FormInstance } from 'antd';
import type { CustomersFormValues, PassengerFormValues } from '@/types/Booking';
import { useContext, useRef, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Row, Col, Button, Divider, Typography } from 'antd';
import { ageOnVietnamDate, passengerLabel, passengerTypeFor } from '@/utils/booking';
import { BookingDraftContext } from '@/layouts/BookingDraftContext';

const { Title } = Typography;
const { Option } = Select;

export default function ListOfCustomerInfo({
  onFormReady,
  // personalFormGetter,
  onCustomersChange,
  maxPassengers,
  pricingDate,
  initialCustomers,
}: {
  onFormReady?: (form: FormInstance<CustomersFormValues>) => void;
  /** optional getter function provided by parent to read personal info form values */
  personalFormGetter?: (form: FormInstance<CustomersFormValues>) => unknown;
  /** notify parent when customers change */
  onCustomersChange?: (customers: PassengerFormValues[]) => void;
  /** Số hành khách bổ sung tối đa theo số chỗ còn lại của chuyến đi. */
  maxPassengers?: number;
  pricingDate: Date;
  initialCustomers?: PassengerFormValues[];
}) {
  const [form] = Form.useForm<CustomersFormValues>();
  const { markDirty } = useContext(BookingDraftContext);

  useEffect(() => { onFormReady?.(form); }, [form, onFormReady]);
  const idCounter = useRef(Math.max(0, ...(initialCustomers ?? []).map(customer => customer.id ?? 0)));
  const customersWatch = Form.useWatch('customers', form) as PassengerFormValues[] | undefined;
  const customerCount = customersWatch?.length ?? 0;
  const capacityReached = maxPassengers != null && customerCount >= maxPassengers;

  const addCustomer = (type: 'ADULT' | 'CHILD' | 'TODDLER' | 'INFANT') => {
    const customers = form.getFieldsValue().customers || [];
    if (maxPassengers != null && customers.length >= maxPassengers) return;

    markDirty();
    idCounter.current += 1;
    const newItem = {
      id: idCounter.current,
      type,
      fullName: '',
      gender: undefined,
      birthDate: null,
      address: '',
    };
    const next = [...customers, newItem];
    form.setFieldsValue({ customers: next });
    onCustomersChange?.(next);
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        name="list_of_customers"
        initialValues={{ customers: initialCustomers }}
        onValuesChange={() => {
          markDirty();
          if (onCustomersChange) onCustomersChange(form.getFieldsValue().customers || []);
        }}
      >
        <Title level={4}>Hành khách bổ sung</Title>
        <p className="text-xs text-gray-500">Nhóm khách và giá được tính theo ngày sinh.</p>
        {maxPassengers != null && (
          <p className="text-xs text-gray-500" style={{ marginTop: -8 }}>
            Chuyến đi còn tối đa {maxPassengers} hành khách bổ sung (đã thêm {customerCount}).
          </p>
        )}

        {/* Add buttons */}
        <Row gutter={[16, 12]} className="mb-6 passenger-actions">
          <Col xs={24} sm={12} xl={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Người lớn</p>
                <p className="text-xs text-gray-500">Từ 12 tuổi trở lên</p>
              </div>
              <Button type="primary" className="bg-[#21776D]!" disabled={capacityReached} onClick={() => addCustomer('ADULT')}>
                + Thêm
              </Button>
            </div>
          </Col>
          <Col xs={24} sm={12} xl={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Trẻ em</p>
                <p className="text-xs text-gray-500">Từ 5 - 11 tuổi</p>
              </div>
              <Button type="primary" className="bg-[#21776D]!" disabled={capacityReached} onClick={() => addCustomer('CHILD')}>
                + Thêm
              </Button>
            </div>
          </Col>
          <Col xs={24} sm={12} xl={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Trẻ nhỏ</p>
                <p className="text-xs text-gray-500">Từ 2 - 4 tuổi</p>
              </div>
              <Button
                type="primary"
                className="bg-[#21776D]!"
                disabled={capacityReached}
                onClick={() => addCustomer('TODDLER')}
              >
                + Thêm
              </Button>
            </div>
          </Col>
          <Col xs={24} sm={12} xl={8}>
            <div className="flex justify-between items-center rounded p-2">
              <div>
                <p className="font-medium">Em bé</p>
                <p className="text-xs text-gray-500">Dưới 2 tuổi</p>
              </div>
              <Button
                type="primary"
                className="bg-[#21776D]!"
                disabled={capacityReached}
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
                  className="journey-passenger"
                  style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}
                >
                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={20}>
                      <p className="font-bold mb-2">
                        {index + 1}. {passengerLabel(passengerTypeFor(
                          customersWatch?.[name]?.birthDate, pricingDate, customersWatch?.[name]?.type))}
                      </p>
                    </Col>
                    <Col xs={24} sm={4} className="text-right">
                      <Button
                        type="link"
                        danger
                        onClick={() => {
                          // Form.List.remove does not fire onValuesChange, so notify the parent explicitly.
                          markDirty();
                          const remaining = (form.getFieldsValue().customers || []).filter(
                            (_, position) => position !== name,
                          );
                          remove(name);
                          onCustomersChange?.(remaining);
                        }}
                      >
                        Xóa
                      </Button>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'fullName']}
                        label="Họ tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                      >
                        <Input placeholder="Nhập họ tên" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
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

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'birthDate']}
                        label="Ngày sinh"
                        rules={[
                          { required: true, message: 'Chọn ngày sinh' },
                          {
                            validator: (_, value) => {
                              if (!value) return Promise.resolve();

                              const age = ageOnVietnamDate(value);
                              if (age === null) return Promise.reject('Ngày sinh không hợp lệ');

                              // Không cho phép ngày sinh trong tương lai
                              if (age < 0) {
                                return Promise.reject('Ngày sinh không được lớn hơn ngày hiện tại');
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'address']}
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                      >
                        <Input placeholder="Nhập địa chỉ" />
                      </Form.Item>
                    </Col>

                    {passengerTypeFor(customersWatch?.[name]?.birthDate, pricingDate, customersWatch?.[name]?.type) === 'ADULT' ? (
                      <>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'phone']}
                            label="Số điện thoại"
                            rules={[
                              { required: true, message: 'Vui lòng nhập số điện thoại' },
                              { pattern: /^\d{9,11}$/, message: 'SĐT phải gồm 9–11 chữ số' },
                            ]}
                          >
                            <Input placeholder="Nhập số điện thoại liên hệ" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'email']}
                            label="Email (nếu có)"
                            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                          >
                            <Input placeholder="Nhập email (không bắt buộc)" />
                          </Form.Item>
                        </Col>
                      </>
                    ) : (
                      <>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'guardianName']}
                            label="Người giám hộ đi kèm"
                            rules={[{ required: true, message: 'Trẻ dưới 18 tuổi cần họ tên người giám hộ' }]}
                          >
                            <Input placeholder="Họ tên bố/mẹ hoặc người giám hộ" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'guardianPhone']}
                            label="SĐT người giám hộ"
                            rules={[
                              { required: true, message: 'Vui lòng nhập SĐT người giám hộ' },
                              { pattern: /^\d{9,11}$/, message: 'SĐT giám hộ gồm 9–11 chữ số' },
                            ]}
                          >
                            <Input placeholder="Nhập số điện thoại người giám hộ" />
                          </Form.Item>
                        </Col>
                      </>
                    )}

                    {/* Hidden type field so type persists */}
                    <Form.Item {...restField} name={[name, 'type']} hidden>
                      <Input />
                    </Form.Item>
                  </Row>
                </div>
              ))}
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
}
