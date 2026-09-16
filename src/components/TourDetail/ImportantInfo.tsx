import { Row, Col, Collapse, Typography, theme } from "antd";
import type { CollapseProps } from "antd";
import type { CSSProperties } from "react";

const { Title } = Typography;

const pStyle: React.CSSProperties = { 
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 2
};

const getItems = (panelStyle: CSSProperties): CollapseProps['items'] => [
  {
    key: "1",
    label: <span style={{ fontWeight: 600 }}>Giá tour bao gồm</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>- Xe tham quan (15, 25, 35, 45 chỗ tùy theo số lượng khách) theo chương trình</p>
        <p style={pStyle}>- Vé máy bay khứ hồi</p>
        <p style={pStyle}>- Khách sạn theo tiêu chuẩn 2 khách/phòng hoặc 3 khách/phòng</p>
        <p style={pStyle}>- Các bữa ăn theo chương trình</p>
        <p style={pStyle}>- Vé tham quan theo chương trình</p>
        <p style={pStyle}>- Hướng dẫn viên tiếng Việt nối tuyến</p>
        <p style={pStyle}>- Bảo hiểm du lịch với mức bồi thường cao nhất 120.000.000đ/vụ</p>
        <p style={pStyle}>- Nón Vietravel + Nước suối + Khăn lạnh</p>
        <p style={pStyle}>- Thuế VAT</p>
      </div>
    ),

    style: panelStyle,
  },
  {
    key: "2",
    label: <span style={{ fontWeight: 600 }}>Giá tour không bao gồm</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>- Chi phí cá nhân: ăn uống ngoài chương trình, giặt ủi, chi phí hủy đổi hành trình và nâng hạng chuyến bay, hành lý quá cước, phụ thu phòng đơn,…</p>
        <p style={pStyle}>- Tham quan ngoài chương trình : đền Ngọc Sơn, Sunwolrd Hạ Long, thuyền kayak, Bảo Tháp, cáp treo Yên Tử,…</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "3",
    label: <span style={{ fontWeight: 600 }}>Lưu ý giá trẻ em</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>- Trẻ em dưới 5 tuổi: không thu phí dịch vụ, bố mẹ tự lo cho bé và thanh toán các chi phí phát sinh (đối với các dịch vụ tính phí theo chiều cao…). Hai người lớn chỉ được kèm 1 trẻ em dưới 5 tuổi, trẻ em thứ 2 sẽ đóng phí theo qui định dành cho độ tuổi từ 5 đến dưới 12 tuổi và phụ thu phòng đơn. Vé máy bay, tàu hỏa, phương tiện vận chuyển công cộng mua vé theo qui định của các đơn vị vận chuyển.</p>
        <p style={pStyle}>- Trẻ em từ 5 tuổi đến dưới 12 tuổi: 85% giá tour người lớn (không có chế độ giường riêng). Hai người lớn chỉ được kèm 1 trẻ em từ 5 - dưới 12 tuổi, em thứ hai trở lên phải mua 1 suất giường đơn.</p>
        <p style={pStyle}>- Trẻ em từ 12 tuổi trở lên: mua một vé như người lớn</p>
        <p style={pStyle}>- Vé máy bay phải mua theo quy định của từng hãng hàng không</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "4",
    label: <span style={{ fontWeight: 600 }}>Điều kiện thanh toán</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>- Khi đăng ký đặt cọc 50% số tiền tour</p>
        <p style={pStyle}>- Số tiền còn lại thanh toán hết trước ngày khởi hành 7-10 ngày (áp dụng tour ngày thường), trước ngày khởi hành 20-25 ngày (áp dụng tour lễ tết)</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "5",
    label: <span style={{ fontWeight: 600 }}>Điều kiện đăng ký</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8, maxHeight: 400, overflowY: "auto", }}>
        <p style={pStyle}>- Đối với Khách Quốc tịch Việt Nam: Khi đi tour Trẻ em từ 14 tuổi trở lên và người lớn cần đem theo CCCD/Passport (Hộ chiếu) bản chính còn hạn sử dụng, hình ảnh rõ (CCCD có thời hạn sử dụng không quá 25 năm, tính từ ngày cấp)/ Giấy khai sinh bản chính (trẻ em dưới 14 tuổi), trẻ em trên 14 tuổi bắt buộc phải có CCCD hoặc Passport làm thủ tục lên máy bay.</p>
        <p style={pStyle}>- Đối với khách Nước ngoài/Việt Kiều: Khi đi tour phải mang theo đầy đủ Passport (Hộ Chiếu) bản chính còn hạn sử dụng hoặc thẻ xanh kèm theo Visa và giấy tái xuất nhập Việt Nam làm thủ tục lên máy bay.</p>
        <p style={pStyle}>- Khi đăng ký tour Quý khách vui lòng mang theo CCCD/Passport bản chính hoặc cung cấp tên chính xác đầy đủ, đúng từng ký tự trên CCCD/ Passport (Hộ chiếu)/Giấy khai sinh (trẻ em dưới 14 tuổi) theo thứ tự: Họ/tên lót/tên. Quý khách khi đăng ký cung cấp tên theo giấy tờ tùy thân nào, khi đi tour phải mang theo giấy tờ tùy thân đó theo qui định hãng hàng không</p>
        <p style={pStyle}>- Trong trường hợp Quý khách cung cấp tên sai, đến trễ giờ bay, vui lòng chịu phí đổi vé hoặc mua lại vé mới theo quy định của Hãng Hàng Không (nếu chuyến bay còn chỗ).</p>
        <p style={pStyle}>- Trong trường hợp Quý khách bay hãng hàng không Vietjet và Jetstar, vé không hoàn, không dời, đổi, huỷ, sai tên mất 100% theo qui định hãng hàng không. Giá vé máy bay trẻ em bằng 100% người lớn.</p>
        <p style={pStyle}>- Trong trường hợp Quý khách bay hãng hàng không Vietnam Air. Vé máy bay khuyến mãi không hoàn, không đổi, hủy, sai tên mất 100% theo qui định hãng hàng không. vé Vietnam Airlines không bay chặng đi, tự động hủy chặng về. Giá vé máy bay trẻ em bằng 75% vé người lớn.</p>
        <p style={pStyle}>- Giá vé, giờ bay có thể thay đổi theo Hãng Hàng Không (Vietnam Airlines, Vietjet, Vietravel Airlines, Bamboo Airways,…) không thể báo trước.</p>
        <p style={pStyle}>- Do các chuyến bay phụ thuộc vào các hãng Hàng Không nên trong một số trường hợp giờ bay có thể thay đổi mà không được báo trước. Tùy vào tình hình thực tế, Chương trình và điểm tham quan có thể linh động thay đổi thứ tự các điểm phù hợp điều kiện giờ bay và thời tiết thực tế. Vietravel sẽ không chịu trách nhiệm bảo đảm các điểm tham quan trong trường hợp:</p>
        <p style={pStyle}>o Xảy ra thiên tai: bão lụt, hạn hán, động đất…</p>
        <p style={pStyle}>o Sự cố về an ninh: dịch bệnh, khủng bố, biểu tình</p>
        <p style={pStyle}>o Sự cố về hàng không: trục trặc kỹ thuật, an ninh, dời, hủy, hoãn chuyến bay.</p>
        <p style={pStyle}>- Nếu những trường hợp trên xảy ra, Vietravel sẽ xem xét để hoàn trả chi phí không tham quan cho khách trong điều kiện có thể (sau khi đã trừ lại các dịch vụ đã thực hiện… và không chịu trách nhiệm bồi thường thêm bất kỳ chi phí nào khác).</p>
        <p style={pStyle}>- Sau khi Quý khách đã làm thủ tục Hàng Không và nhận thẻ lên máy bay, đề nghị Quý khách giữ cẩn thận và lưu ý lên máy bay đúng giờ. Vietravel không chịu trách nhiệm trong trường hợp khách làm mất thẻ lên máy bay và không lên máy bay đúng theo giờ quy định của Hàng Không.</p>
        <p style={pStyle}>- Giờ nhận phòng khách sạn: sau 14:00 giờ và trả phòng trước 12:00 giờ</p>
        <p style={pStyle}>- Phòng khách sạn/resort có thể xảy ra trường hợp phòng không gần nhau, không cùng tầng, loại phòng một giường đôi hoặc hai giường đơn không theo yêu cầu, tùy tình hình thực tế từng khách sạn/Resort.</p>
        <p style={pStyle}>- Trường hợp quý khách tham gia tour 01 khách, bắt buộc đóng thêm tiền phụ thu phòng đơn để ở riêng 01 phòng. Trường hợp trong đoàn cũng có khách đi 01 mình, cùng giới tính và có nhu cầu muốn ghép cùng phòng với quý khách thì Vietravel sẽ hoàn lại tiền phụ thu phòng đơn cho quý khách.</p>
        <p style={pStyle}>- Trường hợp quý khách đi nhóm 03 khách, Vietravel sẽ cung cấp 01 phòng dành cho 03 khách là 01 giường lớn 1m6 và 01 giường phụ di động từ 0.8 - 1,2m (extrabed) hoặc 01 nệm đơn tùy từng khách sạn/Resort. Trong trường quý khách có nhu cầu ở riêng, vui lòng đóng thêm tiền phụ thu phòng đơn theo qui định</p>
        <p style={pStyle}>- Thông tin hành lý khi đi tour : Xách tay dưới 7kg/1khách - Kích thước không quá: 56cm x 36cm x 23 cm, chất lỏng với thể tích không quá 100ml. Ký gửi: 20kg/1khách - Kích thước không quá: 119cm x 119cm x 81cm. Các vật phẩm không được chấp nhận dưới dạng hành lý ký gởi hoặc vận chuyển trong hành lý theo qui định hàng không</p>
        <p style={pStyle}>- Thông tin tập trung : Tại sân bay Tân Sơn Nhất, Ga đi trong nước, trước giờ bay 2 tiếng (áp dụng ngày thường), trước 2 tiếng 30 phút (áp dụng lễ tết).</p>
        <p style={pStyle}>- Quý khách dưới 18 tuổi khi đi tour phải có Bố Mẹ hoặc người thân trên 18 tuổi đi cùng. Trường hợp đi một mình phải được Bố Mẹ ủy quyền (có xác nhận của chính quyền địa phương) cho Vietravel</p>
        <p style={pStyle}>- Khách nữ từ 55 tuổi trở lên và khách nam từ 60 trở lên: nên có người thân dưới 55 tuổi (đầy đủ sức khỏe) đi cùng. Riêng khách từ 70 tuổi trở lên: Bắt buộc phải có người thân dưới 55 tuổi (đầy đủ sức khỏe) đi cùng và nộp kèm giấy khám sức khỏe, có xác nhận đủ sức khỏe để đi du lịch của bác sĩ + Giấy cam kết sức khỏe theo mẫu qui định của công ty. Vì lý do an toàn Quý khách hạn chế và không nhận khách từ 80 tuổi trở lên. Khách trên 80 tuổi không có chế độ bảo hiểm.</p>
        <p style={pStyle}>- Quý khách đang mang thai vui lòng báo cho nhân viên bán tour ngay tại thời điểm đăng ký. Lưu ý phải có ý kiến của bác sĩ trước khi đi tour. Cam kết tự chịu trách nhiệm về sức khỏe của mình và thai nhi trong suốt thời gian tham gia chương trình du lịch.</p>
        <p style={pStyle}>- Quý khách có nhu cầu cần xuất hóa đơn vui lòng cung cấp thông tin xuất hóa đơn cho nhân viên bán tour khi ngay khi đăng ký, không nhận xuất hóa đơn sau khi tour đã kết thúc.</p>
        <p style={pStyle}>- Quý khách vui lòng tham khảo kỹ các Điều Kiện Bán Vé trước khi đăng ký chuyến du lịch. Trong trường hợp không trực tiếp đăng ký, nhờ người thân đăng ký hộ vui lòng cập nhật thông tin từ người đăng ký.</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "6",
    label: <span style={{ fontWeight: 600 }}>Lưu ý về chuyển hoặc hủy tour</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>Sau khi đóng tiền, nếu Quý khách muốn chuyển/huỷ tour xin vui lòng mang Vé Du Lịch đến văn phòng đăng ký tour để làm thủ tục chuyển/huỷ tour và chịu mất phí theo quy định của Vietravel. Không giải quyết các trường hợp liên hệ chuyển/huỷ tour qua điện thoại.</p>
        <p style={pStyle}>- Thời gian hủy chuyến du lịch được tính cho ngày làm việc, không tính thứ 7, Chủ Nhật và các ngày Lễ, Tết.</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "7",
    label: <span style={{ fontWeight: 600 }}>Các điều kiện hủy tour đối với ngày thường</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>- Được chuyển sang các tuyến du lịch khác trước ngày khởi hành 20 ngày: Không mất chi phí.</p>
        <p style={pStyle}>- Nếu hủy hoặc chuyển sang các chuyến du lịch khác ngay sau khi đăng ký từ 15-19 ngày trước ngày khởi hành: Chi phí hủy tour: 50% tiền cọc tour.</p>
        <p style={pStyle}>- Nếu hủy hoặc chuyển sang các chuyến du lịch khác từ 12-14 ngày trước ngày khởi hành: Chi phí hủy tour: 100% tiền cọc tour.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng từ 08-11 ngày trước ngày khởi hành: Chi phí hủy tour: 50% trên giá tour du lịch.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng từ 05-07 ngày trước ngày khởi hành: Chi phí hủy tour: 70% trên giá tour du lịch.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng từ 02-04 ngày trước ngày khởi hành: Chi phí hủy tour: 90% trên giá vé du lịch.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng 1 ngày trước ngày khởi hành : Chi phí hủy tour: 100% trên giá vé du lịch.</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "8",
    label: <span style={{ fontWeight: 600 }}>Các điều kiện hủy tour đối với ngày lễ, Tết</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>- Được chuyển sang các tuyến du lịch khác trước ngày khởi hành 30 ngày : Không mất chi phí.</p>
        <p style={pStyle}>- Nếu hủy hoặc chuyển sang các chuyến du lịch khác ngay sau khi đăng ký từ 25-29 ngày trước ngày khởi hành: Chi phí hủy tour: 50% tiền cọc tour.</p>
        <p style={pStyle}>- Nếu hủy hoặc chuyển sang các chuyến du lịch khác từ 20-24 ngày trước ngày khởi hành: Chi phí hủy tour: 100% tiền cọc tour.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng từ 17-19 ngày trước ngày khởi hành: Chi phí hủy tour: 50% trên giá tour du lịch.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng từ 08-16 ngày trước ngày khởi hành: Chi phí hủy tour: 70% trên giá tour du lịch.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng từ 02-07 ngày trước ngày khởi hành: Chi phí hủy tour: 90% trên giá vé du lịch.</p>
        <p style={pStyle}>- Nếu hủy chuyến du lịch trong vòng 1 ngày trước ngày khởi hành : Chi phí hủy tour: 100% trên giá vé du lịch.</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "9",
    label: <span style={{ fontWeight: 600 }}>Trường hợp bất khả kháng</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>Nếu chương trình du lịch bị hủy bỏ hoặc thay đổi bởi một trong hai bên vì lý do bất khả kháng (hỏa hoạn, thời tiết, tai nạn, thiên tai, chiến tranh, dịch bệnh, hoãn, dời, và hủy chuyến hoặc thay đổi khác của các phương tiện vận chuyển công cộng hoặc các sự việc bất khả kháng khác theo quy định pháp luật…), thì hai bên sẽ không chịu bất kỳ nghĩa vụ bồi hoàn các tổn thất đã xảy ra và không chịu bất kỳ trách nhiệm pháp lý nào. Tuy nhiên mỗi bên có trách nhiệm cố gắng tối đa để giúp đỡ bên bị thiệt hại nhằm giảm thiểu các tổn thất gây ra vì lý do bất khả kháng.</p>
      </div>
    ),
    style: panelStyle,
  },
  {
    key: "10",
    label: <span style={{ fontWeight: 600 }}>Liên hệ</span>,
    children: (
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 8 }}>
        <p style={pStyle}>Tổng đài Vietravel 1800-646-888 (08:00 - 23:00)

Trụ sở Vietravel 190 Pasteur, Phường Xuân Hoà, Tp Hồ Chí Minh</p>
      </div>
    ),
    style: panelStyle,
  },
];

const ImportantInfo: React.FC = () => {
  const { token } = theme.useToken();

  const panelStyle: React.CSSProperties = {
    marginBottom: 10,
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: "none",
  };



  // Tách 10 items thành 2 cột
  const firstColumnItems = (getItems(panelStyle) || []).slice(0, 5);
  const secondColumnItems = (getItems(panelStyle) || []).slice(5);


  return (
    <div style={{ marginTop: 40 }}>
      <Title level={4} style={{ textAlign: "center", marginTop: 38, marginBottom: 18, fontWeight: 700 }}>
        NHỮNG THÔNG TIN CẦN LƯU Ý
      </Title>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Collapse
            items={firstColumnItems}
            expandIconPosition="end"
            bordered={false}
            style={{ background: token.colorBgContainer }}
            className="custom-collapse"
          />
        </Col>
        <Col xs={24} md={12}>
          <Collapse
            items={secondColumnItems}
            expandIconPosition="end"
            bordered={false}
            style={{ background: token.colorBgContainer }}
            className="custom-collapse"
          />
        </Col>
      </Row>
    </div>
  );
};

export default ImportantInfo;