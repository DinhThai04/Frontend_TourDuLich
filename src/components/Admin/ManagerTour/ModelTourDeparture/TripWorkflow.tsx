import { Alert, Button, Empty, Form, Input, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useApiQuery } from '@/hooks';
import { departureManifest, type Checkpoint, type Manifest, type Progress, type TripReport } from '@/services/departureManifest';
import { errorMessage } from '@/utils/errors';
import { formatAdminDatetime } from '@/components/Admin/Shared/adminDate';

const progressLabels: Record<Progress, string> = {
  NOT_STARTED: 'Chưa bắt đầu', IN_PROGRESS: 'Đang thực hiện', COMPLETED: 'Đã thực hiện', DELAYED: 'Trễ', SKIPPED: 'Bỏ chặng',
};
const reportLabels: Record<TripReport['status'], string> = {
  DRAFT: 'Bản nháp', SUBMITTED: 'Đang chờ duyệt', APPROVED: 'Đã duyệt', REVISION_REQUESTED: 'Cần bổ sung',
};

function CheckpointForm({ row, editable, save }: {
  row: Checkpoint; editable: boolean; save: (status: Progress, note: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return <article className="rounded-lg border border-slate-200 px-4 py-3">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <strong>Ngày {row.day} · {row.title}</strong>
      <Tag color={{ NOT_STARTED: 'default', IN_PROGRESS: 'processing', COMPLETED: 'success', DELAYED: 'orange', SKIPPED: 'default' }[row.status]}>{progressLabels[row.status]}</Tag>
    </div>
    {row.actualTime && <Typography.Paragraph type="secondary">
      Cập nhật {formatAdminDatetime(row.actualTime)}
    </Typography.Paragraph>}
    {row.note && !editable && <Typography.Paragraph>{row.note}</Typography.Paragraph>}
    {editable && <Form layout="vertical" initialValues={{ status: row.status, note: row.note }} onFinish={async values => {
      setBusy(true);
      try { await save(values.status, (values.note ?? '').trim()); } finally { setBusy(false); }
    }}>
      <Form.Item name="status" label="Tiến độ" rules={[{ required: true }]}>
        <Select options={Object.entries(progressLabels).map(([value, label]) => ({ value, label }))} />
      </Form.Item>
      <Form.Item name="note" label="Ghi chú" dependencies={['status']} rules={[({ getFieldValue }) => ({
        validator: async (_, value?: string) => {
          if (['DELAYED', 'SKIPPED'].includes(getFieldValue('status')) && !value?.trim())
            throw new Error('Nhập lý do trễ hoặc bỏ chặng.');
        },
      })]}>
        <Input.TextArea maxLength={500} autoSize={{ minRows: 1, maxRows: 4 }} />
      </Form.Item>
      <Button htmlType="submit" loading={busy}>Lưu tiến độ</Button>
    </Form>}
  </article>;
}

export function TripProgress({ id, editable }: { id: number; editable: boolean }) {
  const [saveError, setSaveError] = useState('');
  const itinerary = useApiQuery(async () => {
    const response = await departureManifest.checkpoints(id);
    if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được lịch trình.');
    return response.result;
  }, { deps: [id] });
  return <div className="space-y-3">
    {(itinerary.error || saveError) && <Alert showIcon type="error" message={itinerary.error || saveError} />}
    {itinerary.loading && <Typography.Text>Đang tải lịch trình…</Typography.Text>}
    {itinerary.data?.length === 0 && <Empty description="Tour chưa có lịch trình theo ngày." image={Empty.PRESENTED_IMAGE_SIMPLE} />}
    {itinerary.data?.map(row => <CheckpointForm key={`${row.id}:${row.actualTime ?? ''}`} row={row} editable={editable}
      save={async (status, note) => {
        setSaveError('');
        try {
          const response = await departureManifest.progress(id, row.id, status, note);
          if (response.code !== 1000) throw new Error(response.message || 'Chưa lưu được tiến độ.');
          await itinerary.refresh();
        } catch (failure) {
          setSaveError(errorMessage(failure, 'Chưa lưu được tiến độ.'));
        }
      }} />)}
  </div>;
}

export function TripReportPanel({ id, report, manifest, isAdmin, onReport }: {
  id: number; report?: TripReport | null; manifest: Manifest; isAdmin: boolean; onReport: (report: TripReport) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [form] = Form.useForm<Pick<TripReport, 'summary' | 'incidentNote' | 'handoverNote'>>();
  const mutable = manifest.phase === 'IN_PROGRESS' || manifest.phase === 'AWAITING_CLOSEOUT';
  const terminal = manifest.passengers.every(p => p.status !== 'EXPECTED' && p.status !== 'BOARDED');
  const editable = !isAdmin && mutable && report?.status !== 'SUBMITTED' && report?.status !== 'APPROVED';

  async function act(callback: () => ReturnType<typeof departureManifest.saveReport>) {
    setBusy(true);
    setError('');
    try {
      const response = await callback();
      if (response.code !== 1000 || !response.result) throw new Error(response.message || 'Chưa lưu được báo cáo.');
      onReport(response.result);
      setComment('');
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa lưu được báo cáo.'));
    } finally { setBusy(false); }
  }

  return <Space direction="vertical" className="w-full" size="middle">
    {error && <Alert type="error" showIcon message={error} />}
    <Typography.Text strong>{report ? reportLabels[report.status] : editable ? 'Lập báo cáo chuyến' : null}</Typography.Text>
    {!report && !editable && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hướng dẫn viên chưa nộp báo cáo chuyến đi" />}
    {report?.adminComment && <Alert showIcon type="info" message={report.adminComment} />}
    {editable ? <Form form={form} layout="vertical" initialValues={report ?? {}}>
      <Form.Item name="summary" label="Tổng kết" rules={[{ required: true, whitespace: true }]}><Input.TextArea maxLength={2000} /></Form.Item>
      <Form.Item name="incidentNote" label="Sự cố"><Input.TextArea maxLength={1000} /></Form.Item>
      <Form.Item name="handoverNote" label="Bàn giao khách và tài sản"><Input.TextArea maxLength={1000} /></Form.Item>
      <Space wrap>
        <Button loading={busy} onClick={() => void form.validateFields().then(values =>
          act(() => departureManifest.saveReport(id, { ...values, submit: false }))).catch(() => {})}>Lưu nháp</Button>
        <Button type="primary" loading={busy} disabled={manifest.phase !== 'AWAITING_CLOSEOUT' || !terminal}
          onClick={() => void form.validateFields().then(values => {
            if (!values.handoverNote?.trim()) {
              form.setFields([{ name: 'handoverNote', errors: ['Nhập nội dung bàn giao trước khi nộp.'] }]);
              return;
            }
            return act(() => departureManifest.saveReport(id, { ...values, submit: true }));
          }).catch(() => {})}>Nộp báo cáo</Button>
      </Space>
      {!terminal && <Typography.Paragraph type="secondary">Xử lý toàn bộ khách trước khi nộp.</Typography.Paragraph>}
    </Form> : report && <div className="space-y-2">
      <p className="whitespace-pre-wrap">{report.summary}</p>
      {report.incidentNote && <p className="whitespace-pre-wrap">Sự cố · {report.incidentNote}</p>}
      {report.handoverNote && <p className="whitespace-pre-wrap">Bàn giao · {report.handoverNote}</p>}
    </div>}
    {isAdmin && report?.status === 'SUBMITTED' && manifest.phase !== 'COMPLETED' && <>
      <Input.TextArea aria-label="Nhận xét báo cáo" placeholder="Nhận xét hoặc nội dung cần bổ sung"
        value={comment} maxLength={500} onChange={event => setComment(event.target.value)} />
      <Space wrap>
        <Button type="primary" loading={busy} onClick={() => void act(() => departureManifest.review(id, true, comment.trim()))}>Duyệt báo cáo</Button>
        <Button disabled={busy || !comment.trim()} onClick={() => void act(() => departureManifest.review(id, false, comment.trim()))}>Yêu cầu bổ sung</Button>
      </Space>
    </>}
  </Space>;
}
