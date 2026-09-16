import React, { useState } from "react";

type Customer = {
  id: number;
  name: string;
  dob: string;
  address: string;
  gender: string;
  customerType: string;
  ageType: string;
};

const BookingForm: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      name: "",
      dob: "",
      address: "",
      gender: "Nữ",
      customerType: "Việt Nam / Việt kiều",
      ageType: "Giá Người Lớn",
    },
  ]);

  const addCustomer = () => {
    setCustomers([
      ...customers,
      {
        id: customers.length + 1,
        name: "",
        dob: "",
        address: "",
        gender: "Nữ",
        customerType: "Việt Nam / Việt kiều",
        ageType: "Giá Người Lớn",
      },
    ]);
  };

  const handleChange = (
    id: number,
    field: keyof Customer,
    value: string
  ) => {
    setCustomers(
      customers.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  return (
    // <div className="max-w-6xl mx-auto px-6 bg-white rounded-2xl shadow-lg">
    <div className="bg-gray-900">
      <h1 className="text-xl font-bold mb-6">
        Hồ Chí Minh - Ninh Chữ - Vịnh Vĩnh Hy - Cam Ranh (3N2Đ)
      </h1>

      {/* Thông tin đặt tour */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input className="border p-2 rounded" placeholder="Họ tên" />
        <input className="border p-2 rounded" placeholder="Địa chỉ" />
        <input className="border p-2 rounded" placeholder="Số điện thoại" />
        <input className="border p-2 rounded" placeholder="Email" />
      </div>
      <textarea
        className="w-full border p-2 rounded mb-6"
        placeholder="Ghi chú"
      />

      {/* Chọn ngày khởi hành */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Chọn ngày khởi hành</label>
        <input type="date" className="border p-2 rounded" />
      </div>

      {/* Danh sách khách */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">STT</th>
              <th className="border p-2">Họ tên</th>
              <th className="border p-2">Ngày sinh</th>
              <th className="border p-2">Địa chỉ</th>
              <th className="border p-2">Giới tính</th>
              <th className="border p-2">Loại khách</th>
              <th className="border p-2">Độ tuổi</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="border p-2 text-center">{c.id}</td>
                <td className="border p-2">
                  <input
                    className="w-full border p-1 rounded"
                    value={c.name}
                    onChange={(e) =>
                      handleChange(c.id, "name", e.target.value)
                    }
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="date"
                    className="w-full border p-1 rounded"
                    value={c.dob}
                    onChange={(e) =>
                      handleChange(c.id, "dob", e.target.value)
                    }
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-full border p-1 rounded"
                    value={c.address}
                    onChange={(e) =>
                      handleChange(c.id, "address", e.target.value)
                    }
                  />
                </td>
                <td className="border p-2">
                  <select
                    className="border p-1 rounded"
                    value={c.gender}
                    onChange={(e) =>
                      handleChange(c.id, "gender", e.target.value)
                    }
                  >
                    <option>Nam</option>
                    <option>Nữ</option>
                  </select>
                </td>
                <td className="border p-2">
                  <select
                    className="border p-1 rounded"
                    value={c.customerType}
                    onChange={(e) =>
                      handleChange(c.id, "customerType", e.target.value)
                    }
                  >
                    <option>Việt Nam / Việt kiều</option>
                    <option>Nước ngoài</option>
                  </select>
                </td>
                <td className="border p-2">
                  <select
                    className="border p-1 rounded"
                    value={c.ageType}
                    onChange={(e) =>
                      handleChange(c.id, "ageType", e.target.value)
                    }
                  >
                    <option>Giá Người Lớn</option>
                    <option>Trẻ Em</option>
                    <option>Em Bé</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nút thêm khách */}
      <div className="mt-4">
        <button
          onClick={addCustomer}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Thêm
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
