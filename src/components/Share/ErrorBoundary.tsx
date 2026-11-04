import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Chặn lỗi render để cả trang trắng không thay thế toàn bộ ứng dụng. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#21776d' }}>
            Đã xảy ra lỗi ngoài mong muốn
          </h1>
          <p style={{ color: '#555', maxWidth: 480 }}>
            Rất tiếc, trang này không thể hiển thị. Vui lòng tải lại trang để tiếp tục. Nếu lỗi vẫn
            còn, hãy liên hệ đội ngũ SGU Tour.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: 'none',
              background: '#7BBCB0',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
