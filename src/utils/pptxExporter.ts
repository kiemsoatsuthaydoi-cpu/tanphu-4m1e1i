import pptxgen from "pptxgenjs";

export interface SlideData {
  id: number;
  title: string;
  subtitle?: string;
  category: string;
  badge?: string;
  bgGradient: string;
  content: {
    heading?: string;
    points: {
      title: string;
      desc: string;
      icon?: string;
      highlight?: boolean;
    }[];
    tips?: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  };
}

export const SLIDES_DATA: SlideData[] = [
  {
    id: 1,
    title: "TÀI LIỆU HƯỚNG DẪN SỬ DỤNG META ANDON 4M1E1I",
    subtitle: "Cẩm nang hướng dẫn thao tác toàn diện dành cho CBCNV Công ty Cổ phần Sản xuất Gia dụng Tân Phú",
    category: "TỔNG QUAN",
    badge: "SOP-4M1E1I-2026",
    bgGradient: "from-slate-900 via-indigo-950 to-blue-900",
    content: {
      heading: "Mục Tiêu & Sứ Mệnh",
      points: [
        {
          title: "Khẩu hiệu cốt lõi",
          desc: "Mỗi nhân viên là một QC - Phản ứng nhanh, Kiểm soát triệt để mọi thay đổi ảnh hưởng chất lượng.",
          highlight: true
        },
        {
          title: "Mục tiêu ứng dụng",
          desc: "Phát hiện sớm sự cố Không Phù Hợp (KPH), số hóa thông tin báo cáo 4M1E1I, tự động hóa chuông cảnh báo Andon và theo dõi tiến độ khắc phục tức thì."
        },
        {
          title: "Đơn vị chủ quản",
          desc: "Ban Quản lý Thay đổi 4M1E1I - Công ty Cổ phần Sản xuất Gia dụng Tân Phú (Project: tanphu-4m1e1i)."
        },
        {
          title: "Định dạng chuẩn",
          desc: "Định dạng ngày tháng chuẩn toàn hệ thống: dd/mm/yy."
        }
      ]
    }
  },
  {
    id: 2,
    title: "MÔ HÌNH QUẢN LÝ THAY ĐỔI 4M1E1I LÀ GÌ?",
    subtitle: "Hiểu rõ 6 yếu tố tác động trực tiếp đến chất lượng sản xuất tại Tân Phú",
    category: "LÝ THUYẾT 4M1E1I",
    badge: "MÔ HÌNH CHUẨN",
    bgGradient: "from-slate-900 via-slate-800 to-indigo-950",
    content: {
      heading: "Chi Tiết 6 Yếu Tố 4M1E1I",
      points: [
        {
          title: "1. MAN (Nhân Lực)",
          desc: "Thay đổi vị trí công tác, nhân sự mới, thiếu đào tạo, mệt mỏi hoặc vi phạm thao tác chuẩn."
        },
        {
          title: "2. MATERIAL (Vật Tư / Nguyên Liệu)",
          desc: "Lô hạt nhựa mới, phụ gia sai lệch, bao bì hỏng, vật tư không đạt chứng nhận IQC."
        },
        {
          title: "3. MACHINE (Máy Móc / Thiết Bị)",
          desc: "Máy ép hỏng, khuôn gá mòn, lỗi hệ thống làm mát, sai lệch thông số nhiệt độ/áp suất."
        },
        {
          title: "4. METHOD (Phương Pháp / Quy Trình)",
          desc: "Thay đổi SOP, chuẩn thao tác chưa rõ ràng, điều chỉnh chu kỳ ép nhựa không qua kiểm duyệt."
        },
        {
          title: "5. ENVIRONMENT (Môi Trường)",
          desc: "Nhiệt độ xưởng quá cao, độ ẩm ảnh hưởng hạt nhựa, bụi bẩn, chiếu sáng không đủ."
        },
        {
          title: "6. INFORMATION (Thông Tin / Dữ Liệu)",
          desc: "Sai lệch bản vẽ R&D, lệnh sản xuất chưa cập nhật, thiếu tem nhãn truy xuất nguồn gốc."
        }
      ]
    }
  },
  {
    id: 3,
    title: "QUY TRÌNH TẠO & BÁO CÁO SỰ CỐ / KPH HIỆN TRƯỜNG",
    subtitle: "Hướng dẫn 5 bước tạo bản tin sự cố KPH nhanh chóng dưới 30 giây",
    category: "THAO TÁC CƠ BẢN",
    badge: "BƯỚC NÓNG HIỆN TRƯỜNG",
    bgGradient: "from-blue-950 via-slate-900 to-teal-950",
    content: {
      heading: "Các Bước Thực Hiện Báo Cáo",
      points: [
        {
          title: "Bước 1: Mở Form Báo Cáo",
          desc: "Tại màn hình chính di động/desktop, nhấn nút '+' màu xanh hoặc nút 'TẠO BẢN TIN KPH MOI'."
        },
        {
          title: "Bước 2: Phân Loại Yếu Tố 4M1E1I",
          desc: "Tích chọn 1 trong 6 yếu tố (Man, Material, Machine, Method, Environment, Information)."
        },
        {
          title: "Bước 3: Chụp Ảnh & Tải Ảnh Hiện Trường",
          desc: "Chụp trực tiếp từ camera di động hoặc chọn ảnh có sẵn. Hệ thống tự động nén ảnh tối ưu tốc độ."
        },
        {
          title: "Bước 4: Nhập Mô Tả & Tag Tên người liên quan",
          desc: "Nhập chi tiết mô tả lỗi, chọn Xưởng/Dây chuyền, Mã sản phẩm và gõ '@' để Tag tên người/bộ phận chịu trách nhiệm xử lý."
        },
        {
          title: "Bước 5: Gửi Bản Tin",
          desc: "Bấm 'GỬI BẢN TIN'. Âm thanh Andon phát tín hiệu cảnh báo ngay lập tức đến toàn bộ nhân sự liên quan."
        }
      ],
      tips: [
        "Mẹo: Hãy luôn đính kèm ít nhất 1 hình ảnh rõ nét vết lỗi hoặc vị trí sự cố để kỹ thuật viên xử lý nhanh nhất."
      ]
    }
  },
  {
    id: 4,
    title: "QUY TRÌNH TIEP NHAN & XU LY BAN TIN KPH",
    subtitle: "Các giai đoạn vòng đời của một bản tin KPH từ tiếp nhận đến chốt giải pháp",
    category: "XỬ LÝ SỰ CỐ",
    badge: "VÒNG ĐỜI KPH",
    bgGradient: "from-slate-900 via-indigo-950 to-emerald-950",
    content: {
      heading: "4 Trạng Thái Xử Lý Chính",
      points: [
        {
          title: "Trạng thái 1: CHỜ XỬ LÝ (Chờ tiếp nhận)",
          desc: "Bản tin mới khởi tạo, phát chuông cảnh báo Andon, chờ Quản lý/KTV bấm tiếp nhận."
        },
        {
          title: "Trạng thái 2: ĐÃ TIEP NHAN / ĐANG XỬ LÝ",
          desc: "Người phụ trách bấm tiếp nhận, xuống hiện trường kiểm tra và đề xuất phương án tạm thời."
        },
        {
          title: "Trạng thái 3: ĐÃ CHỐT GIẢI PHÁP (5-Whys)",
          desc: "Thực hiện phân tích 5-Whys nguyên nhân gốc rễ và đưa ra giải pháp khắc phục triệt để (CAPA)."
        },
        {
          title: "Trạng thái 4: ĐÃ HOÀN THÀNH (Đóng bản tin)",
          desc: "Xác nhận kiểm tra lại sau khắc phục, bản tin được đóng và lưu trữ vào kho kiến thức bài học kinh nghiệm."
        }
      ],
      table: {
        headers: ["Mức độ khẩn cấp", "Thời gian phản hồi chuẩn", "Người chịu trách nhiệm chính"],
        rows: [
          ["🔥 Nguy hiểm / Rủi ro cao", "< 15 Phút", "Trưởng phòng QC / Trưởng xưởng / GĐSX"],
          ["⚡ Khẩn cấp / Dừng chuyền", "< 30 Phút", "Tổ trưởng / Kỹ thuật viên Cơ điện / QC"],
          ["📌 Thường / Nhắc nhở", "< 2 Giờ", "Quản lý ca / Nhân sự liên quan"]
        ]
      }
    }
  },
  {
    id: 5,
    title: "TÍNH NĂNG 'THẢO LUẬN CHUYÊN ĐỀ' & NÚT '@ TASK'",
    subtitle: "Kênh trao đổi chuyên sâu, phân công công việc và theo dõi tiến độ từng sự cố KPH",
    category: "THẢO LUẬN & GIAO VIỆC",
    badge: "TÍNH NĂNG NỔI BẬT",
    bgGradient: "from-purple-950 via-slate-900 to-indigo-950",
    content: {
      heading: "Hướng Dẫn Thảo Luận & Quản Lý Task",
      points: [
        {
          title: "Mở Phòng Thảo Luận Chuyên Đề",
          desc: "Trên mỗi thẻ bản tin KPH, bấm nút 'THẢO LUẬN CHUYÊN ĐỀ' hoặc 'ĐANG THẢO LUẬN CHUYÊN ĐỀ' để vào giao diện trao đổi riêng."
        },
        {
          title: "Giao Task / Đầu Việc Trực Tiếp",
          desc: "Khi nhắn tin phản hồi, chọn phân loại 'TASK', gán người phụ trách (Assigned To) và hạn hoàn thành."
        },
        {
          title: "Nút '@ TASK' Thông Minh",
          desc: "Khi bản tin có Task được gán cho bạn, nút '@ TASK' màu vàng nổi bật sẽ xuất hiện ngay trên thẻ bản tin. Nhấp trực tiếp vào nút '@ TASK' để mở nhanh Danh mục Đầu việc cần làm."
        },
        {
          title: "Chốt Kết Luận Thảo Luận",
          desc: "Trưởng phòng / Trưởng nhóm bấm 'CHỐT GIẢI PHÁP' để hoàn tất chuyên đề và tự động đồng bộ kết quả vào bản tin KPH."
        }
      ]
    }
  },
  {
    id: 6,
    title: "PHÂN QUYỀN VAI TRÒ & QUYỀN HẠN TRÊN NỀN TẢNG",
    subtitle: "Bảng phân quyền chi tiết cho từng nhóm tài khoản tại Tân Phú",
    category: "PHÂN QUYỀN",
    badge: "MA TRẬN VAI TRÒ",
    bgGradient: "from-slate-900 via-blue-950 to-slate-900",
    content: {
      heading: "Chi Tiết Quyền Hạn Nhân Sự",
      points: [
        {
          title: "1. Operator (Công Nhân / Nhân Viên)",
          desc: "Tạo bản tin KPH, gửi bình luận thảo luận, xem thông báo cá nhân, nhận điểm tuyên dương."
        },
        {
          title: "2. Leader / Supervisor (Tổ Trưởng / KTV)",
          desc: "Tiếp nhận bản tin KPH, phân tích 5-Whys, cập nhật trạng thái xử lý, gán Task cho nhân viên."
        },
        {
          title: "3. Department Manager (Trưởng Phòng / Trưởng Xưởng)",
          desc: "Duyệt chốt giải pháp, chỉ đạo khắc phục khẩn cấp, đánh giá chất lượng báo cáo, xem Analytics xưởng."
        },
        {
          title: "4. Admin / Board of Directors (BQT / Ban Giám Đốc)",
          desc: "Toàn quyền quản trị hệ thống, xuất báo cáo tổng hợp Excel/PDF, quản lý danh mục lỗi, phân quyền người dùng."
        }
      ]
    }
  },
  {
    id: 7,
    title: "HỆ THỐNG TUYÊN DƯƠNG, HUY HIỆU & ĐIỂM THƯỞNG",
    subtitle: "Xây dựng văn hóa thưởng nóng và ghi nhận đóng góp cải tiến chất lượng",
    category: "THI ĐUA & THƯỞNG",
    badge: "GAMIFICATION",
    bgGradient: "from-amber-950 via-slate-900 to-yellow-950",
    content: {
      heading: "Cơ Chế Tuyên Dương & Điểm Thưởng",
      points: [
        {
          title: "Gửi Điểm Khen Thưởng",
          desc: "Đồng nghiệp & Quản lý có thể tặng điểm thưởng kèm lời nhắn khen ngợi trực tiếp trên bản tin KPH."
        },
        {
          title: "Bộ Huy Hiệu Vinh Danh",
          desc: "Các huy hiệu cao quý: 'Ngôi Sao KPH', 'Dũng Sĩ Cải Tiến', 'QC Xuất Sắc', 'Phản Ứng Nhanh'..."
        },
        {
          title: "Bảng Xếp Hạng Thi Đua",
          desc: "Hệ thống tự động xếp hạng Top cá nhân & Top bộ phận có nhiều đóng góp phát hiện và xử lý KPH nhất trong tháng."
        },
        {
          title: "Quy Đổi Quà Tặng",
          desc: "Điểm thưởng tích lũy có thể quy đổi thành các phần quà thiết thực trong các đợt tổng kết của Công ty Tân Phú."
        }
      ]
    }
  },
  {
    id: 8,
    title: "KÊNH THÔNG BÁO & CẢNH BẢO CHUÔNG ANDON REAL-TIME",
    subtitle: "Đảm bảo không bỏ sót bất kỳ thông tin sự cố quan trọng nào",
    category: "THÔNG BÁO",
    badge: "REALTIME ANDON",
    bgGradient: "from-slate-900 via-rose-950 to-slate-900",
    content: {
      heading: "Các Loại Hình Cảnh Báo",
      points: [
        {
          title: "1. Chuông Andon Âm Thanh Cảnh Báo",
          desc: "Tín hiệu âm thanh phát ra khi có bản tin sự cố KPH mức độ Khẩn cấp / Nguy hiểm tại xưởng."
        },
        {
          title: "2. Quả Chuông Thông Báo (Notification Badge)",
          desc: "Hiển thị số lượng thông báo mới chưa đọc ở góc trên màn hình khi bạn được Tag tên '@' hoặc được giao Task."
        },
        {
          title: "3. Nút Lọc Nhanh '@ TASK CỦA BẠN'",
          desc: "Bấm nút tím '@ (Count)' ở thanh lọc đầu trang để lọc nhanh tất cả các bản tin đang cần sự hỗ trợ của bạn."
        },
        {
          title: "4. Thông Báo Chuyển Giao Bản Tin",
          desc: "Nhận thông báo tự động khi bản tin được chuyển giao xử lý liên phòng ban (ví dụ: QC -> R&D -> Cơ điện)."
        }
      ]
    }
  },
  {
    id: 9,
    title: "DASHBOARD ANALYTICS & XUẤT BÁO CÁO EXCEL / PDF",
    subtitle: "Công cụ phân tích dữ liệu trực quan phục vụ giao ban sản xuất",
    category: "BÁO CÁO & ANALYTICS",
    badge: "BÁO CÁO QUẢN TRỊ",
    bgGradient: "from-teal-950 via-slate-900 to-indigo-950",
    content: {
      heading: "Các Tính Năng Phân Tích Báo Cáo",
      points: [
        {
          title: "Biểu Đồ Phân Bổ 4M1E1I",
          desc: "Theo dõi tỷ lệ sự cố theo từng nhóm yếu tố để tập trung nguồn lực cải tiến."
        },
        {
          title: "Phân Tích Biểu Đồ Pareto Lỗi",
          desc: "Nhận diện 20% nguyên nhân hàng đầu gây ra 80% phế phẩm tại các dây chuyền ép nhựa."
        },
        {
          title: "Đo Lường Thời Gian Giải Quyết (MTTR)",
          desc: "Thống kê thời gian trung bình từ khi phát sinh KPH đến khi chốt giải pháp theo từng phòng ban."
        },
        {
          title: "Xuất Báo Cáo Chuẩn Excel & PDF",
          desc: "Tải xuống file dữ liệu Excel (.xlsx) chi tiết hoặc xuất file PDF tổng hợp báo cáo tuần/tháng chỉ với 1 cú nhấp."
        }
      ]
    }
  },
  {
    id: 10,
    title: "TRỢ LÝ THÔNG MINH AI GEMINI & TỰ ĐỘNG HÓA",
    subtitle: "Tối ưu hóa thời gian xử lý sự cố nhờ công nghệ AI tân tiến",
    category: "TÍNH NĂNG AI",
    badge: "GEMINI AI ASSISTANT",
    bgGradient: "from-cyan-950 via-slate-900 to-blue-950",
    content: {
      heading: "3 Công Cụ AI Hỗ Trợ Đắc Lực",
      points: [
        {
          title: "1. AI Tóm Tắt Thảo Luận (AI Auto-Summarize)",
          desc: "Tự động đọc hàng chục tin nhắn thảo luận và cô đọng thành 3 câu kết luận ngắn gọn, chính xác."
        },
        {
          title: "2. AI Gợi Ý Phân Tích 5-Whys",
          desc: "Đề xuất chuỗi câu hỏi 5 nguyên nhân vì sao dựa trên ngân hàng dữ liệu sự cố lịch sử của Tân Phú."
        },
        {
          title: "3. AI Tự Động Gợi Ý Phân Loại 4M1E1I",
          desc: "Hệ thống AI tự động phân tích hình ảnh & mô tả lỗi để đưa ra gợi ý phân loại yếu tố 4M1E1I chuẩn xác nhất."
        }
      ]
    }
  },
  {
    id: 11,
    title: "QUY ĐỊNH VĂN HÓA SỬ DỤNG & ĐỊNH DẠNG CHUẨN",
    subtitle: "Các quy tắc quan trọng mọi nhân sự Tân Phú cần tuân thủ",
    category: "QUY ĐỊNH NỘI BỘ",
    badge: "SOP TÂN PHÚ",
    bgGradient: "from-slate-900 via-slate-950 to-indigo-950",
    content: {
      heading: "Quy Tắc Vàng Khi Sử Dụng App",
      points: [
        {
          title: "Trung Thực & Khách Quan",
          desc: "Báo cáo chính xác thực tế hiện trường, không giấu lỗi, coi KPH là cơ hội cải tiến chất lượng."
        },
        {
          title: "Tuân Thủ Thời Gian Phản Hồi",
          desc: "Khi nhận thông báo Tag tên hoặc Task được giao, phải vào tiếp nhận và phản hồi trong thời hạn quy định."
        },
        {
          title: "Chuẩn Định Dạng Thời Gian (dd/mm/yy)",
          desc: "Mọi mốc thời gian hiển thị và nhập liệu trong biên bản phải tuân thủ nghiêm ngặt định dạng dd/mm/yy."
        },
        {
          title: "Bảo Vệ Chuẩn Giao Diện",
          desc: "Giữ nguyên cấu hình dịch thuật chống lỗi giao diện, đảm bảo tính đồng bộ trên mọi thiết bị di động & máy tính."
        }
      ]
    }
  },
  {
    id: 12,
    title: "TỔNG KẾT & KÊNH HỖ TRỢ KỸ THUẬT META ANDON",
    subtitle: "Thông tin liên hệ Ban Quản lý Thay đổi 4M1E1I - Tân Phú",
    category: "HỖ TRỢ KỸ THUẬT",
    badge: "LIÊN HỆ",
    bgGradient: "from-slate-900 via-blue-950 to-slate-900",
    content: {
      heading: "Kênh Hỗ Trợ 24/7",
      points: [
        {
          title: "Ban Quản Lý Thay Đổi 4M1E1I",
          desc: "Phòng Quản Lý Chất Lượng (QC) & Phòng CNTT (IT) - Công ty Cổ phần Sản xuất Gia dụng Tân Phú."
        },
        {
          title: "Project Identification",
          desc: "Project ID: tanphu-4m1e1i | Meta Andon Platform."
        },
        {
          title: "Hotline Kỹ Thuật IT",
          desc: "Liên hệ trực tiếp qua kênh Trao Đổi trên App hoặc gửi yêu cầu hỗ trợ đến Ban Quản Trị."
        },
        {
          title: "Thông điệp kết luận",
          desc: "'CÙNG TÂN PHÚ NÂNG TẦM CHẤT LƯỢNG - KIỂM SOÁT TRIỆT ĐỂ MỌI THAY ĐỔI!'",
          highlight: true
        }
      ]
    }
  }
];

export async function exportToPowerPoint(): Promise<void> {
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_16x9";
  pptx.title = "Hướng Dẫn Sử Dụng Meta Andon 4M1E1I - Tân Phú";
  pptx.company = "Công ty Cổ phần Sản xuất Gia dụng Tân Phú";
  pptx.author = "Ban Quản Lý Thay Đổi 4M1E1I";

  SLIDES_DATA.forEach((data, index) => {
    const slide = pptx.addSlide();

    // Background color based on slide type
    if (index === 0) {
      slide.background = { color: "0F172A" }; // Navy slate dark
    } else {
      slide.background = { color: "F8FAFC" }; // Light background for readability
    }

    if (index === 0) {
      // TITLE SLIDE
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.8,
        fill: { color: "1E293B" }
      });

      slide.addText("CÔNG TY CỔ PHẦN SẢN XUẤT GIA DỤNG TÂN PHÚ", {
        x: 0.8,
        y: 0.25,
        fontSize: 14,
        color: "38BDF8",
        bold: true,
        fontFace: "Arial"
      });

      slide.addText("TÀI LIỆU HƯỚNG DẪN SỬ DỤNG", {
        x: 0.8,
        y: 1.5,
        fontSize: 18,
        color: "94A3B8",
        bold: true,
        fontFace: "Arial"
      });

      slide.addText("ỨNG DỤNG META ANDON 4M1E1I", {
        x: 0.8,
        y: 2.1,
        fontSize: 32,
        color: "FFFFFF",
        bold: true,
        fontFace: "Arial",
        w: 11
      });

      slide.addText("Cẩm nang hướng dẫn thao tác toàn diện cho CBCNV Tân Phú", {
        x: 0.8,
        y: 3.2,
        fontSize: 16,
        color: "CBD5E1",
        italic: true,
        fontFace: "Arial"
      });

      // Banner card
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: 4.2,
        w: 11.5,
        h: 2.2,
        fill: { color: "1E1B4B" },
        line: { color: "6366F1", width: 1.5 },
        rectRadius: 0.1
      });

      slide.addText("KHẨU HIỆU HÀNH ĐỘNG:", {
        x: 1.1,
        y: 4.5,
        fontSize: 14,
        color: "F87171",
        bold: true,
        fontFace: "Arial"
      });

      slide.addText('"Mỗi nhân viên là một QC - Phản ứng nhanh, Kiểm soát triệt để thay đổi"', {
        x: 1.1,
        y: 4.9,
        fontSize: 20,
        color: "FDE047",
        bold: true,
        fontFace: "Arial",
        w: 10.8
      });

      slide.addText("Mã dự án: tanphu-4m1e1i  |  Phiên bản: 2026  |  Định dạng ngày: dd/mm/yy", {
        x: 1.1,
        y: 5.8,
        fontSize: 12,
        color: "A5B4FC",
        fontFace: "Arial"
      });
    } else {
      // CONTENT SLIDES
      // Header Bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: "100%",
        h: 1.1,
        fill: { color: "0F172A" }
      });

      // Category Badge
      slide.addText(`${data.category}  |  ${data.badge || ""}`, {
        x: 0.6,
        y: 0.18,
        fontSize: 10,
        color: "38BDF8",
        bold: true,
        fontFace: "Arial"
      });

      // Slide Title
      slide.addText(data.title, {
        x: 0.6,
        y: 0.45,
        fontSize: 20,
        color: "FFFFFF",
        bold: true,
        fontFace: "Arial",
        w: 11
      });

      // Subtitle below header
      if (data.subtitle) {
        slide.addText(data.subtitle, {
          x: 0.6,
          y: 1.25,
          fontSize: 13,
          color: "475569",
          italic: true,
          fontFace: "Arial"
        });
      }

      // Render points
      let currentY = 1.7;

      data.content.points.forEach((pt, pIdx) => {
        if (currentY > 6.5) return; // Prevent overflow

        const boxHeight = 0.85;

        // Point container card
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.6,
          y: currentY,
          w: 12.0,
          h: boxHeight,
          fill: pt.highlight ? { color: "FEF3C7" } : { color: "FFFFFF" },
          line: pt.highlight ? { color: "F59E0B", width: 1.5 } : { color: "E2E8F0", width: 1 },
          rectRadius: 0.08
        });

        // Bullet number/icon badge
        slide.addShape(pptx.ShapeType.oval, {
          x: 0.85,
          y: currentY + 0.18,
          w: 0.45,
          h: 0.45,
          fill: pt.highlight ? { color: "D97706" } : { color: "0284C7" }
        });

        slide.addText(`${pIdx + 1}`, {
          x: 0.85,
          y: currentY + 0.22,
          w: 0.45,
          h: 0.4,
          fontSize: 12,
          color: "FFFFFF",
          bold: true,
          align: "center",
          fontFace: "Arial"
        });

        // Point Title
        slide.addText(pt.title, {
          x: 1.45,
          y: currentY + 0.12,
          fontSize: 13,
          color: pt.highlight ? { color: "92400E" } : { color: "0F172A" },
          bold: true,
          fontFace: "Arial",
          w: 10.8
        });

        // Point Description
        slide.addText(pt.desc, {
          x: 1.45,
          y: currentY + 0.42,
          fontSize: 11,
          color: "475569",
          fontFace: "Arial",
          w: 10.8
        });

        currentY += boxHeight + 0.12;
      });

      // If table exists (e.g. Slide 4)
      if (data.content.table && currentY <= 5.5) {
        const tableRows: pptxgen.TableRow[] = [];
        
        // Header row
        tableRows.push(
          data.content.table.headers.map(h => ({
            text: h,
            options: { bold: true, fill: "1E293B", color: "FFFFFF", fontSize: 11, align: "center" as const }
          }))
        );

        // Data rows
        data.content.table.rows.forEach(r => {
          tableRows.push(
            r.map(c => ({
              text: c,
              options: { fill: "F1F5F9", color: "334155", fontSize: 10, align: "center" as const }
            }))
          );
        });

        slide.addTable(tableRows, {
          x: 0.6,
          y: currentY + 0.1,
          w: 12.0,
          colW: [3.5, 3.5, 5.0],
          border: { pt: 1, color: "CBD5E1" }
        });
      }

      // Slide Footer
      slide.addText(`Trang ${data.id} / ${SLIDES_DATA.length}  |  App Meta Andon 4M1E1I - Tân Phú (tanphu-4m1e1i)`, {
        x: 0.6,
        y: 7.0,
        fontSize: 10,
        color: "94A3B8",
        fontFace: "Arial"
      });
    }
  });

  // Save the presentation file
  await pptx.writeFile({ fileName: `Huong_Dan_Su_Dung_Meta_Andon_4M1E1I_TanPhu.pptx` });
}
