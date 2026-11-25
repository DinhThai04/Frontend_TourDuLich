import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#21776d',
    colorLink: '#21776d',
    colorBgLayout: '#f6f8f7',
    colorBorderSecondary: '#e5ece9',
    borderRadius: 10,
    fontFamily: 'Inter, system-ui, sans-serif',
    controlHeight: 40,
  },
  components: {
    Menu: {
      itemSelectedBg: '#eaf3f0',
      itemSelectedColor: '#155e54',
      itemHoverBg: '#f3f7f5',
      itemActiveBg: '#dfeee9',
      itemBorderRadius: 8,
    },
    Table: {
      headerBg: '#f8faf9',
      headerColor: '#1f3530',
      rowHoverBg: '#f4f8f6',
      borderColor: '#e9efec',
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
};
