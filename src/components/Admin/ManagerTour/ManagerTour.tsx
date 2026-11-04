import type { TourFormValues } from '@/types/adminForms';
import React, { useState } from 'react';
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { Button, Space, message, Modal, Alert, Input } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import AddNewTour from './ModelTour/AddNewTour';
import EditTour from './ModelTour/EditTour';
import type { ITour, TourRequest } from '@/types/Tour';
import { addTour, getAllTours, updateTour, retryTourImages } from '@/services/tourServices';
import { mediaError, submitTourMedia } from '@/utils/tourMedia';
import TourMediaCleanup from './TourMediaCleanup';
import { useNavigate } from 'react-router-dom';
import WatchTour from './ModelTour/WatchTour';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { isApiSuccess } from '@/utils/apiResult';
import { isListCapped, TOUR_LIST_CAP } from '@/utils';
import { useApiQuery } from '@/hooks';

const ManagerTourList: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openWatch, setOpenWatch] = useState(false);
  const [selectedTour, setSelectedTour] = useState<ITour | null>(null);
  const [pendingCreatedTour, setPendingCreatedTour] = useState<ITour | null>(null);
  const [openMedia, setOpenMedia] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [filters, setFilters] = useState<{ tourTitle: string; tourProgram: string }>({
    tourTitle: '',
    tourProgram: '',
  });
  const navigate = useNavigate();
  const canView = useHasPermission(ALL_PERMISSIONS.TOURS.GET_DETAIL);
  const canCreate = useHasPermission(ALL_PERMISSIONS.TOURS.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.TOURS.UPDATE);
  const canDelete = useHasPermission(ALL_PERMISSIONS.TOURS.DELETE);
  const canViewItinerary = useHasPermission(ALL_PERMISSIONS.ITINERARIES.GET_BY_TOUR);
  const canViewDepartures = useHasPermission(ALL_PERMISSIONS.TOUR_DEPARTURES.GET_BY_TOUR);

  const { data: dataTour = [], loading, error: loadError, refresh } = useApiQuery(async () => {
    const res = await getAllTours();
    if (!isApiSuccess(res)) throw new Error(res?.message || 'Không tải được danh sách tour');
    return res.result;
  });

  const visibleTours = dataTour.filter((tour) =>
    (!filters.tourTitle || (tour.tourTitle ?? '').toLowerCase().includes(filters.tourTitle.toLowerCase())) &&
    (!filters.tourProgram || (tour.tourProgram ?? '').toLowerCase().includes(filters.tourProgram.toLowerCase())),
  );

  const handleAdd = async (values: TourFormValues) => {
    const newData: TourRequest = {
      tourProgram: values.tourProgram,
      tourTitle: values.tourTitle,
      description: values.description,
      duration: values.duration,
      departureLocationId: values.departureLocationId,
      destinationLocationId: values.destinationLocationId,
      vehicleId: values.vehicleId,
      tourPriceId: values.tourPriceId,
      files: values.files?.flatMap(f => f.originFileObj ? [f.originFileObj] : []) ?? [],
    };

    try {
      const res = await submitTourMedia(pendingCreatedTour?.id ?? null, newData, addTour, retryTourImages);
      if (res.code !== 1000) throw new Error(res.message || 'Chưa tạo được tour');
      await refresh();
      if (res.result.imageUploadStatus === 'PENDING') {
        setPendingCreatedTour(res.result);
        message.warning(res.result.imageUploadMessage || 'Tour đã tạo, vui lòng thử tải lại ảnh');
        return false;
      }
      setPendingCreatedTour(null);
      message.success('Đã lưu tour và hình ảnh');
      setOpen(false);
      return true;
    } catch (error) { message.error(mediaError(error)); return false; }
  };

  const handleEdit = async (values: TourFormValues) => {
    if (!selectedTour) return;

    // Phân loại files: file mới và file cũ
    const newFiles: File[] = [];
    const existingUrls: string[] = [];

    values.files?.forEach((file) => {
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

    try {
    const res = await updateTour(updateData);

    if (res.code === 1000) {
      await refresh();
      message.success('Cập nhật tour thành công');
      setOpenEdit(false);
      setSelectedTour(null);
      if (pendingCreatedTour?.id === selectedTour.id) setPendingCreatedTour(null);
      return true;
    } else {
      message.error(res.message || 'Cập nhật tour thất bại');
      return false;
    }
    } catch (error) { message.error(mediaError(error)); return false; }
  };

  const columns: ProColumns<ITour>[] = [
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
    {
      title: 'Lịch trình',
      key: 'schedule',
      width: 100,
      align: 'center',
      render: (_, r) =>
        canViewItinerary ? (
          <Button
            type="link"
            aria-label="Xem lịch trình"
            icon={<EyeOutlined />}
            onClick={() => {
              navigate(`/admin/managerTour/itinerary?tourId=${r.id}`);
            }}
          />
        ) : (
          '—'
        ),
    },
    {
      title: 'Ngày khởi hành',
      key: 'tourDeparture',
      width: 100,
      align: 'center',
      render: (_, r) =>
        canViewDepartures ? (
          <Button
            type="link"
            aria-label="Xem ngày khởi hành"
            icon={<EyeOutlined />}
            onClick={() => {
              navigate(`/admin/managerTour/tourDeparture?tourId=${r.id}`);
            }}
          />
        ) : (
          '—'
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
    //           {r.imageIds.slice(0, 3).map((url: string, i: number) => (
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
              aria-label={`Xem chi tiết tour ${r.tourTitle}`}
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
              aria-label={`Sửa tour ${r.tourTitle}`}
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
      {loadError && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loadError} />
      )}
      {isListCapped(dataTour, TOUR_LIST_CAP) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Danh sách chỉ hiển thị ${TOUR_LIST_CAP} tour gần nhất; tour cũ hơn cần được quản lý qua tìm kiếm của khách hàng hoặc API phân trang.`}
        />
      )}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên tour"
          value={filters.tourTitle}
          onChange={(e) => setFilters((current) => ({ ...current, tourTitle: e.target.value }))}
          allowClear
          style={{ width: 240 }}
        />
        <Input
          placeholder="Tìm theo chương trình"
          value={filters.tourProgram}
          onChange={(e) => setFilters((current) => ({ ...current, tourProgram: e.target.value }))}
          allowClear
          style={{ width: 240 }}
        />
      </Space>
      <ProTable
        headerTitle="Danh sách Tour"
        rowKey="id"
        columns={columns}
        dataSource={visibleTours}
        loading={loading}
        search={false}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        toolBarRender={() => [
          ...((canUpdate || canDelete) ? [<Button key="media" onClick={() => setOpenMedia(true)}>Ảnh đã gỡ</Button>] : []),
          ...(canCreate ? [
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setOpen(true)}
                >
                  {pendingCreatedTour ? `Tải lại ảnh tour #${pendingCreatedTour.id}` : 'Thêm tour'}
                </Button>,
              ] : []),
        ]}
      />

      <Modal
        title="Thêm tour mới"
        open={open}
        closable={!savingCreate}
        maskClosable={!savingCreate}
        keyboard={!savingCreate}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
        style={{ top: 40 }}
        width={900}
      >
        <AddNewTour onSubmit={handleAdd} pendingTour={pendingCreatedTour} onSavingChange={setSavingCreate}
          onSkipImages={() => { setPendingCreatedTour(null); setOpen(false); }} />
      </Modal>
      <TourMediaCleanup open={openMedia} onClose={() => setOpenMedia(false)} canDelete={canDelete} />

      <Modal
        title={`Chỉnh sửa tour: ${selectedTour?.tourTitle || ''}`}
        open={openEdit}
        closable={!savingEdit}
        maskClosable={!savingEdit}
        keyboard={!savingEdit}
        onCancel={() => {
          setOpenEdit(false);
          setSelectedTour(null);
        }}
        footer={null}
        destroyOnHidden
        style={{ top: 40 }}
        width={900}
      >
        <EditTour data={selectedTour} isEdit={true} onSubmit={handleEdit} onSavingChange={setSavingEdit} />
      </Modal>
      <Modal
        title={`Thông tin Tour: ${selectedTour?.tourTitle || ''}`}
        open={openWatch}
        onCancel={() => {
          setOpenWatch(false);
          setSelectedTour(null);
        }}
        footer={null}
        destroyOnHidden
        style={{ top: 40 }}
        width={900}
      >
        <WatchTour data={selectedTour} />
      </Modal>
    </>
  );
};

export default ManagerTourList;
