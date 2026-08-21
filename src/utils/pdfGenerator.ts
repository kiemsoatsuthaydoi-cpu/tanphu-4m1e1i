import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { QualityReport } from "../types";
import { STANDARDIZED_QC_DEPT } from "../data";

export interface PDFExportOptions {
  factoryName: string; // Specific factory or "Tất cả nhà máy"
  dateString: string;
  reports: QualityReport[];
  authorName: string;
}

/**
 * Creates and downloads a fully styled formal daily PDF report.
 * It builds an absolute structural layout in the DOM, compiles it to Canvas,
 * outputs a high-definition PDF using jsPDF, and simulates a Drive upload background process.
 */
export async function generateDailyReportPDF(options: PDFExportOptions): Promise<{
  fileBlob: Blob;
  fileName: string;
}> {
  const { factoryName, dateString, reports, authorName } = options;

  // Create temporary offscreen element for professional full-page report rendering (A4 optimized 1100px)
  const reportContainer = document.createElement("div");
  reportContainer.style.position = "absolute";
  reportContainer.style.left = "-9999px";
  reportContainer.style.top = "-9999px";
  reportContainer.style.width = "1120px";
  reportContainer.style.boxSizing = "border-box";
  reportContainer.style.padding = "24px 32px";
  reportContainer.style.background = "#ffffff";
  reportContainer.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  reportContainer.style.color = "#0f172a";

  // Build high-integrity styling markup
  const headerHtml = `
    <div style="border-bottom: 3px double #1e3a8a; padding-bottom: 16px; margin-bottom: 20px; width: 100%;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 58%; vertical-align: top;">
            <div style="font-weight: 900; font-size: 20px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">CÔNG TY CỔ PHẦN TÂN PHÚ VIỆT NAM</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px; font-weight: 600;">Hệ Thống Trực Quan Hóa Quản Lý Chất Lượng 4M1E1I</div>
            <div style="font-size: 12px; color: #1e293b; font-weight: 700; margin-top: 2px;">BP quản lý: ${STANDARDIZED_QC_DEPT}</div>
          </td>
          <td style="width: 42%; text-align: right; vertical-align: top;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">BÁO CÁO TỔNG HỢP BIẾN ĐỘNG</div>
            <div style="font-size: 12px; color: #334155; margin-top: 4px; font-weight: 600;">Ngày lập: ${dateString}</div>
            <div style="font-size: 11px; color: #64748b; font-family: monospace;">Mã tài liệu: RP-4M1E1I-${dateString.replace(/\//g, "")}</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 24px; width: 100%;">
      <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">BÁO CÁO BIẾN ĐỘNG CHẤT LƯỢNG HÀNG NGÀY</h1>
      <div style="font-size: 15px; font-weight: 800; color: #1e3a8a; margin-top: 6px; text-transform: uppercase;">BỘ PHẬN: ${factoryName}</div>
    </div>
  `;

  // Summary Metrics Widgets (Full-width spanning)
  const summaryAbnormalCount = reports.filter((r) => r.reportType === "KPH" || r.isAbnormal).length;
  const summarySpotlightCount = reports.filter((r) => r.reportType === "DSA" || r.isSpotlight).length;
  const summaryStatsHtml = `
    <div style="display: flex; gap: 16px; margin-bottom: 24px; width: 100%;">
      <div style="flex: 1; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 14px; text-align: center; background-color: #f8fafc;">
        <div style="font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 800;">Tổng số bản tin ghi nhận</div>
        <div style="font-size: 26px; font-weight: 900; color: #1e3a8a; margin-top: 4px;">${reports.length}</div>
      </div>
      <div style="flex: 1; border: 1.5px solid #fecaca; border-radius: 8px; padding: 14px; text-align: center; background-color: #fef2f2;">
        <div style="font-size: 11px; color: #b91c1c; text-transform: uppercase; font-weight: 800;">Không Phù Hợp (KPH)</div>
        <div style="font-size: 26px; font-weight: 900; color: #dc2626; margin-top: 4px;">${summaryAbnormalCount}</div>
      </div>
      <div style="flex: 1; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 14px; text-align: center; background-color: #f0fdf4;">
        <div style="font-size: 11px; color: #047857; text-transform: uppercase; font-weight: 800;">Điểm Sáng (DSA)</div>
        <div style="font-size: 26px; font-weight: 900; color: #059669; margin-top: 4px;">${summarySpotlightCount}</div>
      </div>
    </div>
  `;

  // Build reports table (100% full breadth)
  let tableRows = "";
  if (reports.length === 0) {
    tableRows = `
      <tr>
        <td colspan="5" style="padding: 36px; text-align: center; color: #64748b; font-size: 14px; font-weight: 600;">
          Không ghi nhận sự thay đổi biến động nào trong ngày tại nhà máy này.
        </td>
      </tr>
    `;
  } else {
    reports.forEach((report, index) => {
      const categoryBadgeColor = 
        report.category === "CON NGƯỜI" ? "#4f46e5" :
        report.category === "NGUYÊN VẬT LIỆU" ? "#c026d3" :
        report.category === "MÁY MÓC" ? "#16a34a" :
        report.category === "PHƯƠNG PHÁP" ? "#d97706" :
        report.category === "MÔI TRƯỜNG" ? "#0d9488" : "#475569";

      const statusBadge = report.reportType === "KPH" || report.isAbnormal
        ? `<span style="background-color: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid #fca5a5;">KPH</span>`
        : (report.reportType === "DSA" || report.isSpotlight
          ? `<span style="background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid #6ee7b7;">DSA</span>`
          : `<span style="background-color: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid #cbd5e1;">THƯỜNG</span>`);

      tableRows += `
        <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
          <td style="padding: 12px 8px; font-size: 12px; text-align: center; vertical-align: top; color: #475569; font-weight: 700;">${index + 1}</td>
          <td style="padding: 12px 10px; font-size: 12px; vertical-align: top;">
            <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${report.factory}</div>
            <div style="color: #475569; font-size: 11px; margin-top: 3px; font-weight: 600;">Thời gian: ${report.timestamp}</div>
            <div style="color: #64748b; font-size: 11px;">Bởi: <b style="color: #1e293b;">${report.uploaderName}</b> (${report.uploaderDepartment})</div>
          </td>
          <td style="padding: 12px 8px; vertical-align: top; text-align: center;">
            <span style="background-color: ${categoryBadgeColor}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; white-space: nowrap;">
              ${report.category}
            </span>
          </td>
          <td style="padding: 12px 10px; font-size: 12px; vertical-align: top; line-height: 1.6; color: #1e293b;">
            <div style="font-weight: 600;">${report.content}</div>
            ${report.notes ? `<div style="font-size: 11px; color: #64748b; margin-top: 5px; font-style: italic; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border-left: 3px solid #cbd5e1;">Ghi chú: ${report.notes}</div>` : ""}
          </td>
          <td style="padding: 12px 8px; vertical-align: top; text-align: center;">
            <div style="margin-bottom: 6px;">${statusBadge}</div>
            ${report.imageUrl ? `
              <div style="border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 3px; display: inline-block; background-color: #f8fafc;">
                <img src="${report.imageUrl}" style="width: 80px; height: auto; max-height: 65px; border-radius: 4px; object-fit: contain;" />
                <div style="font-size: 9px; color: #64748b; margin-top: 2px; font-weight: 600;">Compressed (${report.compressedSizeKb}KB)</div>
              </div>
            ` : `<span style="font-size: 11px; color: #94a3b8; font-style: italic;">Không hình ảnh</span>`}
          </td>
        </tr>
      `;
    });
  }

  const reportsTableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1.5px solid #94a3b8;">
      <thead>
        <tr style="background-color: #0f172a; color: white; text-align: left; border-bottom: 2px solid #334155;">
          <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; text-align: center; width: 6%; font-weight: 800;">STT</th>
          <th style="padding: 12px 10px; font-size: 12px; text-transform: uppercase; width: 28%; font-weight: 800;">Chi nhánh / Nhân viên</th>
          <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; text-align: center; width: 18%; font-weight: 800;">Hạng mục (4M1E1I)</th>
          <th style="padding: 12px 10px; font-size: 12px; text-transform: uppercase; width: 32%; font-weight: 800;">Mô tả chi tiết</th>
          <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; text-align: center; width: 16%; font-weight: 800;">Trạng thái / Ảnh</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;

  const footerHtml = `
    <div style="margin-top: 36px; border-top: 2px solid #94a3b8; padding-top: 18px; width: 100%;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 55%; vertical-align: top; font-size: 11px; color: #475569; line-height: 1.5;">
            Để tra cứu trực tuyến, hãy truy cập hệ thống Tân Phú 4M1E1I trong mạng nội bộ.<br/>
            Bản báo cáo PDF được sinh tự động, cam kết tính toàn vẹn và chuẩn mực dữ liệu.
          </td>
          <td style="width: 45%; text-align: right; vertical-align: top;">
            <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">NGƯỜI LẬP BÁO CÁO CÔNG TÁC</div>
            <div style="font-size: 13px; color: #1e3a8a; margin-top: 32px; font-weight: 800; text-decoration: underline;">${authorName}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Xác thực pháp danh Phòng QL Chất Lượng</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  // Attach complete markup
  reportContainer.innerHTML = `
    ${headerHtml}
    ${summaryStatsHtml}
    ${reportsTableHtml}
    ${footerHtml}
  `;

  document.body.appendChild(reportContainer);

  // Compile HTML element to visual Canvas representation with scale 2
  const canvasElement = await html2canvas(reportContainer, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false
  });

  document.body.removeChild(reportContainer);

  // Convert canvas to jsPDF document standard (A4 format: 210mm x 297mm)
  const imgData = canvasElement.toDataURL("image/jpeg", 0.96);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210; // Standard A4 width in mm
  const pageHeight = 297; // Standard A4 height in mm
  const imgWidth = pageWidth;
  const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;
  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Multi-page capability loop if table spans multiple pages
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const cleanFactoryName = factoryName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
  const fileName = `DailyReport_4M1E1I_${cleanFactoryName}_${dateString.replace(/\//g, "-")}.pdf`;
  const fileBlob = pdf.output("blob");

  // Save the record
  pdf.save(fileName);

  return {
    fileBlob,
    fileName
  };
}
