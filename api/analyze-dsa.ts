import { GoogleGenAI } from "@google/genai";

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

async function generateContentWithFallback(ai: any, prompt: string): Promise<string> {
  const models = [
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.5-flash"
  ];

  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AI Auto-Recovery] Đang gọi mô hình ${model} (Lần thử ${attempt}/2)...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        if (response && response.text) {
          console.log(`[AI Auto-Recovery] Thành công với mô hình ${model}`);
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || "";
        console.warn(`[AI Auto-Recovery] Mô hình ${model} gặp lỗi ở lần thử ${attempt}:`, errMsg);

        if (
          errMsg.includes("404") ||
          errMsg.includes("NOT_FOUND") ||
          errMsg.includes("not found") ||
          errMsg.includes("no longer available")
        ) {
          break; 
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }
    }
  }

  throw lastError || new Error("Không thể kết nối tới bất kỳ mô hình Gemini nào vào lúc này.");
}

export default async function handler(req: any, res: any) {
  // Hỗ trợ CORS cho Vercel
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Phương thức không được hỗ trợ" });
  }

  try {
    const { factory, category, content, notes, directives } = req.body;
    
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
Nhiệm vụ của bạn là phân tích rủi ro kỹ thuật và vận hành cho báo cáo "Điểm Sáng (DSA)" này. Điểm Sáng ghi nhận một cải tiến, sáng kiến hoặc thực hành tốt, nhưng mọi sự thay đổi trong sản xuất đều tiềm ẩn rủi ro chất lượng cần kiểm soát chặt chẽ theo tinh thần 4M1E1I của ${companyName}.

Thông tin Điểm Sáng:
- Nhà máy/Xưởng: ${factory || "Không xác định"}
- Nhóm yếu tố (4M1E1I): ${category || "Không xác định"}
- Nội dung Điểm Sáng / Sáng kiến: ${content || "Trống"}
- Ghi chú thêm: ${notes || "Không có"}
- Các chỉ đạo hiện tại (nếu có): ${directives && directives.length > 0 ? directives.map((d: any) => d.text).join("; ") : "Chưa có"}

Yêu cầu phân tích rủi ro chi tiết:
1. Phân tích các RỦI RO TIỀM ẨN đối với chất lượng sản phẩm và vận hành:
   - Thay đổi kỹ thuật: Ví dụ nếu chế tạo khuôn mới hoặc thay đổi cơ cấu, rủi ro về hình dạng, kích thước, biên dạng sản phẩm... khác biệt so với khuôn cũ (đang sản xuất ổn định), ảnh hưởng tới lắp ráp hoặc chất lượng chức năng.
   - Rủi ro khách hàng không chấp nhận: Khách hàng có thể lo ngại sự thay đổi này làm thay đổi chất lượng sản phẩm, thậm chí sợ người tiêu dùng cuối nghi ngờ là hàng giả/hàng nhái nếu không thông báo trước. Do đó cần kiểm soát quy trình phê duyệt của khách hàng.
   - Các rủi ro khác liên quan đến 4M1E1I (Thiết bị, Con người, Phương pháp, Nguyên vật liệu, Môi trường, Thông tin).
2. QUY TẮC TUÂN THỦ TIÊU CHUẨN và YÊU CẦU KHÁCH HÀNG (Compliance with Standards and Customer Requirements):
   - Nhấn mạnh quy tắc nghiêm ngặt của ${companyName}: TUÂN THỦ TIÊU CHUẨN và YÊU CẦU KHÁCH HÀNG, không tự ý thay đổi quy trình, thông số kỹ thuật hay tiêu chuẩn khi chưa qua phê duyệt chính thức từ các bên liên quan và khách hàng.
   - Mọi thay đổi phải tuân thủ quy trình kiểm soát thay đổi (MOC - Management of Change), phải được thử nghiệm, đánh giá rủi ro và ký duyệt bởi cấp thẩm quyền (QC, Ban Giám đốc, hoặc Khách hàng).
3. Đề xuất các Biện pháp Kiểm soát & Phòng ngừa Rủi ro khả thi:
   - Thử nghiệm (Trial run) và kiểm tra mẫu đầu tiên (First Article Inspection - FAI).
   - Đo đạc kích thước biên dạng 3D so sánh khuôn cũ và khuôn mới.
   - Gửi văn bản thông báo hoặc xin phê duyệt mẫu từ Khách hàng trước khi áp dụng.
   - Đào tạo công nhân về sự thay đổi.

Hãy viết phản hồi bằng tiếng Việt, định dạng Markdown đẹp, rõ ràng, phân cấp tiêu đề rõ ràng, sử dụng bullet points để dễ đọc. Tránh sử dụng ngôn từ lý thuyết suông, hãy hướng tới hành động thực tế tại nhà máy. Tuyệt đối không dùng sai tên pháp nhân (nếu báo cáo này tại nhà máy DNP thì dùng DNP, nếu tại Tân Phú thì dùng Tân Phú, không dùng lẫn lộn). Do không có thẻ chống dịch trong văn bản trả về của AI, hãy trả về văn bản Markdown thông thường.
`;

    const aiText = await generateContentWithFallback(ai, prompt);
    res.status(200).json({ success: true, analysis: aiText });
  } catch (error: any) {
    console.error("Vercel Serverless AI DSA Analysis Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
