/**
 * Image processing utilities for 4M1E1I system
 * Handles offline-friendly rotation, cropping, WebP conversion,
 * and smart quality tuning on client canvas to target 100KB-200KB.
 */

export interface CompressingResult {
  compressedBase64: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
  qualityUsed: number;
}

/**
 * Loads an image from a native file into an HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Không thể tải tập tin hình ảnh."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes, rotates, crops and compresses an image to WebP/JPEG format,
 * striving to output under 120KB while preserving exceptional visual clarity.
 */
export async function processImage(
  imageSource: HTMLImageElement,
  options: {
    rotationAngle: number; // 0, 90, 180, 270
    cropState?: { x: number; y: number; width: number; height: number } | null;
    targetMinKb?: number; // default 40
    targetMaxKb?: number; // default 120
  }
): Promise<CompressingResult> {
  const rotationAngle = options.rotationAngle % 360;
  const targetMaxKb = options.targetMaxKb || 120;

  // Create primary offscreen canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không khởi tạo được bộ lọc canvas 2D.");
  }

  // Calculate rotating bounding box
  let srcWidth = imageSource.naturalWidth || imageSource.width;
  let srcHeight = imageSource.naturalHeight || imageSource.height;

  // Apply cropping coordinates if provided
  let startX = 0;
  let startY = 0;
  let drawWidth = srcWidth;
  let drawHeight = srcHeight;

  if (options.cropState) {
    const c = options.cropState;
    startX = (c.x / 100) * srcWidth;
    startY = (c.y / 100) * srcHeight;
    drawWidth = (c.width / 100) * srcWidth;
    drawHeight = (c.height / 100) * srcHeight;
  }

  // Set canvas dimensions based on rotation
  const is90or270 = rotationAngle === 90 || rotationAngle === 270;
  if (is90or270) {
    canvas.width = drawHeight;
    canvas.height = drawWidth;
  } else {
    canvas.width = drawWidth;
    canvas.height = drawHeight;
  }

  // Draw rotated/cropped photo on canvas
  ctx.save();
  // Translate to center for rotation
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotationAngle * Math.PI) / 180);
  
  // Draw the image centered
  ctx.drawImage(
    imageSource,
    startX,
    startY,
    drawWidth,
    drawHeight,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  );
  ctx.restore();

  // Smart downscaling to a maximum dimension of 1024px.
  // This maintains excellent crispness while dropping raw file weight significantly.
  const maxDimension = 1024;
  let processingCanvas = canvas;
  if (canvas.width > maxDimension || canvas.height > maxDimension) {
    const scale = maxDimension / Math.max(canvas.width, canvas.height);
    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = Math.round(canvas.width * scale);
    scaledCanvas.height = Math.round(canvas.height * scale);
    const sCtx = scaledCanvas.getContext("2d");
    if (sCtx) {
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = "high";
      sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      processingCanvas = scaledCanvas;
    }
  }

  let finalBase64 = "";
  let finalSizeKb = 0;
  let bestQuality = 0.85;

  // We try descending qualities starting from a high quality (0.85) to medium quality.
  // If the size is already below targetMaxKb, we accept it immediately to preserve maximum clarity.
  const qualityTries = [0.85, 0.75, 0.65, 0.55];
  
  for (const q of qualityTries) {
    const testBase64 = processingCanvas.toDataURL("image/jpeg", q);
    const headLen = testBase64.indexOf(",") + 1;
    const sizeKb = Math.round(((testBase64.length - headLen) * 3) / 4 / 102.4) / 10;
    
    finalBase64 = testBase64;
    finalSizeKb = sizeKb;
    bestQuality = q;

    // If it's already within or under targetMaxKb, stop degrading!
    if (sizeKb <= targetMaxKb) {
      break;
    }
  }

  // If even at quality 0.55 it still exceeds targetMaxKb, we do an extra downscale to max 800px and save at quality 0.70
  if (finalSizeKb > targetMaxKb) {
    const extraScale = 800 / Math.max(processingCanvas.width, processingCanvas.height);
    if (extraScale < 1) {
      const extraCanvas = document.createElement("canvas");
      extraCanvas.width = Math.round(processingCanvas.width * extraScale);
      extraCanvas.height = Math.round(processingCanvas.height * extraScale);
      const eCtx = extraCanvas.getContext("2d");
      if (eCtx) {
        eCtx.imageSmoothingEnabled = true;
        eCtx.imageSmoothingQuality = "high";
        eCtx.drawImage(processingCanvas, 0, 0, extraCanvas.width, extraCanvas.height);
        processingCanvas = extraCanvas;

        const testBase64 = processingCanvas.toDataURL("image/jpeg", 0.70);
        const headLen = testBase64.indexOf(",") + 1;
        finalSizeKb = Math.round(((testBase64.length - headLen) * 3) / 4 / 102.4) / 10;
        finalBase64 = testBase64;
        bestQuality = 0.70;
      }
    }
  }

  // Estimate original size
  const placeholderPng = imageSource.src;
  let estOriginalKb = 500;
  if (placeholderPng.startsWith("data:")) {
    const headLen = placeholderPng.indexOf(",") + 1;
    estOriginalKb = Math.round(((placeholderPng.length - headLen) * 3) / 4 / 10.24) / 100;
  }

  return {
    compressedBase64: finalBase64,
    originalSizeKb: estOriginalKb || 600,
    compressedSizeKb: finalSizeKb,
    width: processingCanvas.width,
    height: processingCanvas.height,
    qualityUsed: bestQuality
  };
}

/**
 * Compresses an uploaded avatar image to a maximum dimension of 200x200 pixels
 * and converts to JPEG at 0.75 quality to achieve extremely small file sizes (~10KB-20KB).
 */
export async function compressAvatar(file: File): Promise<string> {
  const img = await loadImage(file);
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không khởi tạo được bộ lọc canvas 2D.");
  }

  // Create a 200x200 square crop/resize of the avatar
  const size = 200;
  canvas.width = size;
  canvas.height = size;

  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  // Center crop
  let startX = 0;
  let startY = 0;
  let drawSize = srcWidth;

  if (srcWidth > srcHeight) {
    startX = (srcWidth - srcHeight) / 2;
    drawSize = srcHeight;
  } else {
    startY = (srcHeight - srcWidth) / 2;
    drawSize = srcWidth;
  }

  ctx.drawImage(
    img,
    startX,
    startY,
    drawSize,
    drawSize,
    0,
    0,
    size,
    size
  );

  return canvas.toDataURL("image/jpeg", 0.75);
}

/**
 * Generates a beautiful SVG fallback illustration matching the 4M1E1I category when images are offline/pruned.
 */
export function getCategoryFallbackImage(category: string): string {
  const norm = (category || "").toUpperCase().trim();
  
  if (norm.includes("CON NGƯỜI") || norm.includes("MAN")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='40%' font-family='sans-serif' font-size='22' font-weight='bold' fill='%234f46e5' text-anchor='middle' class='notranslate' translate='no'>CON NGƯỜI (MAN)</text><text x='50%' y='60%' font-family='sans-serif' font-size='14' fill='%2364748b' text-anchor='middle' class='notranslate' translate='no'>Sự cố / Thay đổi thao tác hoạt động</text><rect x='100' y='180' width='200' height='30' rx='5' fill='%23ef4444'/><text x='50%' y='200' font-family='sans-serif' font-size='12' font-weight='bold' fill='white' text-anchor='middle' class='notranslate' translate='no'>HÌNH ẢNH TỰ ĐỘNG KHÔI PHỤC</text></svg>";
  }
  
  if (norm.includes("NGUYÊN VẬT LIỆU") || norm.includes("MATERIAL")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%23fdf4ff'/><text x='50%' y='40%' font-family='sans-serif' font-size='22' font-weight='bold' fill='%23c026d3' text-anchor='middle' class='notranslate' translate='no'>NGUYÊN VẬT LIỆU</text><text x='50%' y='60%' font-family='sans-serif' font-size='14' fill='%2364748b' text-anchor='middle' class='notranslate' translate='no'>Sự cố / Thay đổi nguyên vật liệu</text><rect x='100' y='180' width='200' height='30' rx='5' fill='%23f59e0b'/><text x='50%' y='200' font-family='sans-serif' font-size='12' font-weight='bold' fill='white' text-anchor='middle' class='notranslate' translate='no'>HÌNH ẢNH TỰ ĐỘNG KHÔI PHỤC</text></svg>";
  }
  
  if (norm.includes("MÁY MÓC") || norm.includes("MACHINE")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%23f0fdf4'/><text x='50%' y='40%' font-family='sans-serif' font-size='22' font-weight='bold' fill='%2316a34a' text-anchor='middle' class='notranslate' translate='no'>MÁY MÓC (MACHINE)</text><text x='50%' y='60%' font-family='sans-serif' font-size='14' fill='%2364748b' text-anchor='middle' class='notranslate' translate='no'>Sự cố / Thay đổi thiết bị máy móc</text><rect x='100' y='180' width='200' height='30' rx='5' fill='%23d97706'/><text x='50%' y='200' font-family='sans-serif' font-size='12' font-weight='bold' fill='white' text-anchor='middle' class='notranslate' translate='no'>HÌNH ẢNH TỰ ĐỘNG KHÔI PHỤC</text></svg>";
  }
  
  if (norm.includes("PHƯƠNG PHÁP") || norm.includes("METHOD")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%23fffbeb'/><text x='50%' y='40%' font-family='sans-serif' font-size='22' font-weight='bold' fill='%23d97706' text-anchor='middle' class='notranslate' translate='no'>PHƯƠNG PHÁP (METHOD)</text><text x='50%' y='60%' font-family='sans-serif' font-size='14' fill='%2364748b' text-anchor='middle' class='notranslate' translate='no'>Sự cố / Thay đổi quy trình phương pháp</text><rect x='100' y='180' width='200' height='30' rx='5' fill='%233b82f6'/><text x='50%' y='200' font-family='sans-serif' font-size='12' font-weight='bold' fill='white' text-anchor='middle' class='notranslate' translate='no'>HÌNH ẢNH TỰ ĐỘNG KHÔI PHỤC</text></svg>";
  }
  
  if (norm.includes("MÔI TRƯỜNG") || norm.includes("ENV")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%23f0fdfa'/><text x='50%' y='40%' font-family='sans-serif' font-size='22' font-weight='bold' fill='%230d9488' text-anchor='middle' class='notranslate' translate='no'>MÔI TRƯỜNG (ENV)</text><text x='50%' y='60%' font-family='sans-serif' font-size='14' fill='%2364748b' text-anchor='middle' class='notranslate' translate='no'>Sự cố / Thay đổi môi trường làm việc</text><rect x='100' y='180' width='200' height='30' rx='5' fill='%2310b981'/><text x='50%' y='200' font-family='sans-serif' font-size='12' font-weight='bold' fill='white' text-anchor='middle' class='notranslate' translate='no'>HÌNH ẢNH TỰ ĐỘNG KHÔI PHỤC</text></svg>";
  }
  
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='40%' font-family='sans-serif' font-size='22' font-weight='bold' fill='%23475569' text-anchor='middle' class='notranslate' translate='no'>THÔNG TIN (INFO)</text><text x='50%' y='60%' font-family='sans-serif' font-size='14' fill='%2364748b' text-anchor='middle' class='notranslate' translate='no'>Sự cố / Thay đổi luồng thông tin truyền đạt</text><rect x='100' y='180' width='200' height='30' rx='5' fill='%236366f1'/><text x='50%' y='200' font-family='sans-serif' font-size='12' font-weight='bold' fill='white' text-anchor='middle' class='notranslate' translate='no'>HÌNH ẢNH TỰ ĐỘNG KHÔI PHỤC</text></svg>";
}

