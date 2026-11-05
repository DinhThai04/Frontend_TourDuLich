import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AiClient } from '@/services/aiServices';
import { API_BASE_URL } from '@/api/axios';
import type { AiPolicyDocument } from '@/types/ai';
import './policies.css';

const status = {
  SUPPORTED: 'Đang hỗ trợ',
  PARTIAL: 'Hỗ trợ một phần',
  NOT_IMPLEMENTED: 'Chưa triển khai',
};
export default function PoliciesPage() {
  const [document, setDocument] = useState<AiPolicyDocument | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const { hash } = useLocation();
  useEffect(() => {
    const abort = new AbortController();
    setFailed(false);
    const client = new AiClient(API_BASE_URL);
    void client
      .policies(abort.signal)
      .then(setDocument)
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      });
    return () => abort.abort();
  }, [attempt]);
  useEffect(() => {
    if (document && /^#P\d{2}$/.test(hash))
      window.document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [document, hash]);
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const entries =
    document?.entries.filter((e) =>
      normalize(`${e.title} ${e.text}`).includes(normalize(query.trim()))
    ) || [];
  return (
    <main className="sgu-policies">
      <nav aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <span> / Chính sách</span>
      </nav>
      <header className="sgu-policy-heading">
        <span className="sgu-policy-eyebrow">SGU TOUR · THÔNG TIN ĐẶT TOUR</span>
        <h1>Chính sách & câu hỏi thường gặp</h1>
        <p>Hiểu rõ cách giữ chỗ, thanh toán và chuẩn bị cho chuyến đi của bạn.</p>
      </header>
      {failed ? (
        <div role="alert" className="sgu-policy-notice">
          Chưa tải được chính sách. Vui lòng thử lại sau.
          <button onClick={() => setAttempt((a) => a + 1)}>Thử lại</button>
        </div>
      ) : !document ? (
        <p role="status">Đang tải chính sách…</p>
      ) : (
        <>
          <div className="sgu-policy-notice">
            <strong>Phạm vi áp dụng</strong>
            <p>{document.scope}</p>
            <small>
              Phiên bản {document.version} · Hiệu lực{' '}
              {document.effectiveDate.split('-').reverse().join('/')}
            </small>
          </div>
          <div className="sgu-policy-tools">
            <label htmlFor="policy-search">Tìm trong chính sách</label>
            <input
              id="policy-search"
              type="search"
              placeholder="Giữ chỗ, thanh toán, trẻ em…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Link to="/profile">Kiểm tra đơn đặt tour của tôi →</Link>
          </div>
          <div className="sgu-policy-grid">
            <aside aria-label="Mục lục chính sách">
              <h2>Mục lục</h2>
              {entries.map((e) => (
                <a key={e.key} href={`#${e.key}`}>
                  {e.title}
                </a>
              ))}
            </aside>
            <div>
              {entries.map((e) => (
                <section id={e.key} key={e.key} className="sgu-policy-item">
                  <div className="sgu-policy-item-heading">
                    <span className={`sgu-policy-status ${e.status.toLowerCase()}`}>
                      {status[e.status]}
                    </span>
                    <small>{e.key}</small>
                  </div>
                  <h2>{e.title}</h2>
                  <p>{e.text}</p>
                </section>
              ))}
              {!entries.length && (
                <p>
                  Không tìm thấy mục phù hợp. Hiện chưa có chính sách này; bạn có thể liên hệ để
                  được làm rõ.
                </p>
              )}
            </div>
          </div>
          <div className="sgu-policy-contact">
            <h2>Cần kiểm tra một booking cụ thể?</h2>
            <p>
              Đăng nhập và hỏi trợ lý bằng mã booking hoặc tên tour đã đặt. Thời gian còn lại được
              tính từ hạn của đúng đơn khi kiểm tra.
            </p>
            <Link to="/profile">Mở lịch sử đặt tour</Link> ·{' '}
            <a href="mailto:danhcong6205@gmail.com">Liên hệ SGU Tour</a>
          </div>
        </>
      )}
    </main>
  );
}
