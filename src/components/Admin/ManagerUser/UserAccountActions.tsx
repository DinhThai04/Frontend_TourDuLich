import { accountStatusLabels, availableAccountActions, type AccountAction as Action } from '@/utils/accounts';
import { useState } from 'react';
import { Button, Dropdown, Empty, Form, Input, Modal, Skeleton, Timeline, message, Alert } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { User, AccountEvent } from '@/types/User';
import { archiveAccount, setAccountStatus, deleteUser, accountEvents } from '@/services/userServices';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';
import { useAppSelector } from '@/store/hooks';
import { formatDatetime } from '@/utils';
import { errorMessage } from '@/utils/errors';

const historyLabels: Record<string, string> = { LOCK: 'Khóa tài khoản', UNLOCK: 'Mở khóa', ARCHIVE: 'Lưu trữ', DELETE: 'Xóa tài khoản', AUTHORIZATION_CHANGE: 'Thay đổi quyền hoặc vai trò', TOKEN_REPLAY: 'Thu hồi phiên do phát hiện token dùng lại' };
const labels: Record<Action,string> = { LOCK:'Khóa', UNLOCK:'Mở khóa', ARCHIVE:'Lưu trữ', DELETE:'Xóa vĩnh viễn' };
export default function UserAccountActions({ user, onChanged, onEdit }: { user: User; onChanged: () => void; onEdit?: () => void }) {
  const canStatus=useHasPermission(ALL_PERMISSIONS.USERS.STATUS);
  const canArchive=useHasPermission(ALL_PERMISSIONS.USERS.ARCHIVE);
  const canDelete=useHasPermission(ALL_PERMISSIONS.USERS.DELETE);
  const canEvents=useHasPermission(ALL_PERMISSIONS.USERS.EVENTS);
  const current=useAppSelector(state=>state.auth.user);
  const [action,setAction]=useState<Action|null>(null);
  const [saving,setSaving]=useState(false);
  const [historyOpen,setHistoryOpen]=useState(false);
  const [history,setHistory]=useState<AccountEvent[]>([]);
  const [loadingHistory,setLoadingHistory]=useState(false);
  const [historyError,setHistoryError]=useState('');
  const [form]=Form.useForm<{ reason:string }>();
  const available=availableAccountActions(user,current,{ status:canStatus,archive:canArchive,delete:canDelete });
  const open=(next:Action)=>{form.resetFields();setAction(next);};
  const submit=async()=>{
    if(!action || saving)return;
    setSaving(true);
    try {
      const values=await form.validateFields();
      const reason=values.reason.trim();
      const response=action==='DELETE'?await deleteUser(user.id,reason):action==='ARCHIVE'?await archiveAccount(user.id,reason):await setAccountStatus(user.id,action==='LOCK'?'LOCKED':'ACTIVE',reason);
      if(response.code!==1000)throw new Error(response.message || 'Thao tác chưa thành công');
      message.success('Đã cập nhật tài khoản');setAction(null);onChanged();
    } catch(error){if (!(error && typeof error==='object' && 'errorFields' in error)) message.error(errorMessage(error));}
    finally {setSaving(false);}
  };
  const viewHistory=async()=>{
    setLoadingHistory(true);setHistory([]);setHistoryError('');setHistoryOpen(true);
    try {const response=await accountEvents(user.id);if(response.code!==1000)throw new Error(response.message);setHistory(response.result);}
    catch(error){setHistoryError(errorMessage(error));}
    finally {setLoadingHistory(false);}
  };
  return <>
    {(available.length > 0 || canEvents || onEdit) && <Dropdown trigger={['click']} menu={{ items: [
      ...(onEdit ? [{ key: 'edit', label: 'Chỉnh sửa', onClick: onEdit }] : []),
      ...(canEvents ? [{ key: 'history', label: 'Lịch sử quản trị', onClick: () => void viewHistory() }] : []),
      ...available.map(item => ({ key: item, label: labels[item], danger: item === 'LOCK' || item === 'DELETE', onClick: () => open(item) })),
    ] }}>
      <Button size="small" type="text" icon={<MoreOutlined />} aria-label={`Thao tác với ${user.username}`} title="Thao tác tài khoản" />
    </Dropdown>}
    <Modal centered
        title={action?`${labels[action]} tài khoản ${user.username}`:''} open={!!action} onCancel={()=>{if(!saving)setAction(null);}} onOk={()=>void submit()} confirmLoading={saving} maskClosable={!saving} closable={!saving} okText={action?labels[action]:'Xác nhận'}>
      <Alert type={action==='DELETE'?'warning':'info'} showIcon message={action==='DELETE'?'Chỉ xóa thật tài khoản đã khóa và chưa có lịch sử nghiệp vụ. Nhật ký thao tác vẫn được giữ.':action==='ARCHIVE'?'Lưu trữ giữ nguyên lịch sử. Chỉ thực hiện khi đã giải quyết mọi chuyến đi, thanh toán và yêu cầu liên quan.':action==='LOCK'?'Tài khoản sẽ mất quyền đăng nhập và sử dụng phiên cũ. Booking và giao dịch vẫn được giữ nguyên.':'Tài khoản có thể đăng nhập lại bằng mật khẩu hiện có. Phiên trước khi khóa không được khôi phục.'} />
      <Form form={form} layout="vertical"><Form.Item name="reason" label="Lý do" rules={[{required:true,whitespace:true,message:'Vui lòng nhập lý do'}, {max:1000}]}><Input.TextArea rows={3} maxLength={1000} showCount disabled={saving}/></Form.Item></Form>
    </Modal>
    <Modal centered
        title={`Lịch sử quản trị · ${user.username}`} open={historyOpen} onCancel={()=>setHistoryOpen(false)} footer={null} width={900}>
      <p className="mb-4 text-sm text-slate-600">Tối đa 100 sự kiện trạng thái, quyền và thu hồi phiên bảo mật. Mỗi mục ghi thời điểm, tài khoản thực hiện, thao tác và lý do.</p>
      {historyError ? <Alert type="error" showIcon message={historyError} /> :
        loadingHistory ? <Skeleton active paragraph={{ rows: 3 }} /> :
        !history.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tài khoản này chưa có thay đổi quản trị được ghi nhận." /> :
        <Timeline className="mt-6" items={history.map(event => ({
          color: event.action === 'LOCK' || event.action === 'DELETE' ? 'red' : 'blue',
          children: <div className="admin-audit-event">
            <strong>{historyLabels[event.action] || event.action}</strong>
            <div>{formatDatetime(event.createdAt)} · Người thực hiện #{event.actorId}</div>
            <div>{accountStatusLabels[event.previousStatus] || '—'} → {event.newStatus ? accountStatusLabels[event.newStatus] : 'Đã xóa'}</div>
            {event.reason && <p>{event.reason}</p>}
          </div>,
        }))} />}
    </Modal>
  </>;
}
