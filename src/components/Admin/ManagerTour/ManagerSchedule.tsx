import React, { useCallback, useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

import { Button, Modal, Space, message, Tooltip, Input } from 'antd';

import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { IItinerary, AddItineraryRequest } from '@/types/Tour';
import {
  addItinerary,
  deleteItinerary,
  getItineraryByTourId,
  updateItinerary,
} from '@/services/tourServices';
import { useLocation } from 'react-router-dom';
import AddItinerary from './ModelSchedule/AddSchedule';
import EditItinerary from './ModelSchedule/EditSchedule';

const ManagerItinerary: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tourIdParam = params.get('tourId');
  const tourId = tourIdParam ? Number(tourIdParam) : null;
  const [data, setData] = useState<IItinerary[]>([]);
  const [searchTour, setSearchTour] = useState('');
  const [searchTitle, setSearchTitle] = useState('');

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<IItinerary | null>(null);

  const fetchDataItinerary = useCallback(async () => {
    try {
      if (!tourId) return;

      const res = await getItineraryByTourId(tourId);
      if (res.code === 1000) {
        setData(res.result);
      }
    } catch (error) {
      console.error('Failed to fetch tours:', error);
    }
  }, [tourId]);

  useEffect(() => {
    fetchDataItinerary();
  }, [fetchDataItinerary]);

  // Lọc dữ liệu theo search
  const filteredData = data.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTour.toLowerCase()) &&
      d.title.toLowerCase().includes(searchTitle.toLowerCase())
  );

  const handleAdd = async (values: any) => {
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
    const res = await addItinerary(newLocation);
    if (res.code === 1000) {
      setData([res.result, ...data]);
      message.success('Thêm lịch trình thành công');
      setOpenAdd(false);
    } else {
      message.error('Thêm lịch trình thất bại: ');
    }
    setOpenAdd(false);
  };

  const handleEditClick = (record: IItinerary) => {
    setEditingItinerary(record);
    setOpenEdit(true);
  };

  const handleEdit = async (values: any) => {
    if (!editingItinerary) return;

    const updateData = {
      ...values,
      id: editingItinerary.id,
    };

    const res = await updateItinerary(updateData);

    if (res.code === 1000) {
      setData((prev) =>
        prev.map((tour) => (tour.id === editingItinerary.id ? { ...tour, ...res.result } : tour))
      );
      message.success('Cập nhật lịch trình thành công');
      setOpenEdit(false);
      setEditingItinerary(null);
    } else {
      message.error('Cập nhật lịch trình thất bại');
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
          const res = await deleteItinerary(id);
          if (res.code === 1000) {
            setData(data.filter((d) => d.id !== id));
            message.success('Xóa lịch trình thành công');
          } else {
            message.error('Xóa lịch trình thất bại');
          }
        },
      });
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
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
      render: (_, record) => (
        <Space>
          <EditOutlined
            style={{ color: '#1890ff', fontSize: 18, cursor: 'pointer' }}
            onClick={() => handleEditClick(record)}
          />
          <DeleteOutlined
            style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  // Tạo button thêm mới với điều kiện
  const renderAddButton = () => {
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
      {/* --------------- Chỗ sửa: Thêm để build không bị lỗi never read --------------- */}
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search title"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Search tour"
          value={searchTour}
          onChange={(e) => setSearchTour(e.target.value)}
          style={{ width: 200 }}
        />
      </Space>
      {/* --------------- Chỗ sửa: Thêm để build không bị lỗi never read --------------- */}

      <ProTable<IItinerary>
        columns={columns}
        rowKey="id"
        dataSource={filteredData}
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
        destroyOnClose
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
        destroyOnClose
        centered
      >
        {editingItinerary && <EditItinerary data={editingItinerary} onSubmit={handleEdit} />}
      </Modal>
    </div>
  );
};

export default ManagerItinerary;
