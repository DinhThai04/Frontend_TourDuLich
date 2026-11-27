import type { ThemeConfig } from 'antd';

export const DESIGN_TOKENS = {
  primary: '#1F7A6E',
  primaryHover: '#176258',
  primaryDark: '#134E48',
  primaryLight: '#E6F4F1',
  surfaceAlt: '#F3F8F6',
  accent: '#F26B4F',
  accentText: '#C2410C',
  accentLight: '#FFEDE5',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  pageBg: '#F8FAFA',
  cardBg: '#FFFFFF',
  star: '#F59E0B',
} as const;

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: DESIGN_TOKENS.primary,
    colorPrimaryHover: DESIGN_TOKENS.primaryHover,
    colorPrimaryActive: DESIGN_TOKENS.primaryDark,
    colorLink: DESIGN_TOKENS.primary,
    colorLinkHover: DESIGN_TOKENS.primaryHover,
    colorText: DESIGN_TOKENS.text,
    colorTextSecondary: DESIGN_TOKENS.textSecondary,
    colorTextPlaceholder: DESIGN_TOKENS.textSecondary,
    colorBgLayout: DESIGN_TOKENS.pageBg,
    colorBgContainer: DESIGN_TOKENS.cardBg,
    colorBorder: DESIGN_TOKENS.border,
    colorBorderSecondary: DESIGN_TOKENS.border,
    borderRadius: 10,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    controlHeight: 40,
    fontSize: 14,
  },
  components: {
    Menu: {
      itemSelectedBg: DESIGN_TOKENS.primaryLight,
      itemSelectedColor: DESIGN_TOKENS.primaryDark,
      itemHoverBg: DESIGN_TOKENS.surfaceAlt,
      itemActiveBg: DESIGN_TOKENS.primaryLight,
      itemBorderRadius: 10,
    },
    Table: {
      headerBg: DESIGN_TOKENS.pageBg,
      headerColor: DESIGN_TOKENS.primaryDark,
      rowHoverBg: DESIGN_TOKENS.surfaceAlt,
      borderColor: DESIGN_TOKENS.border,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Button: {
      borderRadius: 10,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 40,
    },
    DatePicker: {
      borderRadius: 10,
      controlHeight: 40,
    },
  },
};
