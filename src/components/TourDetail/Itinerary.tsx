import { getItineraryByTourId } from '@/services/tourServices';
import type { IItinerary } from '@/types/Tour';
import { Collapse, theme, Typography } from 'antd';
import { useEffect, useState } from 'react';

const { Title } = Typography;
const { Panel } = Collapse;

interface ItineraryProps {
  tourId?: number | null;
}

const Itinerary: React.FC<ItineraryProps> = ({ tourId }) => {
  const { token } = theme.useToken();

  const panelStyle: React.CSSProperties = {
    marginBottom: 10,
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: 'none',
  };

  const [dataItinerary, setDataItinerary] = useState<IItinerary[]>([]);

  const fechDataItineraryByTourId = async () => {
    const res = await getItineraryByTourId(1);
    setDataItinerary(res.result); // sửa để build
  };

  useEffect(() => {
    fechDataItineraryByTourId();
  }, [tourId]);

  return (
    <div>
      <Title
        level={4}
        style={{ textAlign: 'center', marginTop: 38, marginBottom: 18, fontWeight: 700 }}
      >
        LỊCH TRÌNH
      </Title>
      <Collapse
        expandIconPosition="end"
        bordered={false}
        style={{ background: token.colorBgContainer }}
        className="custom-collapse"
      >
        {dataItinerary.map((item) => (
          <Panel
            header={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 650, fontSize: 13 }}>
                  Ngày {item.dayNumber}: {item.title}
                </span>
                <span style={{ fontWeight: 500, fontSize: 12, color: '#555' }}>{item.meal}</span>
              </div>
            }
            key={item.id}
            style={panelStyle}
          >
            <div style={{ position: 'relative', paddingLeft: 12 }}>
              <div
                style={{
                  borderLeft: '1px dashed #1765AC',
                  borderTop: '1px solid rgba(0,0,0,0.15)',
                  paddingLeft: 12,
                  position: 'relative',
                }}
              >
                <p style={{ marginTop: 10 }}>{item.description}</p>

                {/* Hai chấm tròn */}
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: -3,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#1677ff',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: -3,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#1677ff',
                  }}
                />
              </div>
            </div>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

export default Itinerary;
