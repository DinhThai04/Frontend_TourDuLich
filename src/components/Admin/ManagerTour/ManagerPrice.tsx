'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, message } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { AddTourPriceRequest, ITourPrice } from '@/types/Tour';
import { addPrice, getAllPrice, updateTourPrice } from '@/services/tourServices';
import AddPrice from './ModelPrice/AddPrice';
import EditPrice from './ModelPrice/EditPrice';

import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

const ManagerPrice: React.FC = () => {
  const [data, setData] = useState<ITourPrice[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTourPrice, setSelectedTourPrice] = useState<ITourPrice | null>(null);

  // ===== QUYỀN =====
  const canList = useHasPermission(ALL_PERMISSIONS.PRICE.GET_LIST);
  const canCreate = useHasPermission(ALL_PERMISSIONS.PRICE.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.PRICE.UPDATE);

  const fetchDataPrice = useCallback(async () => {
    if (!canList) {
      setData([]);
      return;
    }

    try {
      const res = await getAllPrice();
      if (res.code === 1000) {
        setData(res.result);
      } else {
        message.error('Lấy danh sách giá thất bại');
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      message.error('Lấy danh sách giá thất bại');
    }
  }, [canList]);

  useEffect(() => {
    fetchDataPrice();
  }, [fetchDataPrice]);

  const handleAdd = async (values: any) => {
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
        setData((prev) => [res.result, ...prev]);
        message.success('Thêm giá thành công');
        setOpenAdd(false);
      } else {
        message.error('Thêm giá thất bại');
      }
    } catch (error) {
      console.error(error);
      message.error('Thêm giá thất bại');
    }
  };

  const handleEdit = async (values: any) => {
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
        setData((prev) =>
          prev.map((tour) => (tour.id === selectedTourPrice.id ? { ...tour, ...res.result } : tour))
        );
        message.success('Cập nhật giá thành công');
        setOpenEdit(false);
        setSelectedTourPrice(null);
      } else {
        message.error('Cập nhật giá thất bại');
      }
    } catch (error) {
      console.error(error);
      message.error('Cập nhật giá thất bại');
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
    { title: 'Người lớn', dataIndex: 'adultPrice' },
    { title: 'Trẻ em', dataIndex: 'childPrice' },
    { title: 'Trẻ nhỏ', dataIndex: 'toddlerPrice' },
    { title: 'Em bé', dataIndex: 'infantPrice' },
    { title: 'Phụ thu phòng đơn', dataIndex: 'singleSupplementPrice' },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      search: false,
      render: (_, record) =>
        canUpdate ? (
          <Space>
            <EditOutlined
              style={{ color: '#1890ff', fontSize: 18, cursor: 'pointer' }}
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
      <ProTable<ITourPrice>
        columns={columns}
        rowKey="id"
        dataSource={data}
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
        destroyOnClose
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
        destroyOnClose
        centered
      >
        <EditPrice data={selectedTourPrice} onSubmit={handleEdit} />
      </Modal>
    </div>
  );
};

export default ManagerPrice;
