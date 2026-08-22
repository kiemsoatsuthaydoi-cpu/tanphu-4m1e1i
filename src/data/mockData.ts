import { ProductionLine, AndonTicket, QCDefectType } from '../types/andon';

export const INITIAL_DEFECT_TYPES: QCDefectType[] = [
  { code: 'DEF-001', name: 'Lỗi đường may / Bung chỉ / Bỏ mũi', category: 'Chất lượng may', standardTolerance: '0 lỗi trên 100cm', inspectionGuide: 'Kiểm tra mật độ mũi chỉ (4-5 mũi/cm), sức căng chỉ trên dưới.' },
  { code: 'DEF-002', name: 'Lệch rập / Sai kích thước thông số > 0.5cm', category: 'Thông số', standardTolerance: 'Sai số tối đa ±0.3cm', inspectionGuide: 'Đặt sản phẩm trên mặt phẳng chuẩn, dùng thước dây tiêu chuẩn đối chiếu bảng size.' },
  { code: 'DEF-003', name: 'Xước vải / Loang màu / Lỗi sợi dệt', category: 'Ngoại quan vải', standardTolerance: '0 vết xước trên bề mặt chính', inspectionGuide: 'Soi dưới đèn kiểm vải 1000 Lux theo góc 45 độ.' },
  { code: 'DEF-004', name: 'Nhiệt ép không đạt / Bong keo màng chống thấm', category: 'Ép nhiệt', standardTolerance: 'Lực bóc dính > 25 N/cm', inspectionGuide: 'Thử nghiệm kéo bóc sau 4 giờ ép nhiệt.' },
  { code: 'DEF-005', name: 'Gãy kim / Dính mạt kim loại', category: 'An toàn kim', standardTolerance: '100% qua máy dò kim loại', inspectionGuide: 'Quy trình kiểm soát kim gãy 1:1, ký biên bản thay kim.' }
];

export const INITIAL_LINES: ProductionLine[] = [
  {
    id: 'line-01',
    name: 'Chuyền May Áo Polo Nam #01',
    code: 'LINE-PL-01',
    manager: 'Nguyễn Văn Hùng (Trưởng chuyền)',
    shift: 'Ca 1 (07:30 - 16:30)',
    status: 'RUNNING',
    fpy: 98.4,
    oee: 92.1,
    stations: [
      { id: 'st-101', name: 'Vị trí 01 - Ráp sườn vai', code: 'ST-01', lineId: 'line-01', workerName: 'Trần Thị Mai', workerCode: 'QC-0842', status: 'NORMAL', taktTimeSec: 42, outputToday: 320, targetToday: 350, defectCountToday: 1 },
      { id: 'st-102', name: 'Vị trí 02 - Tra cổ áo & lé viền', code: 'ST-02', lineId: 'line-01', workerName: 'Lê Văn Nam', workerCode: 'QC-0843', status: 'ALERT', activeAlertId: 'ticket-101', taktTimeSec: 58, outputToday: 290, targetToday: 350, defectCountToday: 4 },
      { id: 'st-103', name: 'Vị trí 03 - May nẹp cúc & xẻ tà', code: 'ST-03', lineId: 'line-01', workerName: 'Phạm Thị Lan', workerCode: 'QC-0844', status: 'NORMAL', taktTimeSec: 38, outputToday: 315, targetToday: 350, defectCountToday: 0 },
      { id: 'st-104', name: 'Vị trí 04 - Đơm nút & dập bọ', code: 'ST-04', lineId: 'line-01', workerName: 'Hoàng Minh Tuấn', workerCode: 'QC-0845', status: 'NORMAL', taktTimeSec: 32, outputToday: 340, targetToday: 350, defectCountToday: 1 }
    ]
  },
  {
    id: 'line-02',
    name: 'Chuyền Ép Nhiệt & Dán Keo Seamless #02',
    code: 'LINE-SM-02',
    manager: 'Đỗ Quốc Bảo (Trưởng chuyền)',
    shift: 'Ca 1 (07:30 - 16:30)',
    status: 'DEGRADED',
    fpy: 94.2,
    oee: 86.5,
    stations: [
      { id: 'st-201', name: 'Vị trí 01 - Cắt laser định hình', code: 'ST-05', lineId: 'line-02', workerName: 'Vũ Đức Thịnh', workerCode: 'QC-1120', status: 'NORMAL', taktTimeSec: 30, outputToday: 410, targetToday: 450, defectCountToday: 2 },
      { id: 'st-202', name: 'Vị trí 02 - Ép màng keo chống thấm', code: 'ST-06', lineId: 'line-02', workerName: 'Nguyễn Thị Hương', workerCode: 'QC-1121', status: 'WARNING', activeAlertId: 'ticket-102', taktTimeSec: 65, outputToday: 260, targetToday: 380, defectCountToday: 6 },
      { id: 'st-203', name: 'Vị trí 03 - Kiểm tra độ bám dính Hydro', code: 'ST-07', lineId: 'line-02', workerName: 'Bùi Anh Dũng', workerCode: 'QC-1122', status: 'NORMAL', taktTimeSec: 45, outputToday: 280, targetToday: 350, defectCountToday: 1 }
    ]
  },
  {
    id: 'line-03',
    name: 'Chuyền Kiểm Hàng End-Line & Đóng Gói #03',
    code: 'LINE-PK-03',
    manager: 'Trịnh Thị Thu Hà (QC Manager)',
    shift: 'Ca 1 (07:30 - 16:30)',
    status: 'RUNNING',
    fpy: 99.1,
    oee: 96.0,
    stations: [
      { id: 'st-301', name: 'Vị trí 01 - Dò kim loại 100%', code: 'ST-08', lineId: 'line-03', workerName: 'Ngô Thanh Tùng', workerCode: 'QC-2031', status: 'NORMAL', taktTimeSec: 15, outputToday: 620, targetToday: 700, defectCountToday: 0 },
      { id: 'st-302', name: 'Vị trí 02 - Soi rập & gắn barcode QC', code: 'ST-09', lineId: 'line-03', workerName: 'Đinh Cẩm Tú', workerCode: 'QC-2032', status: 'NORMAL', taktTimeSec: 25, outputToday: 590, targetToday: 700, defectCountToday: 3 }
    ]
  }
];

export const INITIAL_TICKETS: AndonTicket[] = [
  {
    id: 'ticket-101',
    ticketNumber: 'ANDON-2026-0089',
    stationId: 'st-102',
    stationName: 'Vị trí 02 - Tra cổ áo & lé viền',
    lineName: 'Chuyền May Áo Polo Nam #01',
    reporterName: 'Lê Văn Nam',
    reporterRole: 'Công nhân may (QC Tự chủ)',
    category: 'QUALITY',
    severity: 'critical',
    title: 'Lỗi nhăn lé viền cổ áo vượt ngưỡng 2mm',
    description: 'Phát hiện 3 sản phẩm liên tiếp bị dúm đường tra bo cổ áo polo, nghi ngờ do cữ dưỡng gá bị lỏng hoặc sức căng chỉ dưới quá lớn.',
    defectType: 'Lỗi đường may / Bung chỉ / Bỏ mũi',
    suggestedAction: 'Dừng chuyền tạm thời 3 phút để thợ cơ điện/bảo trì căn chỉnh lại cữ may.',
    createdAt: '10 phút trước',
    status: 'IN_PROGRESS',
    responderName: 'Kỹ thuật may: Phạm Hữu Vinh (Đang hỗ trợ tại máy)',
    rootCause5Why: {
      why1: 'Tại sao bo cổ bị dúm? -> Bo vải bị kéo căng không đều khi vào rãnh gá.',
      why2: 'Tại sao bị kéo căng lệch? -> Cữ dẫn hướng bị lệch 1.5mm do ốc lỏng.',
      why3: 'Tại sao ốc bị lỏng? -> Rung chấn mô-tơ máy sau 500 giờ hoạt động chưa siết lại.',
      why4: 'Tại sao chưa siết lại? -> Chưa tới lịch bảo dưỡng định kỳ tuần.',
      why5: 'Gốc rễ (Root cause)? -> Thiếu checklist kiểm tra đầu ca của công nhân.',
      rootCause: 'Thiếu bước siết ốc cữ may trong quy trình 5S đầu ca.',
      preventiveAction: 'Thêm tem đánh dấu vị trí ốc cữ và mục check 2 phút đầu ca.'
    }
  },
  {
    id: 'ticket-102',
    ticketNumber: 'ANDON-2026-0090',
    stationId: 'st-202',
    stationName: 'Vị trí 02 - Ép màng keo chống thấm',
    lineName: 'Chuyền Ép Nhiệt & Dán Keo Seamless #02',
    reporterName: 'Nguyễn Thị Hương',
    reporterRole: 'Kỹ thuật viên ép nhiệt',
    category: 'EQUIPMENT',
    severity: 'major',
    title: 'Nhiệt độ bàn ép tụt dưới mức chuẩn 145°C (hiện tại 128°C)',
    description: 'Cảm biến nhiệt độ thermocouple báo chập chờn, màng keo không tan chảy đồng đều gây nguy cơ bong tróc khi giặt.',
    createdAt: '25 phút trước',
    status: 'ACKNOWLEDGED',
    responderName: 'Bảo trì: Đặng Văn Tiến (Đang điều chuyển thiết bị đo nhiệt hồng ngoại)',
    suggestedAction: 'Tạm dừng đưa phôi vào máy ép số 2, chuyển tải sang máy dự phòng #2B.'
  }
];
