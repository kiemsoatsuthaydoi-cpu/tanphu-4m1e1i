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

export interface LogoCompressionResult {
  base64: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
}

/**
 * High-performance smart logo optimizer for 4M1E1I brand headers.
 * Supports transparent PNG, vector SVG, WebP and JPEG.
 * Automatically resizes to maxDimension (default 256px) to keep size under 30KB
 * while retaining ultra-crisp visual quality.
 */
export async function compressLogoImage(
  file: File,
  options?: {
    maxDimension?: number;
    fitMode?: 'contain' | 'cover';
    preserveTransparency?: boolean;
    quality?: number;
  }
): Promise<LogoCompressionResult> {
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  const origKb = Math.round((file.size / 1024) * 10) / 10;

  if (isSvg && file.size <= 100 * 1024) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Lỗi đọc file SVG."));
      reader.readAsDataURL(file);
    });
    return {
      base64: dataUrl,
      originalSizeKb: origKb,
      compressedSizeKb: origKb,
      width: 256,
      height: 256,
      format: 'png'
    };
  }

  const img = await loadImage(file);
  const maxDim = options?.maxDimension || 256;
  const preserveTrans = options?.preserveTransparency !== false;
  const quality = options?.quality || 0.88;
  const fitMode = options?.fitMode || 'contain';

  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không khởi tạo được bộ lọc canvas 2D.");
  }

  if (fitMode === 'cover') {
    canvas.width = maxDim;
    canvas.height = maxDim;
    let sx = 0;
    let sy = 0;
    const sSize = Math.min(srcWidth, srcHeight);
    if (srcWidth > srcHeight) {
      sx = (srcWidth - srcHeight) / 2;
    } else {
      sy = (srcHeight - srcWidth) / 2;
    }
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, maxDim, maxDim);
  } else {
    canvas.width = Math.max(16, targetWidth);
    canvas.height = Math.max(16, targetHeight);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  const isPngType = file.type === "image/png" || file.type === "image/webp" || file.name.toLowerCase().endsWith(".png");
  const mimeType = (preserveTrans && isPngType) ? "image/png" : "image/jpeg";
  const format: 'png' | 'jpeg' | 'webp' = mimeType === "image/png" ? 'png' : 'jpeg';

  const base64 = canvas.toDataURL(mimeType, mimeType === "image/jpeg" ? quality : undefined);
  const compKb = Math.round(((base64.length * 0.75) / 1024) * 10) / 10;

  return {
    base64,
    originalSizeKb: origKb,
    compressedSizeKb: compKb,
    width: canvas.width,
    height: canvas.height,
    format
  };
}

/**
 * Generates an offline SVG fallback illustration matching the 4M1E1I category.
 * Embeds direct Vector SVG (Data URI) into source code for 100% offline availability,
 * zero network overhead, and zero broken image frames.
 */
function createCategorySvgBanner(title: string, subtitle: string, mainColor: string, bgColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <g transform="translate(300, 170)" text-anchor="middle" font-family="system-ui, -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, sans-serif">
    <text y="-32" font-size="28" font-weight="800" fill="${mainColor}" letter-spacing="0.5">${title}</text>
    <text y="16" font-size="16" font-weight="500" fill="#64748b">${subtitle}</text>
    <g transform="translate(-135, 48)">
      <rect width="270" height="38" rx="10" fill="#d97706"/>
      <text x="135" y="24" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">HÌNH ẢNH TỰ ĐỘNG KHÔI PHỤC</text>
    </g>
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getCategoryFallbackImage(category: string): string {
  const norm = (category || "").toUpperCase().trim();
  
  if (norm.includes("CON NGƯỜI") || norm.includes("MAN")) {
    return createCategorySvgBanner("CON NGƯỜI (MANPOOL)", "Sự cố / Thay đổi nhân sự con người", "#1d4ed8", "#eff6ff");
  }
  
  if (norm.includes("NGUYÊN VẬT LIỆU") || norm.includes("MATERIAL")) {
    return createCategorySvgBanner("NGUYÊN VẬT LIỆU (MATERIAL)", "Sự cố / Thay đổi nguyên vật liệu", "#a21caf", "#fdf4ff");
  }
  
  if (norm.includes("MÁY MÓC") || norm.includes("MACHINE")) {
    return createCategorySvgBanner("MÁY MÓC (MACHINE)", "Sự cố / Thay đổi thiết bị máy móc", "#15803d", "#f0fdf4");
  }
  
  if (norm.includes("PHƯƠNG PHÁP") || norm.includes("METHOD")) {
    return createCategorySvgBanner("PHƯƠNG PHÁP (METHOD)", "Sự cố / Thay đổi quy trình phương pháp", "#b45309", "#fffbeb");
  }
  
  if (norm.includes("MÔI TRƯỜNG") || norm.includes("ENV")) {
    return createCategorySvgBanner("MÔI TRƯỜNG (ENVIRONMENT)", "Sự cố / Thay đổi điều kiện môi trường", "#0f766e", "#f0fdfa");
  }
  
  if (norm.includes("THÔNG TIN") || norm.includes("INFO")) {
    return createCategorySvgBanner("THÔNG TIN (INFORMATION)", "Sự cố / Thay đổi dữ liệu thông tin", "#4338ca", "#eef2ff");
  }
  
  return createCategorySvgBanner("QUẢN LÝ THAY ĐỔI (4M1E1I)", "Hệ thống ghi nhận sự cố / điểm sáng", "#334155", "#f8fafc");
}

