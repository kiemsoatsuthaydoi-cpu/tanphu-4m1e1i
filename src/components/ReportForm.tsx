import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, RotateCw, Check, Scissors, AlertTriangle, RefreshCw } from "lucide-react";
import { T } from "./TranslateText";
import { Category4M1E1I, QualityReport, User } from "../types";
import { initialBranches, STANDARDIZED_QC_DEPT } from "../data";
import { loadImage, processImage, CompressingResult } from "../utils/imageProcessor";

interface ReportFormProps {
  currentUser: User;
  editingReport?: QualityReport | null;
  onCancel: () => void;
  onSubmitReport: (data: Omit<QualityReport, "id" | "googleDrivePath">) => void;
  offlineMode: boolean;
}

export default function ReportForm({
  currentUser,
  editingReport,
  onCancel,
  onSubmitReport,
  offlineMode
}: ReportFormProps) {
  // Fields state
  const [selectedBranch, setSelectedBranch] = useState(editingReport?.factory || initialBranches[1].name); // Standard default Chi Nhánh Bắc Ninh
  const [selectedCategory, setSelectedCategory] = useState<Category4M1E1I>(editingReport?.category || "CON NGƯỜI");
  const [timestamp, setTimestamp] = useState("");
  const [content, setContent] = useState(editingReport?.content || "");
  const [notes, setNotes] = useState(editingReport?.notes || "");
  const [isAbnormal, setIsAbnormal] = useState(editingReport?.isAbnormal || false);

  // Image parameters
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalImgUrl, setOriginalImgUrl] = useState<string>("");
  const [rotationAngle, setRotationAngle] = useState(0);
  const [qualitySlider, setQualitySlider] = useState(85);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [compressedResult, setCompressedResult] = useState<CompressingResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format real-time timestamp
  useEffect(() => {
    if (editingReport) {
      setTimestamp(editingReport.timestamp);
    } else {
      const updateClock = () => {
        const d = new Date();
        const hrs = String(d.getHours()).padStart(2, '0');
        const mns = String(d.getMinutes()).padStart(2, '0');
        const scs = String(d.getSeconds()).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        setTimestamp(`${hrs}:${mns}:${scs} ${date}/${month}/${year}`);
      };
      updateClock();
      const interval = setInterval(updateClock, 1000);
      return () => clearInterval(interval);
    }
  }, [editingReport]);

  // Keep re-compressing the image dynamically if raw image, quality, rotation, or crop changes
  useEffect(() => {
    if (!originalImage) {
      if (editingReport?.imageUrl) {
        // Mock fallback results if editing existing report with loaded string
        setCompressedResult({
          compressedBase64: editingReport.imageUrl,
          originalSizeKb: editingReport.originalSizeKb || 350,
          compressedSizeKb: editingReport.compressedSizeKb || 142,
          width: 800,
          height: 600,
          qualityUsed: 0.85
        });
      }
      return;
    }

    const triggerProcessing = async () => {
      setIsCompressing(true);
      try {
        const res = await processImage(originalImage, {
          rotationAngle,
          cropState: cropBox,
          targetMinKb: 100,
          targetMaxKb: 200
        });
        setCompressedResult(res);
      } catch (err) {
        console.error("Lỗi nén ảnh:", err);
      } finally {
        setIsCompressing(false);
      }
    };

    const timer = setTimeout(triggerProcessing, 250); // Debounce resizing checks
    return () => clearTimeout(timer);
  }, [originalImage, rotationAngle, cropBox, qualitySlider, editingReport]);

  // Manual File input trigger
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await loadImage(file);
      setOriginalImage(img);
      const dataUrl = URL.createObjectURL(file);
      setOriginalImgUrl(dataUrl);
      setCropBox(null); // Reset crop box for new uploads
      setRotationAngle(0);
    } catch (err) {
      alert("Không kham nạp được file hình ảnh do lỗi bộ giải mã.");
    }
  };

  // Rotation trigger
  const rotateLeft = () => setRotationAngle((prev) => (prev + 90) % 360);

  // Preset crop helper: Square crop center logic simulator
  const toggleSquareCrop = () => {
    if (cropBox) {
      setCropBox(null);
    } else {
      setCropBox({ x: 12.5, y: 12.5, width: 75, height: 75 }); // Select center square proportional
    }
  };

  // Submit report handler
  const handleSendForm = () => {
    if (!content.trim()) {
      alert("Quý khách hãy bổ sung mô tả sự thay đổi chất lượng.");
      return;
    }

    if (!compressedResult && !editingReport?.imageUrl) {
      alert("Hãy đính kèm hình ảnh minh chứng để đảm bảo tính xác thực.");
      return;
    }

    const reportPayload: Omit<QualityReport, "id" | "googleDrivePath"> = {
      factory: selectedBranch,
      timestamp,
      category: selectedCategory,
      content,
      imageUrl: compressedResult?.compressedBase64 || editingReport?.imageUrl || "",
      compressedSizeKb: compressedResult?.compressedSizeKb || editingReport?.compressedSizeKb || 142,
      originalSizeKb: compressedResult?.originalSizeKb || editingReport?.originalSizeKb || 310,
      uploaderName: currentUser.fullName,
      uploaderPhone: currentUser.phone,
      uploaderId: currentUser.id,
      uploaderDepartment: currentUser.department || STANDARDIZED_QC_DEPT,
      notes: notes.trim() ? notes : undefined,
      isAbnormal
    };

    onSubmitReport(reportPayload);
  };

  return (
    <div className="w-[375px] h-[780px] bg-white text-slate-800 rounded-[36px] border-8 border-slate-800 shadow-2xl flex flex-col relative overflow-hidden select-none">
      {/* Header view standard and title */}
      <div className="bg-[#1e3a8a] text-white px-4 py-3.5 flex items-center shrink-0 border-b border-blue-900 shadow-md">
        <button onClick={onCancel} className="mr-3 hover:scale-110 active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <T className="font-bold text-xs uppercase text-blue-200 tracking-widest block font-serif">PHẦN MỀM TÂN PHÚ</T>
          <T className="font-bold text-sm block">Đăng ký sự thay đổi (Form)</T>
        </div>
        <div className="bg-white text-[#1e3a8a] text-[8px] font-black px-1 py-0.5 rounded tracking-tighter">
          <T>4M1E1I</T>
        </div>
      </div>

      {/* Main scrolling wrapper */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
        {/* Offline notice inside frame */}
        {offlineMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <T className="text-[10px] text-amber-700 leading-tight">
              Tín hiệu kết nối máy chủ ngoại tuyến. Báo cáo này sẽ được lưu tụ tại hàng đợi bộ nhớ và đồng bộ tức thì sau khi thiết bị khôi phục trực tuyến.
            </T>
          </div>
        )}

        {/* 1. Branch selection block (Chi nhánh*) */}
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center mb-1.5 uppercase">
            <T>Chi nhánh ghi nhận*</T>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {initialBranches.map((b) => {
              const br = b.name;
              const isSel = selectedBranch === br;
              // Clean label for interactive grid
              const displayName = br.replace("Chi Nhánh ", "").replace("Nhà máy ", "").replace("Văn Phòng ", "");
              return (
                <button
                  key={br}
                  type="button"
                  onClick={() => setSelectedBranch(br)}
                  className={`px-2.5 py-2 text-[10px] font-semibold rounded-lg text-left border transition-all ${
                    isSel
                      ? "bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-400"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <T>{displayName}</T>
                    {isSel && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Timestamp view-only indicator */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
          <T className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Thời gian ghi nhận*</T>
          <T className="text-xs font-mono text-slate-700 font-bold block mt-0.5">{timestamp}</T>
        </div>

        {/* 3. Factors Grid select buttons (Hạng mục 4M1E1I*) */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase">
            <T>Hạng mục yếu tố biến động (4M1E1I)*</T>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "CON NGƯỜI", color: "bg-indigo-600 border-indigo-400 text-indigo-700" },
              { id: "NGUYÊN VẬT LIỆU", color: "bg-fuchsia-600 border-fuchsia-400 text-fuchsia-700" },
              { id: "MÁY MÓC", color: "bg-emerald-600 border-emerald-400 text-emerald-700" },
              { id: "PHƯƠNG PHÁP", color: "bg-amber-600 border-amber-400 text-amber-700" },
              { id: "MÔI TRƯỜNG", color: "bg-teal-600 border-teal-400 text-teal-700" },
              { id: "THÔNG TIN", color: "bg-slate-600 border-slate-400 text-slate-700" }
            ].map((cat) => {
              const isSel = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as Category4M1E1I)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-center border transition-all ${
                    isSel
                      ? `${cat.color} bg-opacity-10 dark:bg-opacity-50 border-2 shadow-sm ring-1`
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <T>{cat.id}</T>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Photo Evidence (Hình ảnh minh chứng*) */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-700 block uppercase">
            <T>Hình ảnh minh chứng (Nhấp để chụp hoặc tải)*</T>
          </label>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {!originalImage && !editingReport?.imageUrl ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 active:bg-slate-50 transition-colors flex flex-col items-center justify-center text-slate-400"
            >
              <Camera className="w-8 h-8 mb-1.5 text-slate-400 stroke-[1.5]" />
              <T className="text-xs font-semibold">TẢI HOẶC CHỤP HÌNH ẢNH</T>
              <T className="text-[9px] text-slate-400 mt-1">Đường truyền nén WebP tự động lưu lượng</T>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Photo Display Zone */}
              <div className="relative border border-slate-100 rounded-lg overflow-hidden h-40 bg-slate-100 flex items-center justify-center">
                <img
                  src={compressedResult?.compressedBase64 || editingReport?.imageUrl}
                  alt="Review"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
                
                {isCompressing && (
                  <div className="absolute inset-0 bg-slate-900 bg-opacity-40 flex items-center justify-center text-white">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>

              {/* Compression dashboard indices */}
              {compressedResult && (
                <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-indigo-900">
                    <T>Nén thông minh WebP:</T>
                    <T className="text-blue-700">
                      {compressedResult.compressedSizeKb} KB ({Math.round((0.15 - compressedResult.compressedSizeKb / 1000) * 100)}% tối ưu)
                    </T>
                  </div>
                  {/* Progress size gauge pointer */}
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        compressedResult.compressedSizeKb < 100
                          ? "bg-amber-400"
                          : compressedResult.compressedSizeKb <= 200
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, (compressedResult.compressedSizeKb / 250) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono">
                    <T>0 KB / Quá gọn</T>
                    <T className="text-emerald-600 font-bold">100-200 KB Tiêu chuẩn</T>
                    <T>250 KB / Quá nặng</T>
                  </div>

                  {/* Manual canvas adjustments */}
                  <div className="pt-1 border-t border-indigo-100 grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={rotateLeft}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer text-slate-600"
                    >
                      <RotateCw className="w-3 h-3" />
                      <T>XOAY 90°</T>
                    </button>
                    <button
                      type="button"
                      onClick={toggleSquareCrop}
                      className={`px-2 py-1 border rounded text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        cropBox
                          ? "bg-amber-500 border-amber-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Scissors className="w-3 h-3" />
                      <T>{cropBox ? "HUỶ CẮT" : "CẮT VUÔNG"}</T>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer text-[#1e3a8a]"
                    >
                      <Camera className="w-3 h-3" />
                      <T>ĐỔI ẢNH</T>
                    </button>
                  </div>

                  {/* Manual quality sliders */}
                  <div className="pt-2 text-left space-y-1">
                    <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                      <T>Điều chỉnh độ sắc nét mục tiêu:</T>
                      <T className="font-bold text-indigo-700">{qualitySlider}%</T>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={qualitySlider}
                      onChange={(e) => setQualitySlider(Number(e.target.value))}
                      className="w-full accent-indigo-600 bg-slate-300"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Warning abnormal toggle switch */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <T className="text-xs font-bold text-slate-800 block">Sự cố bất thường?</T>
            <T className="text-[9px] text-slate-400 block mt-0.5">Sẽ gửi thông báo đỏ kích hoạt còi cảnh báo cho Admin</T>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAbnormal}
              onChange={(e) => setIsAbnormal(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
          </label>
        </div>

        {/* 6. Content statement description (Nội dung thay đổi*) */}
        <div>
          <label className="text-xs font-bold text-slate-700 flex justify-between items-center mb-1 uppercase">
            <T>Nội dung chất lượng chi tiết*</T>
            <T className="text-[9px] text-slate-400 lowercase font-normal">(Chi tiết yếu tố biến động)</T>
          </label>
          <textarea
            placeholder="Mô tả cụ thể vấn đề chất lượng hay sự đổi mới, ví dụ: 'Bảo dưỡng định kỳ đầu cắm phôi phát hiện bám cặn...'"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white font-medium"
          />
        </div>

        {/* 7. Updater view-only metadata */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <T className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Nhân viên ghi nhận (Tự điền)*</T>
          <div className="flex justify-between items-center mt-1">
            <T className="text-xs font-bold text-slate-700 block">{currentUser.fullName}</T>
            <T className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              {currentUser.role}
            </T>
          </div>
          <T className="text-[10px] text-slate-500 block font-sans mt-0.5 mt-1">
            Bộ phận: {currentUser.department || STANDARDIZED_QC_DEPT}
          </T>
        </div>

        {/* 8. Additional Comments (Ghi chú thêm) */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
            <T>Ghi chú mở rộng / Biện pháp xử lý</T>
          </label>
          <textarea
            placeholder="Nhập ghi chú hoặc biên bản khắc phục hiện trường..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* Primary footer buttons: HỦY BỎ & GỬI BÁO CÁO */}
      <div className="bg-white border-t border-slate-200 p-3.5 grid grid-cols-2 gap-3 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
        >
          <T>HỦY BỎ</T>
        </button>
        <button
          type="button"
          onClick={handleSendForm}
          className="py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#152862] active:bg-[#0c183d] transition-colors shadow-md shadow-blue-100 flex items-center justify-center gap-1 w-full cursor-pointer"
        >
          <T>{editingReport ? "CẬP NHẬT" : "GỬI BÁO CÁO"}</T>
        </button>
      </div>
    </div>
  );
}
