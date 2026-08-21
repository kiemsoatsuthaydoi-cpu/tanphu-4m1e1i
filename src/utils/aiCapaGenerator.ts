import { QualityReport, CapaData } from "../types";
import { formatNameCapitalized } from "./branchHelpers";

/**
 * Clean & format structured line breaks
 */
function formatAutoLineBreaks(str: string | undefined | null): string {
  if (!str) return "";
  return str.trim();
}

/**
 * Trích xuất từ khóa và bản chất lỗi từ nội dung sự cố
 */
function analyzeIncidentNature(content: string, notes: string, category: string): {
  coreIssue: string;
  factorType: string;
  immediateActions: string[];
  rootCauses5Why: string[];
  preventiveActions: string[];
  traceabilitySteps: string[];
} {
  const fullText = `${content} ${notes}`.toLowerCase();
  
  // Xác định nhóm 4M1E1I
  let factorType = "Con người (Man)";
  if (/máy|khuôn|dao|nhiệt|áp suất|thiết bị|điện|vòi|motor|băng tải/i.test(fullText) || category?.includes("Machine")) {
    factorType = "Máy móc & Thiết bị (Machine)";
  } else if (/nhựa|hạt|phụ gia|màu|bao bì|thùng|nguyên liệu|keo|màng/i.test(fullText) || category?.includes("Material")) {
    factorType = "Nguyên vật liệu (Material)";
  } else if (/thao tác|quy trình|thông số|hướng dẫn|sop|cài đặt|tốc độ|chu kỳ/i.test(fullText) || category?.includes("Method")) {
    factorType = "Phương pháp & Quy trình (Method)";
  } else if (/bụi|ẩm|nhiệt độ phòng|ánh sáng|vệ sinh|5s|mưa|nước/i.test(fullText) || category?.includes("Environment")) {
    factorType = "Môi trường sản xuất (Environment)";
  } else if (/thông tin|bản vẽ|nhầm|tiêu chuẩn|tem|nhãn|lệnh/i.test(fullText) || category?.includes("Information")) {
    factorType = "Thông tin & Truyền đạt (Information)";
  }

  // Phân tích loại lỗi
  const isDimensional = /kích thước|kích cỡ|dày|mỏng|cong|vênh|lệch|hụt|dài|ngắn/i.test(fullText);
  const isVisual = /bavia|ba vớ|xước|trầy|ố|đen|cháy|loang|bọt|vết|dơ|bẩn|nứt|vỡ/i.test(fullText);
  const isColor = /sai màu|lệch màu|đậm|nhạt|đốm màu/i.test(fullText);
  const isPackaging = /tem|nhãn|đóng gói|thùng|pallet|nhầm mã|sai số lượng/i.test(fullText);
  const isAssembly = /lắp ráp|lỏng|chặt|kẹt|không khớp|rơ/i.test(fullText);

  // 1. Phân tích nguyên nhân gốc rễ (5-Why logic)
  const rootCauses5Why: string[] = [];
  if (isDimensional) {
    rootCauses5Why.push(
      "Why 1: Kích thước sản phẩm thực tế lệch ngoài khoảng dung sai bản vẽ/tiêu chuẩn kỹ thuật.",
      "Why 2: Thông số gia công (nhiệt độ/áp suất/tốc độ giải nhiệt) bị dao động hoặc độ mòn khuôn/dao gia tăng trong ca chạy.",
      "Why 3: Kiểm tra định kỳ FAI (sản phẩm đầu ca/giữa ca) chưa phát hiện kịp thời xu hướng lệch kích thước.",
      "Why 4: Thiếu tần suất đo kiểm định kỳ bằng dưỡng kiểm/thước kẹp chuyên dụng tại công đoạn.",
      "Nguyên nhân gốc rễ (Root Cause): Chưa chuẩn hóa tần suất đo kiểm và cơ chế khóa dừng dây chuyền cảnh báo sớm khi kích thước tiệm cận biên dung sai."
    );
  } else if (isVisual) {
    rootCauses5Why.push(
      "Why 1: Sản phẩm phát sinh lỗi ngoại quan (bavia/vết xước/ố bẩn/khuyết tật bề mặt) vượt mức tiêu chuẩn mẫu giới hạn.",
      "Why 2: Mặt khuôn/dao cắt/bề mặt tiếp xúc tích tụ bẩn hoặc bị cọ xát trong quá trình lấy sản phẩm và đóng gói.",
      "Why 3: Thao tác vệ sinh khuôn/thiết bị chưa triệt để theo checklist 5S và bảng hướng dẫn vệ sinh định kỳ.",
      "Why 4: Công nhân chưa đối chiếu mẫu ngoại quan giới hạn (Limit Sample) được phê duyệt tại vị trí làm việc.",
      "Nguyên nhân gốc rễ (Root Cause): Thiếu bảng mẫu giới hạn trực quan tại máy và quy trình kiểm tra vệ sinh khuôn/thiết bị trước mỗi ca sản xuất."
    );
  } else if (isColor) {
    rootCauses5Why.push(
      "Why 1: Màu sắc sản phẩm thành phẩm không đồng nhất hoặc lệch tone so với mẫu chuẩn đã ký duyệt.",
      "Why 2: Tỷ lệ phối trộn phụ gia màu/hạt nhựa tái sinh chưa đồng đều hoặc máy trộn hoạt động chưa đủ thời gian quy định.",
      "Why 3: Phễu sấy và trục vít máy còn sót cặn màu cũ từ đơn hàng trước do vệ sinh chuyển đổi mã chưa sạch.",
      "Why 4: Chưa thực hiện so màu dưới tủ ánh sáng chuẩn (D65) đối với mẫu sản phẩm đầu ca.",
      "Nguyên nhân gốc rễ (Root Cause): Quy trình vệ sinh máy khi chuyển đổi màu chưa được kiểm tra xác nhận độc lập bởi QC trước khi bấm máy."
    );
  } else if (isPackaging) {
    rootCauses5Why.push(
      "Why 1: Bao bì/thùng carton/tem nhãn dán sai thông tin sản phẩm, sai số lượng hoặc thiếu tem phụ.",
      "Why 2: Vị trí cấp phát tem nhãn và bao bì đặt gần khu vực sản phẩm khác dẫn đến việc lấy nhầm.",
      "Why 3: Thao tác dán nhãn và đóng thùng chưa thực hiện quét mã vạch kiểm tra chéo (Double Check).",
      "Why 4: Thiếu bảng phân vùng nhận diện rõ ràng giữa nguyên phụ liệu của các đơn hàng đang chạy đồng thời.",
      "Nguyên nhân gốc rễ (Root Cause): Chưa áp dụng cơ chế chống nhầm lẫn (Poka-Yoke) trong khâu in cấp phát tem nhãn và kiểm tra chéo trước khi nhập kho."
    );
  } else if (isAssembly) {
    rootCauses5Why.push(
      "Why 1: Chi tiết sau khi lắp ráp bị lỏng/kẹt/không đạt lực siết hoặc độ khít yêu cầu.",
      "Why 2: Kích thước dung sai lắp ghép giữa các chi tiết có độ biến thiên lớn hoặc dụng cụ lắp ráp suy giảm lực chuẩn.",
      "Why 3: Thao tác của công nhân lắp ráp chưa chuẩn tư thế và lực theo bảng hướng dẫn công việc (WI).",
      "Why 4: Chưa định kỳ hiệu chuẩn dưỡng kiểm và dụng cụ siết lực chuyên dụng.",
      "Nguyên nhân gốc rễ (Root Cause): Chưa tiêu chuẩn hóa đồ gá lắp ráp và thiếu dưỡng kiểm 100% chức năng sau khi hoàn tất công đoạn."
    );
  } else {
    rootCauses5Why.push(
      `Why 1: Sự cố phát sinh liên quan đến nhóm yếu tố ${factorType} làm ảnh hưởng đến chất lượng sản phẩm/tiến độ.`,
      "Why 2: Thao tác thực tế hoặc thông số vận hành có sự sai lệch so với tài liệu quy trình chuẩn (SOP/WI).",
      "Why 3: Sự thay đổi tại hiện trường chưa được nhận diện và thông báo theo quy trình kiểm soát thay đổi 4M1E1I.",
      "Why 4: Chưa có cơ chế giám sát và xác nhận độc lập giữa các tổ sản xuất và bộ phận kiểm soát chất lượng.",
      "Nguyên nhân gốc rễ (Root Cause): Chưa thực hiện đầy đủ đánh giá rủi ro 4M1E1I trước khi tiến hành sản xuất và thiếu cơ chế phản ứng nhanh tại chuyền."
    );
  }

  // 2. Hành động khắc phục tức thời (Correction / Containment)
  const immediateActions: string[] = [
    "1. Tạm dừng ngay công đoạn phát sinh sự cố, gắn thẻ cảnh báo 'HÀNG CHỜ XỬ LÝ (HOLD)' tại vị trí hiện trường.",
    "2. Phân loại 100% lô hàng sản xuất cùng thời điểm (bao gồm hàng trên chuyền và tồn kho bán thành phẩm).",
    "3. Cô lập hoàn toàn các sản phẩm không phù hợp vào khu vực phế phẩm/chờ xử lý để tránh lẫn lộn.",
    "4. Hiệu chỉnh lại thông số máy/thiết bị về giá trị chuẩn đã được phê duyệt trong bảng thông số kỹ thuật (TDS).",
    "5. Chạy thử lại mẫu đầu chuyền, kiểm tra đầy đủ chỉ tiêu kỹ thuật/ngoại quan trước khi cho phép tiếp tục sản xuất."
  ];

  // 3. Truy xuất & Phạm vi ảnh hưởng (Traceability)
  const traceabilitySteps: string[] = [
    "1. Truy xuất hồ sơ sản xuất: Số Lệnh sản xuất (LSX), Mã khuôn/máy, Số lô nguyên vật liệu, Ca làm việc và Danh sách nhân sự vận hành.",
    "2. Kiểm tra chéo thời điểm bắt đầu phát sinh lỗi qua biên bản kiểm tra FAI/IPQC và dữ liệu máy chạy.",
    "3. Rà soát tồn kho: Thống kê chính xác số lượng sản phẩm OK, số lượng sản phẩm NG cần tái chế/hủy và số lượng đã xuất xưởng (nếu có).",
    "4. Đánh giá rủi ro ảnh hưởng đến các đơn hàng/khách hàng khác đang sử dụng chung lô nguyên liệu hoặc mã sản phẩm tương tự."
  ];

  // 4. Hành động phòng ngừa lâu dài (Preventive Actions)
  const preventiveActions: string[] = [
    "1. Cập nhật và ban hành lại Bảng hướng dẫn công việc (WI / SOP) với các điểm chú ý kiểm soát chất lượng cụ thể.",
    "2. Bổ sung/lắp đặt cơ chế chống nhầm lẫn (Poka-Yoke) hoặc bổ sung dưỡng kiểm chuyên dụng tại vị trí thao tác.",
    "3. Tổ chức đào tạo và đánh giá lại tay nghề cho 100% công nhân vận hành/kiểm tra tại tổ sản xuất.",
    "4. Tăng tần suất kiểm tra chất lượng (IPQC) trong 3 ca sản xuất tiếp theo để xác nhận tính ổn định của giải pháp.",
    "5. Chia sẻ bài học kinh nghiệm (Lesson Learned) (4M1E1I) đến tất cả các tổ/chuyền/nhà máy có cùng công nghệ."
  ];

  return {
    coreIssue: content.trim(),
    factorType,
    immediateActions,
    rootCauses5Why,
    preventiveActions,
    traceabilitySteps
  };
}

/**
 * Hàm sinh dự thảo CAPA ISO chuyên nghiệp chạy hoàn toàn trên Client-side.
 * Hoạt động độc lập 100% không phụ thuộc vào internet hay API Key,
 * đảm bảo khi xuất code lên GitHub vẫn lập CAPA sâu sắc, đầy đủ 5-Why và chuẩn ISO 9001.
 */
export function generateProfessionalClientCapaDraft(report: QualityReport, baseCapa: CapaData): CapaData {
  const content = report.content || "Không có mô tả chi tiết";
  const notes = report.notes || "";
  const category = report.category || "4M1E1I";

  const analysis = analyzeIncidentNature(content, notes, category);

  // Xây dựng mô tả sự không phù hợp (NC Description)
  const ncDescriptionFormatted = [
    `• Địa điểm & Phân xưởng: ${report.factory || "Nhà máy"} - Tổ/Dây chuyền sản xuất`,
    `• Yếu tố biến động (4M1E1I): ${analysis.factorType}`,
    `• Mô tả chi tiết hiện tượng lỗi: ${analysis.coreIssue}`,
    report.notes ? `• Thông tin bổ sung / Hiện trường: ${report.notes}` : "",
    `• Tình trạng phát hiện: Báo cáo KPH số ${report.reportCode || report.id} ghi nhận bởi ${report.uploaderName || "Nhân sự QC/Sản xuất"}.`
  ].filter(Boolean).join("\n");

  // Xây dựng 5-Why & Nguyên nhân gốc rễ (Reason / Root Cause)
  const reasonFormatted = [
    "【PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ - PHƯƠNG PHÁP 5-WHY】",
    ...analysis.rootCauses5Why.map(item => `• ${item}`)
  ].join("\n");

  // Xây dựng Hành động khắc phục tức thời (Correction)
  const correctionFormatted = [
    "【HÀNH ĐỘNG KHẮC PHỤC TỨC THỜI (CONTAINMENT / CORRECTION)】",
    ...analysis.immediateActions
  ].join("\n");

  // Xây dựng Truy xuất hồ sơ & Đánh giá phạm vi (Traceability)
  const traceabilityFormatted = [
    "【TRUY XUẤT NGUỒN GỐC & PHẠM VI ẢNH HƯỞNG (TRACEABILITY)】",
    ...analysis.traceabilitySteps
  ].join("\n");

  // Xây dựng Hành động phòng ngừa lâu dài (Preventive Actions)
  const preventiveActionFormatted = [
    "【HÀNH ĐỘNG PHÒNG NGỪA TÁI DIỄN (PREVENTIVE ACTION)】",
    ...analysis.preventiveActions
  ].join("\n");

  return {
    ...baseCapa,
    productName: (report as any).productName || baseCapa.productName || report.content?.substring(0, 50) || "Sản phẩm Tân Phú",
    productCode: (report as any).productCode || baseCapa.productCode || report.reportCode || "TP-PROD",
    customerName: (report as any).customerName || baseCapa.customerName || "Khách Hàng Nội Bộ / Nhà Máy",
    ncDescription: ncDescriptionFormatted,
    reason: reasonFormatted,
    correction: correctionFormatted,
    traceability: traceabilityFormatted,
    preventiveAction: preventiveActionFormatted,
    isAiDrafted: true
  };
}
