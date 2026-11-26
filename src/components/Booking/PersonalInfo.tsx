import { contactEmail, personName, streetAddress, vietnamesePhone } from '@/utils/contactValidation';
import type { FormInstance } from 'antd';
import type { PersonalFormValues } from '@/types/Booking';
import { Form, Input, Select, DatePicker } from "antd";
import { useContext, useEffect } from "react";
import { sessionService } from "@/services/sessionServices";
import { BookingDraftContext } from "@/layouts/BookingDraftContext";
import { ageOnVietnamDate } from '@/utils/booking';

export default function PersonalInfo({ onFormReady, disabled = false }: { onFormReady?: (form: FormInstance<PersonalFormValues>) => void; disabled?: boolean; }) {
  const [form] = Form.useForm<PersonalFormValues>();
  const { markDirty } = useContext(BookingDraftContext);

  // expose form to parent
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  // load user info into form
  useEffect(() => {
    const user = sessionService.getUser();
    if (user) {
      form.setFieldsValue({
        fullName: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [form]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Thông tin cá nhân</h2>

      <Form form={form} layout="vertical" name="personalInfo" autoComplete="off" disabled={disabled} onValuesChange={markDirty}>

        {/* HỌ TÊN */}
        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập họ tên!" }, { pattern: personName, min: 2, max: 100, message: "Nhập họ tên từ 2 đến 100 ký tự chữ" }]}
        >
          <Input placeholder="Nhập họ tên" />
        </Form.Item>

        {/* NGÀY SINH */}
        <Form.Item
          label="Ngày sinh"
          name="birthDate"
          rules={[
            { required: true, message: "Chọn ngày sinh" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();

                const age = ageOnVietnamDate(value);
                if (age === null || age < 18) {
                  return Promise.reject("Bạn phải từ 18 tuổi trở lên theo ngày Việt Nam");
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Chọn ngày sinh"
          />
        </Form.Item>

        {/* GIỚI TÍNH */}
        <Form.Item
          label="Giới tính"
          name="gender"
          rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
        >
          <Select placeholder="Chọn giới tính">
            <Select.Option value="male">Nam</Select.Option>
            <Select.Option value="female">Nữ</Select.Option>
          </Select>
        </Form.Item>

        {/* EMAIL */}
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", pattern: contactEmail, max: 254, message: "Email không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập email" />
        </Form.Item>

        {/* SĐT */}
        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại!" },
            { pattern: vietnamesePhone, message: "SĐT bắt đầu bằng 0 và gồm 10–11 chữ số" },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        {/* ĐỊA CHỈ */}
        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }, { pattern: streetAddress, max: 255, message: "Địa chỉ chứa ký tự không hợp lệ" }]}
        >
          <Input placeholder="Nhập số nhà, đường và khu vực" />
        </Form.Item>

      </Form>
    </div>
  );
}
