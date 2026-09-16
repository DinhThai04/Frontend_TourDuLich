import React, { useCallback, useEffect, useState } from 'react';
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { Button, Space, message, Modal } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import AddNewTour from './ModelTour/AddNewTour';
import EditTour from './ModelTour/EditTour';
import type { ITour, TourRequest } from '@/types/Tour';
import { addTour, getAllTours, updateTour } from '@/services/tourServices';
import { useNavigate } from 'react-router-dom';
import WatchTour from './ModelTour/WatchTour';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS } from '@/config/permissions';

const ManagerTourList: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openWatch, setOpenWatch] = useState(false);
  const [dataTour, setDataTour] = useState<ITour[]>([]);
  const [selectedTour, setSelectedTour] = useState<ITour | null>(null);
  const navigate = useNavigate();
  const canView = useHasPermission(ALL_PERMISSIONS.TOURS.GET_DETAIL);
  const canCreate = useHasPermission(ALL_PERMISSIONS.TOURS.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.TOURS.UPDATE);
  // const canDelete = useHasPermission(ALL_PERMISSIONS.TOURS.DELETE);
  const fetchDataTour = useCallback(async () => {
    try {
      const res = await getAllTours();
      if (res.code === 1000) {
        setDataTour(res.result);
      }
    } catch (error) {
      console.error('Failed to fetch tours:', error);
    }
  }, []);

  useEffect(() => {
    fetchDataTour();
  }, [fetchDataTour]);

  const handleAdd = async (values: any) => {
    const newData: TourRequest = {
      tourProgram: values.tourProgram,
      tourTitle: values.tourTitle,
      description: values.description,
      duration: values.duration,
      departureLocationId: values.departureLocationId,
      destinationLocationId: values.destinationLocationId,
      basePrice: values.basePrice,
      vehicleId: values.vehicleId,
      tourPriceId: values.tourPriceId,
      files: values.files?.map((f: any) => f.originFileObj),
    };

    const res = await addTour(newData);

    if (res.code === 1000) {
      setDataTour((prev) => [res.result, ...prev]);
      message.success('Thêm tour thành công');
      setOpen(false);
    } else {
      message.error('Thêm tour thất bại');
    }
  };

  const handleEdit = async (values: any) => {
    if (!selectedTour) return;

    // Phân loại files: file mới và file cũ
    const newFiles: File[] = [];
    const existingUrls: string[] = [];

    values.files?.forEach((file: any) => {
      if (file.originFileObj) {
        // Đây là file mới được upload
        newFiles.push(file.originFileObj);
      } else if (file.url) {
        // Đây là file cũ (chỉ có url)
        existingUrls.push(file.url);
      }
    });

    // Tạo updateData theo đúng interface UpdateTourRequest
    const updateData = {
      ...values,
      id: selectedTour.id,
      files: newFiles, // File mới
      url: values.deletedImageUrls || [], // URLs ảnh cần xóa (từ deletedImageUrls)
      // existingImageUrls không cần truyền vì interface không có
    };

    // Loại bỏ các trường không cần thiết khỏi values
    delete updateData.deletedImageUrls;

    console.log('Data to update:', updateData);
    const res = await updateTour(updateData);
    console.log('API Response:', res);

    if (res.code === 1000) {
      setDataTour((prev) =>
        prev.map((tour) => (tour.id === selectedTour.id ? { ...tour, ...res.result } : tour))
      );
      message.success('Cập nhật tour thành công');
      setOpenEdit(false);
      setSelectedTour(null);
    } else {
      message.error('Cập nhật tour thất bại');
    }
  };

  const columns: ProColumns<any>[] = [
    {
      title: 'Tên tour',
      dataIndex: 'tourTitle',
      key: 'tourTitle',
      width: 190,
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Chương trình',
      dataIndex: 'tourProgram',
      key: 'tourProgram',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Điểm đi → đến',
      key: 'location',
      width: 220,
      renderText: (_, r) => `${r.departureCity.city} → ${r.destinationCity.city}`,
    },
    // {
    //   title: 'Phương tiện',
    //   key: 'vehicle',
    //   width: 140,
    //   renderText: (_, r) => `${r.vehicle.name}`,
    // },
    // {
    //   title: 'Thời lượng (ngày)',
    //   dataIndex: 'duration',
    //   key: 'duration',
    //   width: 140,
    //   sorter: (a, b) => a.duration - b.duration,
    // },
    // {
    //   title: 'Giá cơ bản (VNĐ)',
    //   dataIndex: 'basePrice',
    //   key: 'basePrice',
    //   width: 160,
    //   sorter: (a, b) => a.basePrice - b.basePrice,
    //   renderText: (v) => Number(v).toLocaleString('vi-VN'),
    // },
    {
      title: 'Lịch trình',
      key: 'schedule',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            navigate(`/admin/managerTour/itinerary?tourId=${r.id}`);
          }}
        />
      ),
    },
    {
      title: 'Ngày khởi hành',
      key: 'tourDeparture',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            navigate(`/admin/managerTour/tourDeparture?tourId=${r.id}`);
          }}
        />
      ),
    },
    // {
    //   title: 'Hình ảnh',
    //   dataIndex: 'imageUrls',
    //   key: 'imageUrls',
    //   width: 180,
    //   render: (_, r) =>
    //     r.imageIds?.length ? (
    //       <Image.PreviewGroup>
    //         <Space wrap>
    //           {r.imageIds.slice(0, 3).map((url: any, i: any) => (
    //             <Image
    //               key={i}
    //               src={url}
    //               width={48}
    //               height={48}
    //               style={{ objectFit: 'cover', borderRadius: 8 }}
    //             />
    //           ))}
    //           {r.imageIds.length > 3 ? <span>+{r.imageIds.length - 3}</span> : null}
    //         </Space>
    //       </Image.PreviewGroup>
    //     ) : (
    //       <span>—</span>
    //     ),
    // },
    {
      title: 'Hành động',
      key: 'action',
      valueType: 'option',
      width: 150,
      render: (_, r) => (
        <Space>
          {canView && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTour(r);
                setOpenWatch(true);
              }}
            />
          )}

          {canUpdate && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedTour(r);
                setOpenEdit(true);
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="Danh sách Tour"
        rowKey="id"
        columns={columns}
        dataSource={dataTour}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        toolBarRender={() =>
          canCreate
            ? [
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setOpen(true)}
                >
                  Thêm tour
                </Button>,
              ]
            : []
        }
      />

      <Modal
        title="Thêm tour mới"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        style={{ top: 40 }}
        width={900}
      >
        <AddNewTour onSubmit={handleAdd} />
      </Modal>

      <Modal
        title={`Chỉnh sửa tour: ${selectedTour?.tourTitle || ''}`}
        open={openEdit}
        onCancel={() => {
          setOpenEdit(false);
          setSelectedTour(null);
        }}
        footer={null}
        destroyOnClose
        style={{ top: 40 }}
        width={900}
      >
        <EditTour data={selectedTour} isEdit={true} onSubmit={handleEdit} />
      </Modal>
      <Modal
        title={`Thôn tin Tour: ${selectedTour?.tourTitle || ''}`}
        open={openWatch}
        onCancel={() => {
          setOpenWatch(false);
          setSelectedTour(null);
        }}
        footer={null}
        destroyOnClose
        style={{ top: 40 }}
        width={900}
      >
        <WatchTour data={selectedTour} />
      </Modal>
    </>
  );
};

export default ManagerTourList;
