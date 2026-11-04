import { useEffect, useState } from 'react';
import { Alert, Button, Collapse, Space, Spin, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { AiClient } from '@/services/aiServices';
import { API_BASE_URL } from '@/api/axios';
import type { AiPolicyDocument } from '@/types/ai';

const labels = { SUPPORTED: 'Đang hỗ trợ', PARTIAL: 'Hỗ trợ một phần', NOT_IMPLEMENTED: 'Chưa triển khai' };

/** Same published source as the policy page and chatbot. */
export default function ImportantInfo() {
  const [document, setDocument] = useState<AiPolicyDocument | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setFailed(false);
    void new AiClient(API_BASE_URL)
      .policies(abort.signal)
      .then(value => { if (!abort.signal.aborted) setDocument(value); })
      .catch(() => { if (!abort.signal.aborted) setFailed(true); });
    return () => abort.abort();
  }, [attempt]);
  return <section style={{ marginTop: 32 }} aria-label="Chính sách SGU Tour">
    <Typography.Title level={4}>Thông tin cần biết trước khi đặt tour</Typography.Title>
    {failed ? <Alert type="warning" showIcon message="Chưa tải được chính sách SGU Tour. Vui lòng thử lại trước khi đặt."
      action={<Button onClick={() => setAttempt(value => value + 1)}>Thử lại</Button>} />
      : !document ? <Spin tip="Đang tải chính sách"><div style={{ minHeight: 80 }} /></Spin>
      : <>
        <Typography.Paragraph>{document.scope}</Typography.Paragraph>
        <Collapse items={document.entries.map(entry => ({ key: entry.key,
          label: <Space><span>{entry.title}</span><Tag>{labels[entry.status]}</Tag></Space>,
          children: <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>{entry.text}</Typography.Paragraph>,
        }))} />
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>Phiên bản {document.version}</Typography.Paragraph>
      </>}
    <Space wrap style={{ marginTop: 12 }}><Link to="/policies">Xem toàn bộ chính sách</Link>
      <a href="mailto:danhcong6205@gmail.com">Liên hệ SGU Tour</a></Space>
  </section>;
}
