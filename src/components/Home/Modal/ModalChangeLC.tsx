import { Modal, Typography, Divider } from 'antd';
import React from 'react';
import vnFlag from '@/assets/images/vi.png';
import usFlag from '@/assets/images/en.png';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { setCurrency, setLanguage } from '@/store/slices/lcSlice';

type Props = {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
};

const ModalChangeLC: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  const dispatch = useAppDispatch();

  const { currency, language } = useAppSelector((state: RootState) => state.lc);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currency || 'VNĐ');
  const [selectedLang, setSelectedLang] = React.useState<string>(language || 'VN');

  const handleOk = () => {
    setIsOpen(false);
    dispatch(setCurrency(selectedCurrency));
    dispatch(setLanguage(selectedLang));
  };

  const handleCancel = () => setIsOpen(false);

  return (
    <Modal
      title="Chọn Ngôn ngữ & Tiền tệ"
      open={isOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Lưu"
      cancelText="Hủy"
    >
      <div className="flex items-center gap-[16px]">
        {/* Tiền tệ */}
        <div className="flex text-center flex-col">
          <Typography.Text strong>Tiền tệ</Typography.Text>
          <div className="mt-[8px] flex justify-center gap-[8px]">
            <div
              className={`flex items-center gap-[8px] px-[12px] py-[8px] 
                rounded-[4px] cursor-pointer hover:bg-[#f0f0f0]
                ${
                  selectedCurrency === 'VNĐ' ? 'bg-[#e6f4ff] text-[#1677ff]' : 'hover:bg-[#f0f0f0]'
                }`}
              onClick={() => setSelectedCurrency('VNĐ')}
            >
              <span>₫</span>
              <span>VNĐ</span>
            </div>
            <div
              className={`flex items-center gap-[8px] px-[12px] py-[8px] 
                rounded-[4px] cursor-pointer hover:bg-[#f0f0f0]
                ${
                  selectedCurrency === 'USD' ? 'bg-[#e6f4ff] text-[#1677ff]' : 'hover:bg-[#f0f0f0]'
                }`}
              onClick={() => setSelectedCurrency('USD')}
            >
              <span>$</span>
              <span>USD</span>
            </div>
          </div>
        </div>

        <Divider type="vertical" style={{ height: 80 }} />

        {/* Ngôn ngữ */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Typography.Text strong>Ngôn ngữ</Typography.Text>
          <div className="mt-[8px] flex justify-center gap-[8px]">
            <div
              className={`flex items-center gap-[8px] px-[12px] py-[8px] 
                rounded-[4px] cursor-pointer hover:bg-[#f0f0f0]
                ${selectedLang === 'VN' ? 'bg-[#e6f4ff] text-[#1677ff]' : 'hover:bg-[#f0f0f0]'}`}
              onClick={() => setSelectedLang('VN')}
            >
              <img src={vnFlag} alt="VN" style={{ width: 20, height: 14 }} />
              <span>VN</span>
            </div>
            <div
              className={`flex items-center gap-[8px] px-[12px] py-[8px] 
                rounded-[4px] cursor-pointer hover:bg-[#f0f0f0]
                ${selectedLang === 'ENG' ? 'bg-[#e6f4ff] text-[#1677ff]' : 'hover:bg-[#f0f0f0]'}`}
              onClick={() => setSelectedLang('ENG')}
            >
              <img src={usFlag} alt="ENG" style={{ width: 20, height: 14 }} />
              <span>ENG</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ModalChangeLC;
