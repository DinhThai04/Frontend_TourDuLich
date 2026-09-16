export const formatCurrencyVND = (amount: number): string => {
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

export const formatDatetime = (datetimeStr: string): string => {
  const date = new Date(datetimeStr);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const parseDate = (dateStr: string): Date | null => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}