import type { LocationFormValues } from '@/types/adminForms';
import React, { useState } from 'react';
import { Button, Input, Space, message, Modal, Image, Tag, Alert } from 'antd'; // Thêm Image, Tag
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { EditOutlined, PlusOutlined, FileImageOutlined } from '@ant-design/icons';
import EditLocation from './ModelLocation/Editlocation';
import AddLocation from './ModelLocation/AddLocation';
import type { AddLocationRequest, ILocation } from '@/types/Tour';
import { addLocation, getAllLocation, updateLocation } from '@/services/tourServices';
import { isApiSuccess } from '@/utils/apiResult';
import { errorMessage } from '@/utils/errors';
import { useApiQuery } from '@/hooks';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

const ManagerLocation: React.FC = () => {
  const canCreate = useHasPermission(P.LOCATIONS.CREATE);
  const canUpdate = useHasPermission(P.LOCATIONS.UPDATE);
  const { data = [], loading, error: loadError, refresh } = useApiQuery(async () => {
    const res = await getAllLocation();
    if (!isApiSuccess(res)) throw new Error(res?.message || 'Không tải được danh sách điểm đến');
    return res.result;
  });
  const [searchCity, setSearchCity] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingDest, setEditingDest] = useState<ILocation | null>(null);

  // Filter dữ liệu
  const filteredData = data.filter((d) => d.city.toLowerCase().includes(searchCity.toLowerCase()));

  // --- XỬ LÝ THÊM MỚI (Dùng FormData) ---
  const handleAdd = async (values: LocationFormValues) => {
    const image = values.img?.[0]?.originFileObj;
    if (!image) { message.error('Vui lòng chọn ảnh địa điểm'); return; }
    const newLocation: AddLocationRequest = {
      city: values.name ?? '',
      type: values.type,
      img: image,
    };

    const res = await addLocation(newLocation).catch((err: unknown) => {
      message.error(errorMessage(err, 'Thêm điểm đến thất bại'));
      return null;
    });
    if (!res) return;

    if (res.code === 1000) {
      await refresh();

      message.success('Thêm điểm đến thành công');

      setOpenAdd(false);
    } else {
      message.error(res.message || 'Thêm điểm đến thất bại');
    }
  };

  // --- XỬ LÝ CẬP NHẬT (Dùng FormData) ---
  const handleEdit = async (values: LocationFormValues) => {
    if (!editingDest) return;

    const updateData = {
      ...values,
      img: values.img?.[0]?.originFileObj,
      id: editingDest.id,
    };

    try {
      const res = await updateLocation(updateData);
      if (res.code === 1000) {
        await refresh();

        message.success('Cập nhật điểm đến thành công');

        setOpenEdit(false);

        setEditingDest(null);
      } else {
        message.error(res.message || 'Cập nhật điểm đến thất bại');
      }
    } catch (err) {
      message.error(errorMessage(err, 'Cập nhật điểm đến thất bại'));
    }
  };

  const columns: ProColumns<ILocation>[] = [
    { title: 'Tên thành phố', dataIndex: 'city' },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (_, record) => (
        <Tag color={record.type === 'DESTINATION' ? 'blue' : 'green'}>{record.type}</Tag>
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
      hideInTable: !canUpdate,
      render: (_, record) => (
        <Space>
          {canUpdate && (
            <Button
              type="text"
              aria-label="Sửa địa điểm"
              icon={<EditOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
              onClick={() => {
                setEditingDest(record);
                setOpenEdit(true);
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {loadError && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loadError} />
      )}
      {/* Search */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <Input
          placeholder="Tìm theo thành phố"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          style={{ width: 240 }}
        />
      </div>

      {/* Table */}
      <ProTable<ILocation>
        columns={columns}
        rowKey="id"
        dataSource={filteredData}
        loading={loading}
        search={false}
        headerTitle="Danh sách điểm đến"
        toolBarRender={() => canCreate ? [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>
            Thêm mới
          </Button>,
        ] : []}
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
        destroyOnHidden
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
        destroyOnHidden
        centered
      >
        {/* Truyền record hiện tại vào để hiển thị ảnh cũ trong form edit nếu cần */}
        <EditLocation data={editingDest} onSubmit={handleEdit} />
      </Modal>
    </div>
  );
};

export default ManagerLocation;
