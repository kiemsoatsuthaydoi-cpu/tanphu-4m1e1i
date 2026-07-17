import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

        // Nếu lỗi 404 (Không tìm thấy mô hình) thì bỏ qua ngay để chuyển sang mô hình tiếp theo
        if (
          errMsg.includes("404") ||
          errMsg.includes("NOT_FOUND") ||
          errMsg.includes("not found") ||
          errMsg.includes("no longer available")
        ) {
          break; 
        }

        // Chờ ngắn (Backoff) trước khi thử lại lần tiếp theo
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }
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
Nhiệm vụ của bạn là phân tích báo cáo "Không Phù Hợp (KPH)" này và đưa ra phân tích chuyên sâu.

Thông tin báo cáo:
- Nhà máy/Xưởng: ${factory || "Không xác định"}
- Nhóm yếu tố (4M1E1I): ${category || "Không xác định"}
- Nội dung ghi nhận lỗi: ${content || "Trống"}
- Ghi chú thêm: ${notes || "Không có"}
- Các chỉ đạo hiện tại (nếu có): ${directives && directives.length > 0 ? directives.map((d: any) => d.text).join("; ") : "Chưa có"}

Yêu cầu phân tích:
1. Phân tích nguyên nhân gốc rễ theo phương pháp 5-Why (Đặt câu hỏi Tại sao 5 lần để tìm ra nguyên nhân sâu xa dựa trên thông tin được cung cấp, hãy suy luận logic, thực tế với bối cảnh sản xuất của ${companyName}).
2. Đề xuất các biện pháp khắc phục (khẩn cấp trước mắt) và biện pháp phòng ngừa (lâu dài) khả thi, bám sát nhóm yếu tố ${category} của ${companyName}.
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

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
