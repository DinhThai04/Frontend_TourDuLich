import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, Space, message, Modal, Image, Tag } from 'antd'; // Thêm Image, Tag
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { EditOutlined, PlusOutlined, SearchOutlined, FileImageOutlined } from '@ant-design/icons';
import EditLocation from './ModelLocation/Editlocation';
import AddLocation from './ModelLocation/AddLocation';
import type { AddLocationRequest, ILocation } from '@/types/Tour';
import { addLocation, getAllLocation, updateLocation } from '@/services/tourServices';

const ManagerLocation: React.FC = () => {
  const [data, setData] = useState<ILocation[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingDest, setEditingDest] = useState<ILocation | null>(null);

  const fetchDataLocation = useCallback(async () => {
    try {
      const res = await getAllLocation();
      if (res.code === 1000) {
        setData(res.result);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  }, []);

  useEffect(() => {
    fetchDataLocation();
  }, [fetchDataLocation]);

  // Filter dữ liệu
  const filteredData = data.filter((d) => d.city.toLowerCase().includes(searchCity.toLowerCase()));

  // --- XỬ LÝ THÊM MỚI (Dùng FormData) ---
  const handleAdd = async (values: any) => {
    const newLocation: AddLocationRequest = {
      city: values.name,
      type: values.type,
      img: values.img[0].originFileObj,
    };

    const res = await addLocation(newLocation);

    if (res.code === 1000) {
      setData([res.result, ...data]);

      message.success('Thêm điểm đến thành công');

      setOpenAdd(false);
    } else {
      message.error('Thêm điểm đến thất bại: ');
    }

    setOpenAdd(false);
  };

  // --- XỬ LÝ CẬP NHẬT (Dùng FormData) ---
  const handleEdit = async (values: any) => {
    if (!editingDest) return;

    const updateData = {
      ...values,
      img: values?.img[0]?.originFileObj || '',
      id: editingDest.id,
    };

    console.log('Data to update:', updateData);
    try {
      const res = await updateLocation(updateData);
      if (res.code === 1000) {
        setData((prev) =>
          prev.map((tour) => (tour.id === editingDest.id ? { ...tour, ...res.result } : tour))
        );

        console.log('API Response:', res);
        message.success('Cập nhật điểm đến thành công');

        setOpenEdit(false);

        setEditingDest(null);
      }
    } catch (error) {
      message.error('Cập nhật điểm đến thất bại');
    }
  };

  const columns: ProColumns<ILocation>[] = [
    { title: 'Tên thành phố', dataIndex: 'city' },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (_, record) => (
        <Tag color={record.type === 'BEACH' ? 'blue' : 'green'}>{record.type}</Tag>
      ),
    },
    // --- CỘT ẢNH MỚI ---
    {
      title: 'Hình ảnh',
      dataIndex: 'img',
      key: 'img',
      search: false, // Không search theo ảnh
      render: (_, record) =>
        record.img ? (
          <Image
            width={80}
            height={50}
            src={record.img}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            placeholder={<Image preview={false} src={record.img} width={80} />}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 50,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              color: '#ccc',
            }}
          >
            <FileImageOutlined />
          </div>
        ),
    },
    // ------------------
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <EditOutlined
            style={{ color: '#1890ff', fontSize: 18, cursor: 'pointer' }}
            onClick={() => {
              setEditingDest(record);
              setOpenEdit(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Search */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <Input
          placeholder="Tìm theo thành phố"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          style={{ width: 200 }}
        />
        <Button icon={<SearchOutlined />} type="primary">
          Tìm kiếm
        </Button>
      </div>

      {/* Table */}
      <ProTable<ILocation>
        columns={columns}
        rowKey="id"
        dataSource={filteredData}
        search={false}
        headerTitle="Danh sách điểm đến"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>
            Thêm mới
          </Button>,
        ]}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} mục`,
        }}
      />

      {/* Modal Add */}
      <Modal
        title="Thêm điểm đến"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <AddLocation onSubmit={handleAdd} />
      </Modal>

      {/* Modal Edit */}
      <Modal
        title="Chỉnh sửa điểm đến"
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        footer={null}
        destroyOnClose
        centered
      >
        {/* Truyền record hiện tại vào để hiển thị ảnh cũ trong form edit nếu cần */}
        <EditLocation data={editingDest || {}} onSubmit={handleEdit} />
      </Modal>
    </div>
  );
};

export default ManagerLocation;
