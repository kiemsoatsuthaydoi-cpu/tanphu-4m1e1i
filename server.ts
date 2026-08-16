import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiInstance: any = null;
function getAIInstance() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Hàm gọi Gemini có khả năng tự phục hồi bằng cách thử lại và đổi mô hình dự phòng khi quá tải hoặc lỗi 503/429
async function generateContentWithFallback(ai: any, contentsInput: any): Promise<string> {
  // Thứ tự ưu tiên mô hình: 
  // 1. gemini-3.7-flash (Mô hình chính chất lượng cao)
  // 2. gemini-3.1-flash-lite (Mô hình siêu nhẹ, tốc độ cao, độ trễ thấp, ít nghẽn tải nhất)
  // 3. gemini-flash-latest (Bản flash tiêu chuẩn dự phòng)
  const models = [
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const model = models[mIdx];
    try {
      console.log(`[AI Auto-Recovery] Đang gọi mô hình ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: contentsInput,
      });

      if (response && response.text) {
        console.log(`[AI Auto-Recovery] ✓ Thành công với mô hình ${model}`);
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || JSON.stringify(err) || "";
      const isOverloaded = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");

      if (isOverloaded) {
        console.warn(`[AI Auto-Recovery] Mô hình ${model} đang có tải cao (503/429). Tự động chuyển ngay sang mô hình kế tiếp...`);
        // Chờ nhẹ 300ms rồi lập tức chuyển mô hình kế tiếp
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }

      console.warn(`[AI Auto-Recovery] Mô hình ${model} gặp sự cố:`, errMsg);

      // Nếu lỗi 404 hoặc model không khả dụng, chuyển ngay sang model kế tiếp
      if (
        errMsg.includes("404") ||
        errMsg.includes("NOT_FOUND") ||
        errMsg.includes("not found") ||
        errMsg.includes("no longer available")
      ) {
        continue;
      }

      // Đợi ngắn trước khi thử model khác
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  throw lastError || new Error("Không thể kết nối tới bất kỳ mô hình Gemini nào vào lúc này.");
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze-kph", async (req, res) => {
  try {
    const { factory, category, content, notes, directives, aiKnowledgeText } = req.body;
    
    const ai = getAIInstance();

    const isDnp = factory && (
      factory.includes("DNP") || 
      factory.includes("BBM") || 
      factory.includes("BBC")
    );
    const companyName = isDnp ? "DNP" : "Công Ty Cổ Phần Tân Phú Việt Nam";
    const expertRole = isDnp 
      ? "chuyên gia quản lý chất lượng 4M1E1I của Công ty DNP" 
      : "chuyên gia quản lý chất lượng 4M1E1I của Công Ty Cổ Phần Tân Phú Việt Nam";

    const prompt = `
Bạn là ${expertRole}.
Nhiệm vụ của bạn là phân tích báo cáo "Không Phù Hợp (KPH)" này và đưa ra phân tích chuyên sâu.

Thông tin báo cáo:
- Nhà máy/Xưởng: ${factory || "Không xác định"}
- Nhóm yếu tố (4M1E1I): ${category || "Không xác định"}
- Nội dung ghi nhận lỗi: ${content || "Trống"}
- Ghi chú thêm: ${notes || "Không có"}
- Các chỉ đạo hiện tại (nếu có): ${directives && directives.length > 0 ? directives.map((d: any) => d.text).join("; ") : "Chưa có"}

${aiKnowledgeText ? `Kho tri thức Tiêu chuẩn & Quy trình vận hành áp dụng tại nhà máy:\n${aiKnowledgeText}\n(Hãy đối chiếu và áp dụng chặt chẽ các điều khoản tiêu chuẩn ISO 9001/BRCGS/BSCI/SCAN hoặc quy trình/hướng dẫn công việc liên quan nêu trên)` : ""}

Yêu cầu phân tích:
1. Phân tích nguyên nhân gốc rễ theo phương pháp 5-Why (Đặt câu hỏi Tại sao 5 lần để tìm ra nguyên nhân sâu xa dựa trên thông tin được cung cấp, hãy suy luận logic, thực tế với bối cảnh sản xuất của ${companyName}).
2. Đề xuất các biện pháp khắc phục (khẩn cấp trước mắt) và biện pháp phòng ngừa lâu dài (cơ hội cải tiến) khả thi, bám sát nhóm yếu tố ${category} của ${companyName}. Khi trình bày phần này, hãy sử dụng chính xác tiêu đề "Biện pháp phòng ngừa lâu dài (cơ hội cải tiến)".
3. Gợi ý 1 huy hiệu (Badge) phù hợp nhất cho người phát hiện báo cáo này từ danh sách sau:
   - "Chốt chặn rủi ro" (Nếu báo cáo ngăn chặn kịp thời lỗi nghiêm trọng/sự cố lớn)
   - "Mắt thần" (Nếu phát hiện lỗi nhỏ khó thấy, tinh tế hoặc lỗi tiềm ẩn)
   - "Cảnh báo kịp thời" (Nếu phát hiện biến động nhanh, cần xử lý ngay lập tức)
   - "Thông tin chuẩn mực" (Nếu thông tin ghi nhận cực kỳ chi tiết, hình ảnh rõ ràng, có phân loại chính xác)
   Giải thích ngắn gọn lý do chọn huy hiệu này, nhấn mạnh tầm quan trọng đóng góp nâng cao uy tín cho chất lượng sản phẩm của ${companyName}.

Hãy viết phản hồi bằng tiếng Việt, định dạng Markdown đẹp, rõ ràng, phân cấp tiêu đề rõ ràng, sử dụng bullet points để dễ đọc. Tránh sử dụng ngôn từ lý thuyết suông, hãy hướng tới hành động thực tế tại nhà máy. Tuyệt đối không dùng sai tên pháp nhân (nếu báo cáo này tại nhà máy DNP thì dùng DNP, nếu tại Tân Phú thì dùng Tân Phú, không dùng lẫn lộn). Do không có thẻ chống dịch trong văn bản trả về của AI, hãy trả về văn bản Markdown thông thường.
`;

    const aiText = await generateContentWithFallback(ai, prompt);
    res.json({ success: true, analysis: aiText });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/analyze-dsa", async (req, res) => {
  try {
    const { factory, category, content, notes, directives, aiKnowledgeText } = req.body;
    
    const ai = getAIInstance();

    const isDnp = factory && (
      factory.includes("DNP") || 
      factory.includes("BBM") || 
      factory.includes("BBC")
    );
    const companyName = isDnp ? "DNP" : "Công Ty Cổ Phần Tân Phú Việt Nam";
    const expertRole = isDnp 
      ? "chuyên gia quản lý chất lượng 4M1E1I của Công ty DNP" 
      : "chuyên gia quản lý chất lượng 4M1E1I của Công Ty Cổ Phần Tân Phú Việt Nam";

    const prompt = `
Bạn là ${expertRole}.
Nhiệm vụ của bạn là phân tích toàn diện cả CƠ HỘI và RỦI RO kỹ thuật/vận hành cho báo cáo "Điểm Sáng (DSA)" này. Điểm Sáng ghi nhận một cải tiến, sáng kiến, hoặc thực hành tốt. Mọi cải tiến đều mang lại cơ hội phát triển to lớn, nhưng đồng thời bất kỳ sự thay đổi nào trong sản xuất cũng tiềm ẩn rủi ro chất lượng cần kiểm soát chặt chẽ theo tinh thần 4M1E1I của ${companyName}.

Thông tin Điểm Sáng:
- Nhà máy/Xưởng: ${factory || "Không xác định"}
- Nhóm yếu tố (4M1E1I): ${category || "Không xác định"}
- Nội dung Điểm Sáng / Sáng kiến: ${content || "Trống"}
- Ghi chú thêm: ${notes || "Không có"}
- Các chỉ đạo hiện tại (nếu có): ${directives && directives.length > 0 ? directives.map((d: any) => d.text).join("; ") : "Chưa có"}

${aiKnowledgeText ? `Kho tri thức Tiêu chuẩn & Quy trình vận hành áp dụng tại nhà máy:\n${aiKnowledgeText}\n(Hãy đối chiếu và áp dụng chặt chẽ các điều khoản tiêu chuẩn ISO 9001/BRCGS/BSCI/SCAN hoặc quy trình/hướng dẫn công việc liên quan nêu trên)` : ""}

Yêu cầu phân tích chi tiết:
1. PHÂN TÍCH CƠ HỘI (OPPORTUNITIES):
   - Chỉ ra các cơ hội hợp tác và phát triển thị trường: Ví dụ cơ hội hợp tác sâu rộng, thu hút và thêm khách hàng mới (đặc biệt khi đón tiếp khách hàng đến viếng thăm, audit hệ thống), tăng sản lượng sản xuất, tăng doanh thu, tăng lợi nhuận cho ${companyName}.
   - Cơ hội nâng cao hình ảnh thương hiệu, chuẩn hóa quy trình và nhân rộng sáng kiến này sang các tổ/đội/nhà máy khác.
2. PHÂN TÍCH RỦI RO TIỀM ẨN (RISKS):
   - Rủi ro không đáp ứng năng lực khi sản lượng tăng đột biến: Nhà máy không đáp ứng được tiến độ do hạn chế về thiết bị, kho bãi hoặc hạ tầng, dẫn tới việc cần phải đầu tư thêm (máy móc, mở rộng kho bãi, chỉnh trang cơ sở hạ tầng, nâng cấp hệ thống).
   - Rủi ro từ yêu cầu của khách hàng quá cao hoặc khắt khe: Phải xây dựng và chuẩn bị các tiêu chuẩn phức tạp mà khách hàng yêu cầu, rủi ro phát sinh chi phí vận hành và đào tạo con người.
   - Rủi ro kỹ thuật từ sự thay đổi: Thay đổi thiết kế, khuôn mẫu mới hoặc chuyển đổi nguyên vật liệu có thể dẫn đến rủi ro về hình dạng, kích thước, biên dạng sản phẩm... khác biệt so với khuôn cũ/quy trình cũ đang chạy ổn định.
   - Rủi ro khách hàng không chấp nhận sự thay đổi nếu chưa được thông báo hoặc phê duyệt chính thức trước khi áp dụng.
3. QUY TẮC TUÂN THỦ TIÊU CHUẨN và YÊU CẦU KHÁCH HÀNG (Compliance with Standards and Customer Requirements):
   - Nhấn mạnh quy tắc nghiêm ngặt của ${companyName}: TUÂN THỦ TIÊU CHUẨN và YÊU CẦU KHÁCH HÀNG, tuyệt đối không tự ý thay đổi quy trình, thông số kỹ thuật hay tiêu chuẩn khi chưa qua phê duyệt chính thức từ khách hàng và các bên liên quan.
   - Mọi thay đổi lớn phát sinh từ Điểm Sáng này phải tuân thủ quy trình kiểm soát thay đổi (MOC - Management of Change), phải được chạy thử nghiệm (Trial run), đánh giá rủi ro 4M1E1I và ký duyệt chính thức.
4. ĐỀ XUẤT HÀNH ĐỘNG & BIỆN PHÁP KIỂM SOÁT KHẢ THI:
   - Các hành động thực tế để tối đa hóa và hiện thực hóa các Cơ hội nêu trên.
   - Các giải pháp kiểm soát rủi ro chi tiết: Đầu tư nâng cấp máy móc/nhà xưởng đồng bộ, đo đạc kích thước biên dạng 3D so sánh FAI, gửi văn bản thông báo và xin phê duyệt mẫu từ khách hàng trước khi chạy đại trà, đào tạo công nhân hiện trường.

Hãy viết phản hồi bằng tiếng Việt, định dạng Markdown đẹp, rõ ràng, phân cấp tiêu đề rõ ràng (sử dụng dấu # thích hợp), sử dụng bullet points để dễ đọc. Tránh sử dụng ngôn từ lý thuyết suông, hãy hướng tới hành động thực tế tại nhà máy. Tuyệt đối không dùng sai tên pháp nhân (nếu báo cáo này tại nhà máy DNP thì dùng DNP, nếu tại Tân Phú thì dùng Tân Phú, không dùng lẫn lộn). Do không có thẻ chống dịch trong văn bản trả về của AI, hãy trả về văn bản Markdown thông thường.
`;

    const aiText = await generateContentWithFallback(ai, prompt);
    res.json({ success: true, analysis: aiText });
  } catch (error: any) {
    console.error("AI DSA Analysis Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/chat-5whys", async (req, res) => {
  try {
    const { report, messages, aiKnowledgeText } = req.body;
    if (!report) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin báo cáo (report)" });
    }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: "Thiếu danh sách tin nhắn (messages)" });
    }

    const ai = getAIInstance();

    const factory = report.factory || "Không xác định";
    const category = report.category || "Không xác định";
    const content = report.content || "Trống";
    const notes = report.notes || "Không có";
    const directives = report.directives && report.directives.length > 0 
      ? report.directives.map((d: any) => d.text).join("; ") 
      : "Chưa có";

    const isDnp = factory && (
      factory.includes("DNP") || 
      factory.includes("BBM") || 
      factory.includes("BBC")
    );
    const companyName = isDnp ? "DNP" : "Công Ty Cổ Phần Tân Phú Việt Nam";
    const expertRole = isDnp 
      ? "chuyên gia trợ lý AI quản lý chất lượng 4M1E1I của Công ty DNP" 
      : "chuyên gia trợ lý AI quản lý chất lượng 4M1E1I của Công Ty Cổ Phần Tân Phú Việt Nam";

    let chatHistoryText = "";
    messages.forEach((msg: any) => {
      const roleName = msg.role === "user" ? "Người dùng" : "Trợ lý AI";
      chatHistoryText += `${roleName}: ${msg.content}\n\n`;
    });

    const isDsa = report.reportType === "DSA" || report.isSpotlight || report.isDsaReport;

    const prompt = isDsa ? `
Bạn là ${expertRole}. Bạn đang hỗ trợ người dùng phân tích chuyên sâu các CƠ HỘI & RỦI RO TIỀM ẨN của báo cáo "Điểm Sáng (DSA)" này thông qua một cuộc hội thoại chat trực tiếp trong bảng phân tích cơ hội & rủi ro.

Thông tin Điểm Sáng đang thảo luận:
- Nhà máy/Xưởng: ${factory}
- Nhóm yếu tố (4M1E1I): ${category}
- Nội dung Điểm Sáng / Sáng kiến: ${content}
- Ghi chú thêm: ${notes}
- Các chỉ đạo hiện tại (nếu có): ${directives}

${aiKnowledgeText ? `Kho tri thức Tiêu chuẩn & Quy trình áp dụng tại nhà máy:\n${aiKnowledgeText}\n` : ""}

Nhiệm vụ của bạn:
1. Hãy trả lời câu hỏi mới nhất của người dùng dưới góc nhìn của một chuyên gia chất lượng dày dạn kinh nghiệm tại ${companyName}.
2. Trả lời một cách thực tế, tập trung vào cả việc khai thác cơ hội phát triển (hợp tác, khách hàng mới, tăng sản lượng, doanh thu) và quản lý rủi ro hiện trường sản xuất (nhà máy không đáp ứng kịp, cần đầu tư máy móc, kho bãi, xây dựng tiêu chuẩn, thay đổi kích thước biên dạng sản phẩm), và quy tắc TUÂN THỦ TIÊU CHUẨN và YÊU CẦU KHÁCH HÀNG khi có bất kỳ sự thay đổi nào.
3. Hãy phản hồi ngắn gọn, súc tích, dễ hiểu và chuyên nghiệp.

Lịch sử cuộc thảo luận:
${chatHistoryText}

Hãy viết câu trả lời tiếp theo dưới dạng Markdown thông thường (bằng tiếng Việt), rõ ràng, có phân cấp. Do không có thẻ chống dịch trong văn bản trả về của AI, hãy trả về văn bản Markdown thông thường.
` : `
Bạn là ${expertRole}. Bạn đang hỗ trợ người dùng phân tích chuyên sâu báo cáo "Không Phù Hợp (KPH)" này thông qua một cuộc hội thoại chat trực tiếp trong bảng phân tích 5-Why.

Thông tin báo cáo KPH đang thảo luận:
- Nhà máy/Xưởng: ${factory}
- Nhóm yếu tố (4M1E1I): ${category}
- Nội dung ghi nhận lỗi: ${content}
- Ghi chú thêm: ${notes}
- Các chỉ đạo hiện tại (nếu có): ${directives}

${aiKnowledgeText ? `Kho tri thức Tiêu chuẩn & Quy trình áp dụng tại nhà máy:\n${aiKnowledgeText}\n` : ""}

Nhiệm vụ của bạn:
1. Hãy trả lời câu hỏi mới nhất của người dùng dưới góc nhìn của một chuyên gia chất lượng dày dạn kinh nghiệm tại ${companyName}.
2. Trả lời một cách thực tế, tập trung vào cải tiến hiện trường sản xuất, giải thích các khái niệm 5-Why hoặc đề xuất hành động cụ thể cho nhóm yếu tố 4M1E1I (${category}).
3. Hãy phản hồi ngắn gọn, súc tích, dễ hiểu và chuyên nghiệp.

Lịch sử cuộc thảo luận:
${chatHistoryText}

Hãy viết câu trả lời tiếp theo dưới dạng Markdown thông thường (bằng tiếng Việt), rõ ràng, có phân cấp. Do không có thẻ chống dịch trong văn bản trả về của AI, hãy trả về văn bản Markdown thông thường.
`;

    const replyText = await generateContentWithFallback(ai, prompt);
    res.json({ success: true, reply: replyText });
  } catch (error: any) {
    console.error("Local Chat Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/draft-capa", async (req, res) => {
  try {
    const { report } = req.body;
    if (!report) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin báo cáo (report)" });
    }

    const ai = getAIInstance();

    const factory = report.factory || "Không xác định";
    const category = report.category || "Không xác định";
    const content = report.content || "Trống";
    const notes = report.notes || "Không có";
    const reportType = report.reportType || "KPH (NB)";
    const uploaderName = report.uploaderName || "";
    const imageUrl = report.imageUrl || "";

    const isDnp = factory && (
      factory.includes("DNP") || 
      factory.includes("BBM") || 
      factory.includes("BBC")
    );
    const companyName = isDnp ? "DNP" : "CÔNG TY CỔ PHẦN TÂN PHÚ VIỆT NAM";

    const prompt = `
Bạn là Trợ lý AI Quản Lý Chất Lượng Chuyên Nghiệp của ${companyName}.
Nhiệm vụ của bạn là lập Dự Thảo Báo Cáo Sự Không Phù Hợp (NON-CONFORMITY REPORT / CAPA Form BM01-ISO-QT04-KPPN) dựa trên thông tin bản tin sự cố dưới đây.

Thông tin Bản tin Sự cố:
- Mã bản tin / ID: ${report.id || "Trống"}
- Loại điểm: ${reportType}
- Nhà máy / Xưởng: ${factory}
- Nhóm yếu tố (4M1E1I): ${category}
- Người ghi nhận / báo cáo: ${uploaderName}
- Nội dung ghi nhận: ${content}
- Ghi chú bổ sung: ${notes}
- Đường dẫn ảnh đính kèm (nếu có): ${imageUrl || "Không có"}

YÊU CẦU ĐẦU RA & QUY TẮC ĐỊNH DẠNG:
1. Hãy phân tích kỹ lưỡng văn bản nội dung và ghi chú (trích xuất tên sản phẩm, mã vạch, mã lô, tên khách hàng như INOCHI, v.v.).
2. ĐẶC BIỆT LƯU Ý VỀ XUỐNG DÒNG: Các trường nội dung dài như "ncDescription", "reason", "correction", "traceability", "preventiveAction" nếu có nhiều ý (ví dụ: 1., 2., 3. hoặc các gạch đầu dòng -, hoặc phân tích theo Phương pháp, Con người, Máy móc...), BẮT BUỘC BẮT ĐẦU MỖI Ý BẰNG MỘT DÒNG MỚI (chèn ký tự xuống dòng \n giữa các ý 1., 2., 3.). Tuyệt đối KHÔNG viết liền các ý trên cùng 1 dòng.
3. Hãy trả về DUY NHẤT một chuỗi JSON chuẩn (JSON block) với các trường sau (không thêm văn bản dẫn dắt bên ngoài):

{
  "productName": "Tên sản phẩm (trích xuất hoặc gợi ý phù hợp nhất từ nội dung, ví dụ: Màng bọc thực phẩm PE Shinsen 30cm x 400m)",
  "productCode": "Mã sản phẩm hoặc Barcode (nếu nhận diện được, hoặc để trống nếu không có)",
  "customerName": "Tên khách hàng (nếu có, ví dụ: INOCHI, Khách hàng GT, hoặc để Khách hàng Nội Bộ / Khách hàng đại lý)",
  "ncDescription": "Mô tả chi tiết điểm sự cố Không Phù Hợp (NC Description) mạch lạc, chuẩn mực ISO",
  "reason": "Nguyên nhân gốc rễ của sự KPH (Reason) phân tích theo 4M1E1I (Con người - Man, Thiết bị/Máy - Machine, Nguyên vật liệu - Material, Phương pháp - Method, Môi trường - Environment, Thông tin - Information), các ý xuống dòng \n",
  "correction": "Hành động khắc phục tức thì cho đơn hàng/lô hàng có điểm KPH (Correction), các ý 1., 2. xuống dòng \n",
  "traceability": "Hành động truy xuất nguồn gốc - khoanh vùng lưu kho lô hàng, các ý 1., 2. xuống dòng \n",
  "preventiveAction": "Hành động khắc phục phòng ngừa lâu dài và cải tiến quy trình (Corrective & Preventive action), các ý 1., 2., 3. xuống dòng \n"
}
`;

    let contentsInput: any = prompt;

    if (imageUrl && imageUrl.startsWith("data:image/")) {
      try {
        const matches = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const textWithoutRawImage = prompt.replace(
            `- Đường dẫn ảnh đính kèm (nếu có): ${imageUrl}`,
            `- Ảnh đính kèm: [Hình ảnh thực tế đính kèm bên dưới]`
          );
          contentsInput = [
            textWithoutRawImage,
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ];
        }
      } catch (err) {
        console.warn("Lỗi tách ảnh base64 cho multimodal input:", err);
      }
    }

    const aiText = await generateContentWithFallback(ai, contentsInput);
    
    // Parse JSON from AI response
    let parsedData = null;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("Could not parse JSON from CAPA draft output, returning raw text fallback.");
    }

    if (parsedData) {
      return res.json({ success: true, draft: parsedData });
    } else {
      return res.json({
        success: true,
        draft: {
          productName: content.substring(0, 50),
          productCode: "",
          customerName: "Khách hàng",
          ncDescription: `${content}. ${notes}`,
          reason: "Cần đánh giá bổ sung nguyên nhân 4M1E1I tại xưởng.",
          correction: "Cách ly khoanh vùng lô hàng và thu hồi mẫu kiểm tra.",
          traceability: "Kiểm tra truy xuất lô sản xuất và tồn kho liên quan trong 24h.",
          preventiveAction: "Tăng cường kiểm soát công đoạn sản xuất và tuân thủ quy trình."
        },
        rawText: aiText
      });
    }
  } catch (error: any) {
    console.error("CAPA Draft Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware xử lý lỗi hệ thống Express (đảm bảo luôn trả về JSON thay vì HTML 413/500)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error Handler:", err);
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      error: "Dữ liệu đính kèm quá lớn (Payload Too Large). Vui lòng nén bớt hình ảnh."
    });
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Lỗi xử lý trên máy chủ"
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Trên Vercel không cần app.listen vì Vercel chạy dưới dạng Serverless Functions
  if (process.env.VERCEL) {
    console.log("[Server] Chạy trên Vercel, bỏ qua app.listen độc lập.");
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
