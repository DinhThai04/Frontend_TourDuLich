import type { ItineraryFormValues } from '@/types/adminForms';
import React, { useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

import { Button, Modal, Space, message, Tooltip, Input, Alert, Select } from 'antd';

import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { IItinerary, AddItineraryRequest } from '@/types/Tour';
import {
  addItinerary,
  deleteItinerary,
  getAllTours,
  getItineraryByTourId,
  updateItinerary,
} from '@/services/tourServices';
import { useLocation, useNavigate } from 'react-router-dom';
import AddItinerary from './ModelSchedule/AddSchedule';
import EditItinerary from './ModelSchedule/EditSchedule';
import { isApiSuccess } from '@/utils/apiResult';
import { isListCapped, TOUR_LIST_CAP } from '@/utils';
import { errorMessage } from '@/utils/errors';
import { useApiQuery } from '@/hooks';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

const ManagerItinerary: React.FC = () => {
  const canCreate = useHasPermission(P.ITINERARIES.CREATE);
  const canUpdate = useHasPermission(P.ITINERARIES.UPDATE);
  const canDelete = useHasPermission(P.ITINERARIES.DELETE);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const tourIdParam = params.get('tourId');
  const tourId = tourIdParam ? Number(tourIdParam) : null;
  const [searchTitle, setSearchTitle] = useState('');

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<IItinerary | null>(null);

  const { data = [], loading, error: loadError, refresh } = useApiQuery(
    async () => {
      const res = await getItineraryByTourId(tourId as number);
      if (!isApiSuccess(res)) throw new Error(res?.message || 'Không tải được lịch trình');
      return res.result;
    },
    { enabled: tourId != null, deps: [tourId] },
  );
  const { data: tours = [] } = useApiQuery(
    async () => {
      const res = await getAllTours();
      if (!isApiSuccess(res)) throw new Error(res?.message || 'Không tải được danh sách tour');
      return res.result;
    },
    { enabled: tourId == null, deps: [tourId], onError: (msg) => message.error(msg) },
  );

  const filteredData = data.filter((d) =>
    d.title.toLowerCase().includes(searchTitle.toLowerCase()),
  );

  const handleAdd = async (values: ItineraryFormValues) => {
    if (!tourId) {
      message.error('Không tìm thấy tour ID');
      return;
    }

    const newLocation: AddItineraryRequest = {
      title: values.title,
      description: values.description,
      meal: values.meal,
      tourId: tourId,
    };
    const res = await addItinerary(newLocation).catch((err: unknown) => {
      message.error(errorMessage(err, 'Thêm lịch trình thất bại'));
      return null;
    });
    if (!res) return;
    if (res.code === 1000) {
      await refresh();
      message.success('Thêm lịch trình thành công');
      setOpenAdd(false);
    } else {
      message.error(res.message || 'Thêm lịch trình thất bại');
    }
  };

  const handleEditClick = (record: IItinerary) => {
    setEditingItinerary(record);
    setOpenEdit(true);
  };

  const handleEdit = async (values: ItineraryFormValues) => {
    if (!editingItinerary) return;

    const updateData = {
      ...values,
      id: editingItinerary.id,
      tourId: editingItinerary.tourId,
    };

    const res = await updateItinerary(updateData).catch((err: unknown) => {
      message.error(errorMessage(err, 'Cập nhật lịch trình thất bại'));
      return null;
    });
    if (!res) return;

    if (res.code === 1000) {
      await refresh();
      message.success('Cập nhật lịch trình thành công');
      setOpenEdit(false);
      setEditingItinerary(null);
    } else {
      message.error(res.message || 'Cập nhật lịch trình thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa lịch trình này?',
        okText: 'Xóa',
        cancelText: 'Hủy',
        okType: 'danger',
        onOk: async () => {
          try {
            const res = await deleteItinerary(id);
            if (res.code !== 1000) throw new Error(res.message || 'Xóa lịch trình thất bại');
            await refresh();
            message.success('Xóa lịch trình thành công');
          } catch (err) {
            message.error(errorMessage(err, 'Xóa lịch trình thất bại'));
            throw err;
          }
        },
      });
    } catch {
      message.error('Có lỗi xảy ra khi xóa lịch trình');
    }
  };

  const columns: ProColumns<IItinerary>[] = [
    { title: 'Ngày', dataIndex: 'dayNumber', width: 80 },
    { title: 'Tiêu đề', dataIndex: 'title' },
    { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
    { title: 'Bữa ăn', dataIndex: 'meal' },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      hideInTable: !canUpdate && !canDelete,
      render: (_, record) => (
        <Space>
          {canUpdate && (
            <Button
              type="text"
              aria-label={`Sửa lịch trình ngày ${record.dayNumber}`}
              icon={<EditOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
              onClick={() => handleEditClick(record)}
            />
          )}
          {canDelete && (
            <Button
              type="text"
              aria-label={`Xóa lịch trình ngày ${record.dayNumber}`}
              icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />}
              onClick={() => handleDelete(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  // Tạo button thêm mới với điều kiện
  const renderAddButton = () => {
    if (!canCreate) return null;
    if (!tourId) {
      return (
        <Tooltip title="Vui lòng chọn tour trước khi thêm lịch trình">
          <Button key="create" type="primary" icon={<PlusOutlined />} disabled>
            Thêm mới
          </Button>
        </Tooltip>
      );
    }

    return (
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>
        Thêm mới
      </Button>
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tiêu đề lịch trình"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          style={{ width: 240 }}
        />
      </Space>
      {loadError && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loadError} />
      )}
      {tourId == null && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Chọn tour để quản lý lịch trình"
          action={
            <Select
              style={{ minWidth: 280 }}
              showSearch
              optionFilterProp="label"
              placeholder="Chọn tour"
              options={tours.map((tour) => ({ value: tour.id, label: tour.tourTitle }))}
              onChange={(id) => navigate(`/admin/managerTour/itinerary?tourId=${id}`)}
            />
          }
        />
      )}
      {isListCapped(tours, TOUR_LIST_CAP) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Danh sách chỉ tải ${TOUR_LIST_CAP} tour gần nhất nên tour cũ hơn không chọn được ở đây.`}
        />
      )}

      <ProTable<IItinerary>
        columns={columns}
        rowKey="id"
        dataSource={filteredData}
        loading={loading}
        search={false}
        headerTitle="Danh sách lịch trình tour"
        toolBarRender={() => [renderAddButton()]}
        pagination={{ pageSize: 5 }}
      />

      {/* Modal Add */}
      <Modal
        title="Thêm lịch trình"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        <AddItinerary onSubmit={handleAdd} />
      </Modal>

      {/* Modal Edit */}
      <Modal
        title="Chỉnh sửa lịch trình"
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        {editingItinerary && <EditItinerary data={editingItinerary} onSubmit={handleEdit} />}
      </Modal>
    </div>
  );
};

export default ManagerItinerary;
