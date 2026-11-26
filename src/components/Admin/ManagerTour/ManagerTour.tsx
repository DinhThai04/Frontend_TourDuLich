import AdminPageHeader from '../Shared/AdminPageHeader';
import { AdminProTable as ProTable } from '@/components/Admin/Shared/AdminTable';
import type { TourFormValues } from '@/types/adminForms';
import React, { useState } from 'react';
import { type ProColumns } from '@ant-design/pro-components';
import { Button, message, Modal, Alert, Input, Select, Popconfirm, Space, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import AddNewTour from './ModelTour/AddNewTour';
import EditTour from './ModelTour/EditTour';
import type { ITour, TourRequest } from '@/types/Tour';
import { addTour, deleteTour, getAllTours, updateTour, retryTourImages } from '@/services/tourServices';
import { mediaError, submitTourMedia } from '@/utils/tourMedia';
import TourMediaCleanup from './TourMediaCleanup';
import { Link } from 'react-router-dom';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { isApiSuccess } from '@/utils/apiResult';
import { formatCurrencyVND, isListCapped, TOUR_LIST_CAP } from '@/utils';
import { useApiQuery } from '@/hooks';

const ManagerTourList: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTour, setSelectedTour] = useState<ITour | null>(null);
  const [pendingCreatedTour, setPendingCreatedTour] = useState<ITour | null>(null);
  const [openMedia, setOpenMedia] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [filters, setFilters] = useState<{ tourTitle: string; tourProgram: string }>({
    tourTitle: '',
    tourProgram: '',
  });
  const [origin, setOrigin] = useState<string>();
  const [destination, setDestination] = useState<string>();
  const canCreate = useHasPermission(ALL_PERMISSIONS.TOURS.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.TOURS.UPDATE);
  const canDelete = useHasPermission(ALL_PERMISSIONS.TOURS.DELETE);
  const canViewDepartures = useHasPermission(ALL_PERMISSIONS.TOUR_DEPARTURES.GET_BY_TOUR);

  const { data: dataTour = [], loading, error: loadError, refresh } = useApiQuery(async () => {
    const res = await getAllTours();
    if (!isApiSuccess(res)) throw new Error(res?.message || 'Không tải được danh sách tour');
    return res.result;
  });

  const visibleTours = dataTour.filter((tour) =>
    (!origin || tour.departureCity?.city === origin) && (!destination || tour.destinationCity?.city === destination) &&
    (!filters.tourTitle || `${tour.id} ${tour.tourTitle} ${tour.tourProgram}`.toLowerCase().includes(filters.tourTitle.toLowerCase())),

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
        if (!canUpdate) {
          setPendingCreatedTour(null);
          setOpen(false);
          message.warning('Tour đã được tạo. Nhờ nhân viên có quyền chỉnh sửa tour bổ sung ảnh.');
          return true;
        }
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
    { title: 'Tour', render: (_, row) => <div className="admin-tour-cell">
      {row.imageIds?.[0] && <img loading="lazy" src={row.imageIds[0]} alt="" width={56} height={40} />}
      <div><Link to={`/admin/tours/${row.id}`}>{row.tourTitle}</Link><div className="text-xs text-slate-600">#{row.id} · {row.tourProgram}</div></div>
    </div> },
    { title: 'Hành trình', render: (_, row) => `${row.departureCity?.city || '—'} → ${row.destinationCity?.city || '—'}` },
    { title: 'Thời lượng', responsive: ['lg'], render: (_, row) => `${row.duration} ngày ${Math.max(0, row.duration - 1)} đêm` },
    { title: 'Giá từ', align: 'right', render: (_, row) => formatCurrencyVND(row.basePrice) },
    { title: 'Lịch khởi hành', render: (_, row) => canViewDepartures && <Link to={`/admin/tours/${row.id}/departures`}>Xem lịch</Link> },
    { title: 'Thao tác', width: 152, render: (_, row) => <Space size={2}>
      <Link to={`/admin/tours/${row.id}`}>Chi tiết</Link>
      {canUpdate && <Tooltip title="Sửa"><Button type="text" aria-label="Sửa" icon={<EditOutlined />}
        onClick={() => { setSelectedTour(row); setOpenEdit(true); }} /></Tooltip>}
      {canDelete && <Popconfirm title={`Xóa tour #${row.id}?`}
        description="Tour có lịch khởi hành cần xử lý lịch trước khi xóa."
        okText="Xóa tour" cancelText="Hủy" okButtonProps={{ danger: true }} onConfirm={async () => {
          try {
            const result = await deleteTour(row.id);
            if (!isApiSuccess(result)) throw new Error(result.message || 'Chưa xóa được tour');
            message.success('Đã xóa tour');
            await refresh();
          } catch (error) { message.error(mediaError(error)); throw error; }
        }}><Tooltip title="Xóa"><Button type="text" danger aria-label="Xóa" icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
    </Space> },
  ];

  return (
    <div className="admin-dashboard">
      <AdminPageHeader title="Tour" description="Quản lý danh mục và mở hồ sơ từng tour." />
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
      <ProTable filterKey={JSON.stringify([filters, origin, destination])}
        headerTitle="Danh sách Tour"
        rowKey="id"
        columns={columns}
        dataSource={visibleTours}
        loading={loading}
        search={false}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        toolBarRender={() => [
          <Input key="keyword" allowClear aria-label="Tìm tour" placeholder="Tên, mã tour hoặc chương trình" value={filters.tourTitle}
            onChange={event => setFilters(current => ({ ...current, tourTitle: event.target.value }))} />,
          <Select key="origin" allowClear placeholder="Điểm đi" value={origin} onChange={setOrigin}
            options={[...new Set(dataTour.map(tour => tour.departureCity?.city).filter(Boolean))].map(value => ({ value, label: value }))} />,
          <Select key="destination" allowClear placeholder="Điểm đến" value={destination} onChange={setDestination}
            options={[...new Set(dataTour.map(tour => tour.destinationCity?.city).filter(Boolean))].map(value => ({ value, label: value }))} />,
          ...((canUpdate || canDelete) ? [<Button key="media" onClick={() => setOpenMedia(true)}>Tệp ảnh đã gỡ khỏi tour</Button>] : []),
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
        centered
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
        centered
        width={900}
      >
        <EditTour data={selectedTour} isEdit={true} onSubmit={handleEdit} onSavingChange={setSavingEdit} />
      </Modal>
    </div>
  );
};

export default ManagerTourList;
