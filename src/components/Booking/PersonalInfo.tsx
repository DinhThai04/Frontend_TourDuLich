import { Form, Input, Select, DatePicker } from "antd";
import { useEffect } from "react";
import { sessionService } from "@/services/sessionServices";
import dayjs from "dayjs";

export default function PersonalInfo({ onFormReady }: { onFormReady?: (form: any) => void; }) {
  const [form] = Form.useForm();

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

      <Form form={form} layout="vertical" name="personalInfo" autoComplete="off">

        {/* HỌ TÊN */}
        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
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

                const age = dayjs().diff(value, "year");
                if (age < 18) {
                  return Promise.reject("Bạn phải từ 18 tuổi trở lên");
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
            { type: "email", message: "Email không hợp lệ!" },
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
            { pattern: /^\d{10}$/, message: "SĐT phải đủ 10 chữ số" },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        {/* ĐỊA CHỈ */}
        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
        >
          <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
        </Form.Item>

      </Form>
    </div>
  );
}
