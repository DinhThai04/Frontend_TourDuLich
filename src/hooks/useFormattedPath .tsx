import { useLocation } from "react-router-dom";

const useFormattedPath = () => {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean); // ["du-lich-trong-nuoc", "tay-nam-bo"]

  // Hàm format: tách theo dấu '-', viết hoa chữ đầu mỗi từ
  const formatPart = (str: string) =>
    str
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // Trả về mảng các phần đã format
  return pathParts.map(formatPart);
};

export default useFormattedPath;
