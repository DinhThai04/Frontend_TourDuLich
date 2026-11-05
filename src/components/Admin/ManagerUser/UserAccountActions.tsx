import { accountStatusLabels, availableAccountActions, type AccountAction as Action } from '@/utils/accounts';
import { useState } from 'react';
import { Button, Form, Input, Modal, Space, Table, Tag, message, Alert } from 'antd';
import type { User, AccountEvent } from '@/types/User';
import { archiveAccount, setAccountStatus, deleteUser, accountEvents } from '@/services/userServices';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';
import { useAppSelector } from '@/store/hooks';
import { errorMessage } from '@/utils/errors';

const labels: Record<Action,string> = { LOCK:'Khóa', UNLOCK:'Mở khóa', ARCHIVE:'Lưu trữ', DELETE:'Xóa vĩnh viễn' };
export default function UserAccountActions({ user, onChanged }: { user: User; onChanged: () => void }) {
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
  const [form]=Form.useForm<{ reason:string }>();
  const status=user.status ?? 'ACTIVE';
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
    setLoadingHistory(true);setHistory([]);setHistoryOpen(true);
    try {const response=await accountEvents(user.id);if(response.code!==1000)throw new Error(response.message);setHistory(response.result);}
    catch(error){message.error(errorMessage(error));}
    finally {setLoadingHistory(false);}
  };
  return <>
    <Space wrap>
      {(available.includes('LOCK') || available.includes('UNLOCK')) && <Button size="small" onClick={()=>open(status==='ACTIVE'?'LOCK':'UNLOCK')}>{status==='ACTIVE'?'Khóa':'Mở khóa'}</Button>}
      {available.includes('ARCHIVE') && <Button size="small" onClick={()=>open('ARCHIVE')}>Lưu trữ</Button>}
      {available.includes('DELETE') && <Button size="small" danger onClick={()=>open('DELETE')}>Xóa thật</Button>}
      {canEvents && <Button size="small" onClick={()=>void viewHistory()}>Nhật ký</Button>}
    </Space>
    <Modal title={action?`${labels[action]} tài khoản ${user.username}`:''} open={!!action} onCancel={()=>{if(!saving)setAction(null);}} onOk={()=>void submit()} confirmLoading={saving} maskClosable={!saving} closable={!saving} okText={action?labels[action]:'Xác nhận'}>
      <Alert type={action==='DELETE'?'warning':'info'} showIcon message={action==='DELETE'?'Chỉ xóa thật tài khoản đã khóa và chưa có lịch sử nghiệp vụ. Nhật ký thao tác vẫn được giữ.':action==='ARCHIVE'?'Lưu trữ giữ nguyên lịch sử. Chỉ thực hiện khi đã giải quyết mọi chuyến đi, thanh toán và yêu cầu liên quan.':action==='LOCK'?'Tài khoản sẽ mất quyền đăng nhập và sử dụng phiên cũ. Booking và giao dịch vẫn được giữ nguyên.':'Tài khoản có thể đăng nhập lại bằng mật khẩu hiện có. Phiên trước khi khóa không được khôi phục.'} />
      <Form form={form} layout="vertical"><Form.Item name="reason" label="Lý do" rules={[{required:true,whitespace:true,message:'Vui lòng nhập lý do'}, {max:1000}]}><Input.TextArea rows={3} maxLength={1000} showCount disabled={saving}/></Form.Item></Form>
    </Modal>
    <Modal title={`Nhật ký tài khoản ${user.username} (100 mục gần nhất)`} open={historyOpen} onCancel={()=>setHistoryOpen(false)} footer={null} width={900}>
      <Table<AccountEvent> rowKey="id" dataSource={history} loading={loadingHistory} pagination={{pageSize:10}} columns={[
        {title:'Thời gian',dataIndex:'createdAt'}, {title:'Người thực hiện',dataIndex:'actorId',render:(id:number)=>`Tài khoản #${id}`},
        {title:'Thao tác',dataIndex:'action'}, {title:'Trạng thái mới',dataIndex:'newStatus',render:(value:AccountEvent['newStatus'])=><Tag>{value?accountStatusLabels[value]:'Đã xóa thật'}</Tag>}, {title:'Lý do',dataIndex:'reason'}
      ]}/>
    </Modal>
  </>;
}
