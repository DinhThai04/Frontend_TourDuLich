import React, { useCallback, useEffect, useState } from 'react';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, message, Tooltip } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { AddTourDepartureRequest, ITourDeparture } from '@/types/Tour';
import {
  addTourDeparture,
  getDepartureByTourId,
  updateTourDeparture,
} from '@/services/tourServices';
import { useLocation } from 'react-router-dom';
import AddTourDeparture from './ModelTourDeparture/AddTourDeparture';
import EditTourDeparture from './ModelTourDeparture/EditTourDeparture';

const ManagerTourDeparture: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tourIdParam = params.get('tourId');
  const tourId = tourIdParam ? Number(tourIdParam) : null;
  const [data, setData] = useState<ITourDeparture[]>([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTourDeparture, setSelectedTourDeparture] = useState<ITourDeparture | null>(null);

  const fetchDataTourDeparture = useCallback(async () => {
    try {
      if (!tourId) return;

      const res = await getDepartureByTourId(tourId);
      if (res.code === 1000) {
        setData(res.result);
      }
    } catch (error) {
      console.error('Failed to fetch tours:', error);
    }
  }, []);

  useEffect(() => {
    fetchDataTourDeparture();
  }, [fetchDataTourDeparture]);

  const handleAdd = async (values: any) => {
    try {
      const newLocation: AddTourDepartureRequest = {
        departureDate: values.departureDate,
        returnDate: values.returnDate,
        availableSeats: values.availableSeats,
        tourId: tourId!,
      };
      console.log('📤 Data gửi lên backend:', newLocation);
      const res = await addTourDeparture(newLocation);

      if (res.code === 1000) {
        setData([res.result, ...data]);
        message.success('Thêm ngày khởi hành thành công');
        setOpenAdd(false);
      } else {
        message.error(`Thêm ngày khởi hành thất bại: ${res.result}`);
      }
    } catch (error: any) {
      const backendMsg = error.response?.data?.message || 'Lỗi không xác định';
      message.error(`Lỗi: ${backendMsg}`);

      console.error('ERROR API:', error);
    }
  };

  const handleEditClick = (record: ITourDeparture) => {
    setSelectedTourDeparture(record);
    setOpenEdit(true);
  };

  const handleEdit = async (values: any) => {
    if (!selectedTourDeparture) return;

    const updateData = {
      ...values,
      id: selectedTourDeparture.id,
    };

    const res = await updateTourDeparture(updateData);

    if (res.code === 1000) {
      setData((prev) =>
        prev.map((tour) =>
          tour.id === selectedTourDeparture.id ? { ...tour, ...res.result } : tour
        )
      );
      message.success('Cập nhật ngày khởi hành thành công');
      setOpenEdit(false);
      setSelectedTourDeparture(null);
    } else {
      message.error('Cập nhật ngày khởi hành thất bại');
    }
  };

  const columns: ProColumns<ITourDeparture>[] = [
    { title: 'STT', key: 'index', width: 60, align: 'center', render: (_, __, index) => index + 1 },
    { title: 'Mã tour', dataIndex: 'tourCode' },
    { title: 'Ngày khởi hành', dataIndex: 'departureDate' },
    { title: 'Ngày trở về', dataIndex: 'returnDate' },
    { title: 'Chỗ', dataIndex: 'availableSeats' },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <EditOutlined
            style={{ color: '#1890ff', fontSize: 18 }}
            onClick={() => {
              handleEditClick(record);
            }}
          />
        </Space>
      ),
    },
  ];

  const renderAddButton = () => {
    if (!tourId) {
      return (
        <Tooltip title="Vui lòng chọn tour trước khi thêm ngày khởi hành">
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
      <ProTable<ITourDeparture>
        columns={columns}
        rowKey="id"
        dataSource={data}
        search={false}
        headerTitle="Danh sách ngày khởi hành tour"
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
        <AddTourDeparture onSubmit={handleAdd} />
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
        <EditTourDeparture data={selectedTourDeparture} onSubmit={handleEdit} />
      </Modal>
    </div>
  );
};

export default ManagerTourDeparture;
