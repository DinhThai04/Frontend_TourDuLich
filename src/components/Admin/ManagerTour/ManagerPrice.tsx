import type { PriceFormValues } from '@/types/adminForms';
import React, { useState } from 'react';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, message, Alert } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { AddTourPriceRequest, ITourPrice } from '@/types/Tour';
import { addPrice, getAllPrice, updateTourPrice } from '@/services/tourServices';
import AddPrice from './ModelPrice/AddPrice';
import EditPrice from './ModelPrice/EditPrice';
import { isApiSuccess } from '@/utils/apiResult';
import { errorMessage } from '@/utils/errors';
import { useApiQuery } from '@/hooks';
import { formatCurrencyVND } from '@/utils';

import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

const ManagerPrice: React.FC = () => {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTourPrice, setSelectedTourPrice] = useState<ITourPrice | null>(null);

  // ===== QUYỀN =====
  const canList = useHasPermission(ALL_PERMISSIONS.PRICE.GET_LIST);
  const canCreate = useHasPermission(ALL_PERMISSIONS.PRICE.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.PRICE.UPDATE);

  const { data = [], loading, error: loadError, refresh } = useApiQuery(
    async () => {
      const res = await getAllPrice();
      if (!isApiSuccess(res)) throw new Error(res?.message || 'Lấy danh sách giá thất bại');
      return res.result;
    },
    { enabled: canList, onError: (msg) => message.error(msg) },
  );

  const handleAdd = async (values: PriceFormValues) => {
    if (!canCreate) {
      message.error('Bạn không có quyền thêm giá');
      return;
    }

    const newPrice: AddTourPriceRequest = {
      adultPrice: values.adultPrice,
      childPrice: values.childPrice,
      toddlerPrice: values.toddlerPrice,
      infantPrice: values.infantPrice,
      singleSupplementPrice: values.singleSupplementPrice,
    };

    try {
      const res = await addPrice(newPrice);
      if (res.code === 1000) {
        await refresh();
        message.success('Thêm giá thành công');
        setOpenAdd(false);
      } else {
        message.error(res.message || 'Thêm giá thất bại');
      }
    } catch (error) {
      message.error(errorMessage(error, 'Thêm giá thất bại'));
    }
  };

  const handleEdit = async (values: PriceFormValues) => {
    if (!selectedTourPrice) return;

    if (!canUpdate) {
      message.error('Bạn không có quyền sửa giá');
      return;
    }

    const updateData = {
      ...values,
      id: selectedTourPrice.id,
    };

    try {
      const res = await updateTourPrice(updateData);

      if (res.code === 1000) {
        await refresh();
        message.success('Cập nhật giá thành công');
        setOpenEdit(false);
        setSelectedTourPrice(null);
      } else {
        message.error(res.message || 'Cập nhật giá thất bại');
      }
    } catch (error) {
      message.error(errorMessage(error, 'Cập nhật giá thất bại'));
    }
  };

  const columns: ProColumns<ITourPrice>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    { title: 'Người lớn', dataIndex: 'adultPrice', render: (val) => formatCurrencyVND(Number(val)) },
    { title: 'Trẻ em', dataIndex: 'childPrice', render: (val) => formatCurrencyVND(Number(val)) },
    { title: 'Trẻ nhỏ', dataIndex: 'toddlerPrice', render: (val) => formatCurrencyVND(Number(val)) },
    { title: 'Em bé', dataIndex: 'infantPrice', render: (val) => formatCurrencyVND(Number(val)) },
    {
      title: 'Phụ thu phòng đơn',
      dataIndex: 'singleSupplementPrice',
      render: (val) => formatCurrencyVND(Number(val)),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      search: false,
      render: (_, record) =>
        canUpdate ? (
          <Space>
            <Button
              type="text"
              aria-label={`Sửa bảng giá ${record.id}`}
              icon={<EditOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
              onClick={() => {
                setSelectedTourPrice(record);
                setOpenEdit(true);
              }}
            />
          </Space>
        ) : null,
    },
  ];

  // Không có quyền xem danh sách
  if (!canList) {
    return <div>Bạn không có quyền quản lý giá tour.</div>;
  }

  return (
    <div>
      {loadError && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loadError} />
      )}
      <ProTable<ITourPrice>
        columns={columns}
        rowKey="id"
        dataSource={data}
        loading={loading}
        search={false}
        headerTitle="Danh sách combo giá"
        toolBarRender={() => [
          canCreate && (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenAdd(true)}
            >
              Thêm mới
            </Button>
          ),
        ]}
        pagination={{ pageSize: 5 }}
      />

      {/* Modal Add */}
      <Modal
        title="Thêm giá"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        <AddPrice onSubmit={handleAdd} />
      </Modal>

      {/* Modal Edit */}
      <Modal
        title="Chỉnh sửa giá"
        open={openEdit}
        onCancel={() => {
          setOpenEdit(false);
          setSelectedTourPrice(null);
        }}
        footer={null}
        destroyOnHidden
        centered
      >
        <EditPrice data={selectedTourPrice} onSubmit={handleEdit} />
      </Modal>
    </div>
  );
};

export default ManagerPrice;
