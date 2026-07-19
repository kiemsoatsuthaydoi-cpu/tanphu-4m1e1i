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
        console.log(`[AI Chat-5Whys] Đang gọi mô hình ${model} (Lần thử ${attempt}/2)...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        if (response && response.text) {
          console.log(`[AI Chat-5Whys] Thành công với mô hình ${model}`);
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || "";
        console.warn(`[AI Chat-5Whys] Mô hình ${model} gặp lỗi ở lần thử ${attempt}:`, errMsg);

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

    // Xây dựng lịch sử chat dạng text để nhét vào prompt
    let chatHistoryText = "";
    messages.forEach((msg: any) => {
      const roleName = msg.role === "user" ? "Người dùng" : "Trợ lý AI";
      chatHistoryText += `${roleName}: ${msg.content}\n\n`;
    });

    const isDsa = report.reportType === "DSA" || report.isSpotlight || report.isDsaReport;

    const prompt = isDsa ? `
Bạn là ${expertRole}. Bạn đang hỗ trợ người dùng phân tích chuyên sâu các RỦI RO TIỀM ẨN của báo cáo "Điểm Sáng (DSA)" này thông qua một cuộc hội thoại chat trực tiếp trong bảng phân tích rủi ro.

Thông tin Điểm Sáng đang thảo luận:
- Nhà máy/Xưởng: ${factory}
- Nhóm yếu tố (4M1E1I): ${category}
- Nội dung Điểm Sáng / Sáng kiến: ${content}
- Ghi chú thêm: ${notes}
- Các chỉ đạo hiện tại (nếu có): ${directives}

${aiKnowledgeText ? `
DƯỚI ĐÂY LÀ KHO TRI THỨC VÀ TIÊU CHUẨN CHẤT LƯỢNG MỚI NHẤT CỦA CÔNG TY (ISO 9001, BRCGS, BSCI, SCAN...):
${aiKnowledgeText}

Hãy đối chiếu với kho tri thức trên để trả lời người dùng. Nếu người dùng hỏi về nguyên nhân vi phạm, tính nhất quán quy trình, an toàn, an ninh,... hãy trích dẫn chính xác điều khoản, mục nào của tiêu chuẩn tương ứng (ISO 9001, BRCGS, BSCI, SCAN...) đang bị vi phạm hoặc cần lưu ý cải tiến.
` : ""}

Nhiệm vụ của bạn:
1. Hãy trả lời câu hỏi mới nhất của người dùng dưới góc nhìn của một chuyên gia chất lượng dày dạn kinh nghiệm tại ${companyName}.
2. Trả lời một cách thực tế, tập trung vào việc quản lý rủi ro hiện trường sản xuất, giải thích các yếu tố kỹ thuật (ví dụ kích thước/biên dạng khuôn mới khác khuôn cũ), rủi ro khách hàng không chấp nhận (lo ngại người tiêu dùng hiểu lầm là hàng giả), và quy tắc TUÂN THỦ TIÊU CHUẨN và YÊU CẦU KHÁCH HÀNG khi có bất kỳ sự thay đổi nào.
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

${aiKnowledgeText ? `
DƯỚI ĐÂY LÀ KHO TRI THỨC VÀ TIÊU CHUẨN CHẤT LƯỢNG MỚI NHẤT CỦA CÔNG TY (ISO 9001, BRCGS, BSCI, SCAN...):
${aiKnowledgeText}

Hãy đối chiếu với kho tri thức trên để trả lời người dùng. Nếu người dùng hỏi về nguyên nhân vi phạm, tính nhất quán quy trình, an toàn, an ninh,... hãy trích dẫn chính xác điều khoản, mục nào của tiêu chuẩn tương ứng (ISO 9001, BRCGS, BSCI, SCAN...) đang bị vi phạm hoặc cần lưu ý cải tiến.
` : ""}

Nhiệm vụ của bạn:
1. Hãy trả lời câu hỏi mới nhất của người dùng dưới góc nhìn của một chuyên gia chất lượng dày dạn kinh nghiệm tại ${companyName}.
2. Trả lời một cách thực tế, tập trung vào cải tiến hiện trường sản xuất, giải thích các khái niệm 5-Why hoặc đề xuất hành động cụ thể cho nhóm yếu tố 4M1E1I (${category}).
3. Hãy phản hồi ngắn gọn, súc tích, dễ hiểu và chuyên nghiệp.

Lịch sử cuộc thảo luận:
${chatHistoryText}

Hãy viết câu trả lời tiếp theo dưới dạng Markdown thông thường (bằng tiếng Việt), rõ ràng, có phân cấp. Do không có thẻ chống dịch trong văn bản trả về của AI, hãy trả về văn bản Markdown thông thường.
`;

    const replyText = await generateContentWithFallback(ai, prompt);
    res.status(200).json({ success: true, reply: replyText });
  } catch (error: any) {
    console.error("Vercel Serverless Chat Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
