import { TrialTrackingItem } from "../types";

export const initialTrialTrackings: TrialTrackingItem[] = [
  {
    id: "TN-BNI-2608001",
    code: "TN-BNI-2608001",
    title: "Thử nghiệm phụ gia trợ nở & kháng tĩnh điện cho Chai PET 500ml",
    targetCompany: "TPP",
    factory: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    workshop: "Xưởng Ép - Máy Ép 03",
    category4M: "NGUYÊN VẬT LIỆU",
    productName: "Chai PET 500ml - Nước tương Chinsu",
    requestDocNo: "ĐN-TN/2026/08-01",
    planDocNo: "LSX-T992",
    sampleQuantity: "500 sản phẩm",
    createdAt: "15/08/26 08:30",
    createdTimestamp: 1786872600000,
    createdByName: "Bùi Thanh Dung",
    createdByPhone: "0988776655",
    createdByRole: "QA/QC Head",
    overallStatus: "IN_PROGRESS",
    currentStepKey: "step3b_mold",
    steps: {
      step1_request: {
        key: "step1_request",
        stepNumber: "1",
        name: "ĐN thử nghiệm",
        roleResponsible: "QA/R&D",
        isCompleted: true,
        completedAt: "15/08/26 08:30",
        completedBy: "Bùi Thanh Dung",
        completedByRole: "QA Head",
        resultStatus: "PASS",
        notes: "Đề xuất thử hạt phụ gia mới từ nhà cung cấp PolyChem để giảm bọt khí.",
        customCode: "ĐN-TN/2026/08-01"
      },
      step2_plan: {
        key: "step2_plan",
        stepNumber: "2",
        name: "LSX thử",
        roleResponsible: "Phòng Kế hoạch",
        isCompleted: true,
        completedAt: "15/08/26 14:00",
        completedBy: "Nguyễn Văn Tuấn",
        completedByRole: "Kế hoạch Điều độ",
        resultStatus: "PASS",
        notes: "Đã lên kế hoạch thử nghiệm vào ca 1 ngày 16/08 trên chuyền Ép 03.",
        customCode: "LSX-T992"
      },
      step3a_material: {
        key: "step3a_material",
        stepNumber: "3A",
        name: "Trộn NL",
        roleResponsible: "Tổ Liệu",
        isCompleted: true,
        completedAt: "16/08/26 07:45",
        completedBy: "Trần Văn Hải",
        completedByRole: "Tổ trưởng Tổ Liệu",
        resultStatus: "PASS",
        notes: "Đã cân định lượng hạt phụ gia 2% và sấy liệu đạt nhiệt độ 160°C trong 4h."
      },
      step3b_mold: {
        key: "step3b_mold",
        stepNumber: "3B",
        name: "Lên khuôn",
        roleResponsible: "Kỹ thuật Khuôn",
        isCompleted: false,
        notes: "Đang gá khuôn 48 cavity lên máy Ép 03 và kết nối hệ thống nước giải nhiệt."
      },
      step4_trial: {
        key: "step4_trial",
        stepNumber: "4",
        name: "Thử nghiệm",
        roleResponsible: "Sản xuất / Trưởng ca",
        isCompleted: false
      },
      step5_evaluation: {
        key: "step5_evaluation",
        stepNumber: "5",
        name: "Đánh giá",
        roleResponsible: "QA / QC",
        isCompleted: false,
        resultStatus: "PENDING"
      }
    },
    updatedAt: "16/08/26 07:45",
    commentsCount: 2,
    likedBy: ["Lê Nhật Trường", "Bùi Tài"],
    directives: [
      {
        id: "dir-tn-1",
        text: "Yêu cầu @Lê Nhật Trường và @P.QLCL giám sát chặt chẽ độ dày thành chai và tỷ lệ bọt khí trong suốt ca ép thử nghiệm.",
        author: "Lê Nhật Trường - Trưởng ban QLCL",
        timestamp: "15/08/26 10:15",
        isAcknowledged: true,
        acknowledgedBy: "QA/QC Head - Bùi Thanh Dung",
        acknowledgedAt: "15/08/26 10:30",
        acknowledges: [
          { by: "QA/QC Head - Bùi Thanh Dung", at: "15/08/26 10:30" },
          { by: "Kỹ thuật Khuôn - Trần Văn Hải", at: "15/08/26 11:00" }
        ]
      }
    ]
  },
  {
    id: "TN-BBM-2608002",
    code: "TN-BBM-2608002",
    title: "Chạy thử nghiệm màng CPP ghép phức hợp chịu nhiệt độ tiệt trùng 121°C",
    targetCompany: "DNP",
    factory: "Nhà máy DNP-BBM",
    workshop: "Xưởng Ghép Màng - Máy Ghép Khô 02",
    category4M: "PHƯƠNG PHÁP",
    productName: "Túi retort xúc xích 150g",
    requestDocNo: "ĐN-RD-DNP/0826",
    planDocNo: "LSX-GH-884",
    sampleQuantity: "2.000 mét màng",
    createdAt: "14/08/26 09:00",
    createdTimestamp: 1786786800000,
    createdByName: "Lê Văn Hùng",
    createdByPhone: "0912345678",
    createdByRole: "R&D DNP",
    overallStatus: "COMPLETED_PASS",
    currentStepKey: "step5_evaluation",
    steps: {
      step1_request: {
        key: "step1_request",
        stepNumber: "1",
        name: "ĐN thử nghiệm",
        roleResponsible: "QA/R&D",
        isCompleted: true,
        completedAt: "14/08/26 09:00",
        completedBy: "Lê Văn Hùng",
        completedByRole: "R&D DNP",
        resultStatus: "PASS",
        customCode: "ĐN-RD-DNP/0826"
      },
      step2_plan: {
        key: "step2_plan",
        stepNumber: "2",
        name: "LSX thử",
        roleResponsible: "Phòng Kế hoạch",
        isCompleted: true,
        completedAt: "14/08/26 11:30",
        completedBy: "Phạm Minh Hoàng",
        completedByRole: "Điều độ DNP",
        resultStatus: "PASS",
        customCode: "LSX-GH-884"
      },
      step3a_material: {
        key: "step3a_material",
        stepNumber: "3A",
        name: "Trộn NL",
        roleResponsible: "Tổ Liệu",
        isCompleted: true,
        completedAt: "14/08/26 13:45",
        completedBy: "Võ Thành Nam",
        completedByRole: "Kỹ thuật Keo",
        resultStatus: "PASS",
        notes: "Pha keo PU 2 thành phần đạt độ nhớt 15s Zahn Cup #4."
      },
      step3b_mold: {
        key: "step3b_mold",
        stepNumber: "3B",
        name: "Lên khuôn",
        roleResponsible: "Kỹ thuật Khuôn/Trục",
        isCompleted: true,
        completedAt: "14/08/26 15:00",
        completedBy: "Đinh Văn Tiến",
        completedByRole: "Tổ trưởng Ghép",
        resultStatus: "PASS",
        notes: "Lên trục anilox 120 lpi và canh khe hở ép 0.3mm."
      },
      step4_trial: {
        key: "step4_trial",
        stepNumber: "4",
        name: "Thử nghiệm",
        roleResponsible: "Sản xuất / Trưởng ca",
        isCompleted: true,
        completedAt: "15/08/26 10:00",
        completedBy: "Ngô Đức Trọng",
        completedByRole: "Trưởng ca Ghép",
        resultStatus: "PASS",
        notes: "Chạy tốc độ 180m/phút ổn định, lực căng chuẩn không nhăn màng."
      },
      step5_evaluation: {
        key: "step5_evaluation",
        stepNumber: "5",
        name: "Đánh giá",
        roleResponsible: "QA / QC",
        isCompleted: true,
        completedAt: "15/08/26 16:30",
        completedBy: "Kim Thị Bích Tuyền",
        completedByRole: "QC Head DNP",
        resultStatus: "PASS",
        notes: "Test tiệt trùng nồi hấp 121°C trong 30 phút đạt độ bám dính > 4.5 N/15mm. Không bong tróc màng."
      }
    },
    finalConclusion: "KẾT QUẢ ĐẠT TIÊU CHUẨN KỸ THUẬT. Đủ điều kiện đưa vào sản xuất hàng loạt.",
    updatedAt: "15/08/26 16:30",
    commentsCount: 4,
    likedBy: ["Lê Văn Hùng", "Trần Huy Tiến"],
    directives: [
      {
        id: "dir-tn-2",
        text: "Chuẩn hóa quy trình ép nhiệt và bàn giao bộ thông số chuẩn cho @P.SX @Nhà máy DNP-BBM.",
        author: "Mr. Giáp - P. Mua Hàng & Kỹ Thuật",
        timestamp: "15/08/26 17:00",
        isAcknowledged: true,
        acknowledgedBy: "Trưởng ca Ghép - Ngô Đức Trọng",
        acknowledgedAt: "15/08/26 17:15",
        acknowledges: [
          { by: "Trưởng ca Ghép - Ngô Đức Trọng", at: "15/08/26 17:15" }
        ]
      }
    ]
  }
];
