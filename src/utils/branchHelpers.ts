import { UserRole } from "../types";
import { parseReportTimestamp } from "./notificationHelper";

export const isSameBranchOrFactory = (branchA?: string, branchB?: string): boolean => {
  if (!branchA || !branchB) return false;
  
  const cleanA = branchA.trim().toLowerCase();
  const cleanB = branchB.trim().toLowerCase();
  
  if (cleanA === cleanB) return true;

  const codes = ["TPP-CTY", "TPP-BNI", "TPP-LAN", "TPP-314", "DNP-BBM", "DNP-BBC"];
  for (const code of codes) {
    const codeLower = code.toLowerCase();
    const hasA = cleanA.includes(codeLower);
    const hasB = cleanB.includes(codeLower);
    if (hasA && hasB) {
      return true;
    }
  }

  const getParenthesisCode = (str: string): string | null => {
    const match = str.match(/\(([^)]+)\)/);
    return match ? match[1].trim().toUpperCase() : null;
  };
  
  const codeA = getParenthesisCode(branchA);
  const codeB = getParenthesisCode(branchB);
  
  if (codeA && codeB && codeA === codeB) {
    return true;
  }
  
  if (codeA && cleanB.includes(codeA.toLowerCase())) return true;
  if (codeB && cleanA.includes(codeB.toLowerCase())) return true;
  
  return cleanA.includes(cleanB) || cleanB.includes(cleanA);
};

export const getBranchCodeSuffix = (brName: string | undefined | null) => {
  if (!brName || typeof brName !== "string") {
    return "";
  }
  if (brName.startsWith("BRANCH-") || brName.startsWith("DEPT-") || brName.length > 20) {
    return "";
  }
  const match = brName.match(/\(([^)]+)\)/);
  let code = match ? match[1] : "";
  if (!code) {
    const nameWithoutAccents = brName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z40-9\s]/g, "");
    const words = nameWithoutAccents.split(/\s+/).filter(Boolean);
    const lastWord = words[words.length - 1];
    if (lastWord && lastWord === lastWord.toUpperCase() && lastWord.length >= 2) {
      code = lastWord;
    } else {
      code = words.map(w => w[0]?.toUpperCase()).join("");
    }
  }
  if (!code || code.startsWith("BRANCH-") || code.startsWith("DEPT-") || code.length > 10) {
    return "";
  }
  return ` (${code})`;
};

export const isHQOrManagerUser = (currentUser: any): boolean => {
  if (!currentUser) return false;
  const roleUpper = (currentUser.role || "").toString().toUpperCase();
  if (roleUpper === "CHỦ ADMIN" || roleUpper === "ADMIN" || roleUpper.includes("ADMIN") || currentUser.role === UserRole.ADMIN) return true;
  if (roleUpper === "DUYỆT VIÊN" || roleUpper === "REVIEWER" || roleUpper.includes("DUYỆT") || currentUser.role === UserRole.REVIEWER) return true;

  const branchClean = (currentUser.branch || "").toUpperCase();
  const deptClean = (currentUser.department || "").toUpperCase();
  const posClean = (currentUser.position || "").toUpperCase();

  return (
    branchClean.includes("TPP-CTY") ||
    branchClean.includes("DNP-CTY") ||
    branchClean.includes("VĂN PHÒNG CÔNG TY") ||
    branchClean.includes("VĂN PHÒNG TẬP ĐOÀN") ||
    branchClean.includes("CHỦ TỊCH") ||
    branchClean.includes("BAN TGĐ") ||
    branchClean.includes("BAN TỔNG GIÁM ĐỐC") ||
    branchClean.includes("TỔNG GIÁM ĐỐC") ||
    branchClean.includes("TGĐ") ||
    deptClean.includes("BAN TỔNG GIÁM ĐỐC") ||
    deptClean.includes("BAN TGĐ") ||
    deptClean.includes("TỔNG GIÁM ĐỐC") ||
    deptClean.includes("TGĐ") ||
    deptClean.includes("BAN GIÁM ĐỐC") ||
    deptClean.includes("PHÒNG QUẢN LÝ CHẤT LƯỢNG (TPP-CTY)") ||
    posClean.includes("CHỦ TỊCH") ||
    posClean.includes("TỔNG GIÁM ĐỐC") ||
    posClean.includes("TGĐ") ||
    posClean.includes("BAN TGĐ") ||
    posClean.includes("GIÁM ĐỐC") ||
    posClean.includes("TRƯỞNG PHÒNG") ||
    posClean.includes("QUẢN LÝ") ||
    posClean.includes("QUẢN ĐỐC") ||
    roleUpper.includes("TGĐ") ||
    roleUpper.includes("TỔNG GIÁM ĐỐC") ||
    roleUpper.includes("BAN TGĐ") ||
    roleUpper.includes("CHỦ TỊCH")
  );
};

export const canUserManageDirective = (
  currentUser: any,
  reportFactory: string | undefined
): boolean => {
  if (!currentUser) return false;

  const roleUpper = (currentUser.role || "").toString().toUpperCase();
  const isAdminRole =
    roleUpper === "CHỦ ADMIN" ||
    roleUpper === "ADMIN" ||
    roleUpper.includes("ADMIN") ||
    currentUser.role === UserRole.ADMIN;

  // 1. Admin / Group Level Authority (Chủ tịch / Ban Tổng Giám đốc / Admin / Group HQ)
  if (isAdminRole) return true;

  const branchClean = (currentUser.branch || "").toUpperCase();
  const deptClean = (currentUser.department || "").toUpperCase();
  const posClean = (currentUser.position || "").toUpperCase();

  // Ban TGĐ, Văn phòng Tập đoàn/Công ty (TPP-CTY / DNP-CTY), Chủ Tịch, HQ QC, Admin
  const isHQ =
    branchClean.includes("TPP-CTY") ||
    branchClean.includes("DNP-CTY") ||
    branchClean.includes("VĂN PHÒNG CÔNG TY") ||
    branchClean.includes("VĂN PHÒNG TẬP ĐOÀN") ||
    branchClean.includes("CHỦ TỊCH") ||
    branchClean.includes("BAN TGĐ") ||
    branchClean.includes("BAN TỔNG GIÁM ĐỐC") ||
    branchClean.includes("TỔNG GIÁM ĐỐC") ||
    branchClean.includes("TGĐ") ||
    deptClean.includes("BAN TỔNG GIÁM ĐỐC") ||
    deptClean.includes("BAN TGĐ") ||
    deptClean.includes("TỔNG GIÁM ĐỐC") ||
    deptClean.includes("TGĐ") ||
    deptClean.includes("BAN GIÁM ĐỐC") ||
    deptClean.includes("PHÒNG QUẢN LÝ CHẤT LƯỢNG (TPP-CTY)") ||
    posClean.includes("CHỦ TỊCH") ||
    posClean.includes("TỔNG GIÁM ĐỐC") ||
    posClean.includes("TGĐ") ||
    posClean.includes("BAN TGĐ") ||
    roleUpper.includes("TGĐ") ||
    roleUpper.includes("TỔNG GIÁM ĐỐC") ||
    roleUpper.includes("BAN TGĐ") ||
    roleUpper.includes("CHỦ TỊCH");

  if (isHQ) return true;

  // 2. Local Branch Manager / Reviewer
  const isReviewerRole =
    roleUpper === "DUYỆT VIÊN" ||
    roleUpper === "REVIEWER" ||
    roleUpper === "APPROVER" ||
    currentUser.role === UserRole.REVIEWER;

  const isLeaderOrReviewer =
    isReviewerRole ||
    currentUser.canSpeciallyEditDelete ||
    posClean.includes("GIÁM ĐỐC") ||
    posClean.includes("TRƯỞNG PHÒNG") ||
    posClean.includes("QUẢN LÝ") ||
    posClean.includes("QUẢN ĐỐC");

  if (!isLeaderOrReviewer) return false;

  // Compare currentUser.branch with reportFactory using isSameBranchOrFactory
  return isSameBranchOrFactory(currentUser.branch, reportFactory);
};

export const canUserProcessOrResolveReport = (
  currentUser: any,
  reportFactory: string | undefined
): boolean => {
  if (!currentUser) return false;

  const roleUpper = (currentUser.role || "").toString().toUpperCase();
  const isAdminRole = roleUpper === "CHỦ ADMIN" || roleUpper === "ADMIN" || currentUser.role === UserRole.ADMIN;

  // 1. Admin / Group Level Authority (Chủ tịch / Ban Tổng Giám đốc / Admin / Group HQ)
  if (isAdminRole) return true;

  const userBranch = (currentUser.branch || "").toUpperCase();
  const userDept = (currentUser.department || "").toUpperCase();
  const userPos = (currentUser.position || "").toUpperCase();

  // Ban TGĐ, Văn phòng Tập đoàn/Công ty (TPP-CTY / DNP-CTY), HQ Admin
  const isHQUser =
    userBranch.includes("TPP-CTY") ||
    userBranch.includes("DNP-CTY") ||
    userBranch.includes("VĂN PHÒNG CÔNG TY") ||
    userBranch.includes("VĂN PHÒNG TẬP ĐOÀN") ||
    userBranch.includes("CHỦ TỊCH") ||
    userBranch.includes("BAN TGĐ") ||
    userDept.includes("BAN TỔNG GIÁM ĐỐC") ||
    userDept.includes("BAN TGĐ") ||
    userDept.includes("PHÒNG QUẢN LÝ CHẤT LƯỢNG (TPP-CTY)") ||
    userPos.includes("CHỦ TỊCH") ||
    userPos.includes("TỔNG GIÁM ĐỐC") ||
    userPos.includes("BAN TGĐ");

  if (isHQUser) return true;

  // 2. HQ Reports (Văn Phòng Công Ty TPP-CTY or DNP-CTY) can be received & processed by ANY branch!
  const factoryUpper = (reportFactory || "").toUpperCase();
  const isHQReport =
    factoryUpper.includes("TPP-CTY") ||
    factoryUpper.includes("DNP-CTY") ||
    factoryUpper.includes("VĂN PHÒNG CÔNG TY") ||
    factoryUpper.includes("VĂN PHÒNG TẬP ĐOÀN");

  if (isHQReport) return true;

  // 3. For local factory reports, user must belong to that same branch
  return isSameBranchOrFactory(currentUser.branch, reportFactory);
};

export const canUserTransferDnpTpp = (
  currentUser: any,
  report: any
): boolean => {
  if (!currentUser || !report) return false;

  const roleUpper = (currentUser.role || "").toString().toUpperCase();
  const deptUpper = (currentUser.department || "").toString().toUpperCase();
  const posUpper = (currentUser.position || "").toString().toUpperCase();

  // 1. Admin / Ban TGĐ / Special permission
  const isAdmin =
    roleUpper === "CHỦ ADMIN" ||
    roleUpper === "ADMIN" ||
    roleUpper === UserRole.ADMIN ||
    currentUser.canSpeciallyEditDelete === true ||
    deptUpper.includes("BAN TGĐ") ||
    deptUpper.includes("QUẢN TRỊ") ||
    posUpper.includes("ADMIN") ||
    posUpper.includes("TỔNG GIÁM ĐỐC") ||
    posUpper.includes("TGĐ");

  if (isAdmin) return true;

  // 2. Người đăng bài (Uploader / Creator)
  const isUploader =
    (currentUser.id && report.uploaderId && currentUser.id === report.uploaderId) ||
    (currentUser.fullName &&
      report.uploaderName &&
      currentUser.fullName.trim().toLowerCase() === report.uploaderName.trim().toLowerCase()) ||
    (currentUser.phone &&
      report.uploaderPhone &&
      currentUser.phone.trim() === report.uploaderPhone.trim());

  if (isUploader) return true;

  // 3. Trưởng bộ phận của người đăng (Department Manager of Uploader)
  const managerKeywords = [
    "TRƯỞNG PHÒNG",
    "PHÓ PHÒNG",
    "GIÁM ĐỐC",
    "PHÓ GIÁM ĐỐC",
    "TRƯỞNG BAN",
    "PHÓ BAN",
    "TRƯỞNG BỘ PHẬN",
    "PHÓ BỘ PHẬN",
    "QUẢN LÝ",
    "QUẢN ĐỐC",
    "PHÓ QUẢN ĐỐC",
    "CHỦ NHIỆM",
    "DUYỆT VIÊN",
    "CHUYÊN VIÊN CAO CẤP"
  ];

  const isManager =
    currentUser.role === UserRole.REVIEWER ||
    roleUpper.includes("DUYỆT VIÊN") ||
    managerKeywords.some((kw) => posUpper.includes(kw) || deptUpper.includes(kw));

  if (isManager) {
    const uploaderDept = (report.uploaderDepartment || "").trim().toUpperCase();
    const userDept = (currentUser.department || "").trim().toUpperCase();

    const isSameDept =
      uploaderDept &&
      userDept &&
      (uploaderDept === userDept ||
        uploaderDept.includes(userDept) ||
        userDept.includes(uploaderDept));

    const userBranch = (currentUser.branch || "").trim().toUpperCase();
    const reportFactory = (report.factory || "").trim().toUpperCase();

    const isSameBranchOrFactoryCheck =
      userBranch &&
      reportFactory &&
      (userBranch.includes(reportFactory) || reportFactory.includes(userBranch));

    if (isSameDept || (isSameBranchOrFactoryCheck && !uploaderDept)) {
      return true;
    }
  }

  return false;
};

export const formatNameCapitalized = (str: string | undefined | null): string => {
  if (!str) return "";
  
  const commonAbbreviations = new Set([
    "TGĐ", "BGĐ", "BĐH", "CEO", "QC", "QA", "KPH", "5S", "BBM", "BBC", "TPP", "DNP", "BNI", 
    "LAN", "CTY", "KCS", "ISO", "DSA", "HSSE", "PCCC", "NS", "HR", "IT", "PE", "IE", "CBNV",
    "R&D", "QLCL", "B&D", "BOM", "NV", "TP", "P."
  ]);

  return str
    .split(/\s+/)
    .map((rawWord) => {
      if (!rawWord) return "";
      
      // Match leading brackets/symbols like "@", "(", "[", "{", etc.
      const prefixMatch = rawWord.match(/^[@([{\s]+/);
      const prefix = prefixMatch ? prefixMatch[0] : "";
      
      // Match trailing punctuation like ")", "]", "}", ",", ".", ":", ";", "!", "?"
      const suffixMatch = rawWord.match(/[)\]},.!?:;\s]+$/);
      const suffix = suffixMatch ? suffixMatch[0] : "";
      
      // Extract core word without prefix/suffix
      const word = rawWord.slice(prefix.length, rawWord.length - (suffixMatch ? suffix.length : 0));
      if (!word) return rawWord;
      
      const cleanWord = word.replace(/[().,;[\]{}]/g, "").toUpperCase();
      
      // If the word is a known abbreviation, keep it uppercase
      if (commonAbbreviations.has(cleanWord)) {
        return prefix + word.toUpperCase() + suffix;
      }
      
      // Normal word: Capitalize first letter, lowercase the rest
      const lower = word.toLowerCase();
      const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
      return prefix + capitalized + suffix;
    })
    .join(" ");
};

/**
 * Kiểm tra xem bản tin có nằm trong giới hạn 15 ngày kể từ ngày tạo hay không.
 */
export const isReportWithin15Days = (timestamp?: string): boolean => {
  if (!timestamp) return true;
  const reportDate = parseReportTimestamp(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - reportDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 15;
};

/**
 * Kiểm tra quyền Chỉnh sửa bản tin 4M1E1I:
 * 1. Admin / Ban TGĐ: Luôn được sửa (không giới hạn 15 ngày).
 * 2. Duyệt viên (Reviewer / canSpeciallyEditDelete) thuộc cùng chi nhánh/nhà máy:
 *    CHỈ ĐƯỢC SỬA trong vòng 15 ngày kể từ ngày tạo bản tin. Sau 15 ngày -> ẩn/từ chối quyền.
 * 3. Người đăng tin (Uploader):
 *    - Cho phép sửa trong vòng 5 phút (nếu trên mobile) hoặc 15 ngày (nếu desktop), nhưng không được vượt quá 15 ngày.
 */
export const canUserEditReport = (
  currentUser: any,
  report: { timestamp?: string; factory?: string; uploaderId?: string; uploaderName?: string; uploaderPhone?: string },
  options: { isMobile?: boolean } = {}
): boolean => {
  if (!currentUser || !report) return false;

  const roleUpper = (currentUser.role || "").toString().toUpperCase();
  const isAdmin =
    roleUpper === "CHỦ ADMIN" ||
    roleUpper === "ADMIN" ||
    currentUser.role === UserRole.ADMIN ||
    currentUser.id === "USR-ADMIN" ||
    currentUser.isSuperAdmin === true ||
    roleUpper.includes("ADMIN");

  // 1. Admin luôn có toàn quyền
  if (isAdmin) return true;

  // Kiểm tra thời hạn 15 ngày kể từ ngày tạo bản tin
  const within15Days = isReportWithin15Days(report.timestamp);

  // Nếu đã quá 15 ngày -> Duyệt viên và Người dùng thông thường đều KHÔNG ĐƯỢC SỬA (ẨN CHỨC NĂNG)
  if (!within15Days) {
    return false;
  }

  // 2. Duyệt viên / Người có thẩm quyền chi nhánh (trong vòng 15 ngày)
  const isReviewerRole =
    roleUpper === "DUYỆT VIÊN" ||
    roleUpper === "REVIEWER" ||
    roleUpper === "APPROVER" ||
    currentUser.role === UserRole.REVIEWER ||
    currentUser.canSpeciallyEditDelete === true;

  if (isReviewerRole && isSameBranchOrFactory(currentUser.branch, report.factory)) {
    return true;
  }

  // 3. Người đăng tin (Uploader)
  const isUploader =
    (currentUser.id && report.uploaderId && currentUser.id === report.uploaderId) ||
    (currentUser.fullName && report.uploaderName && currentUser.fullName.trim().toLowerCase() === report.uploaderName.trim().toLowerCase()) ||
    (currentUser.phone && report.uploaderPhone && currentUser.phone.trim() === report.uploaderPhone.trim());

  if (isUploader) {
    if (options.isMobile) {
      if (report.timestamp) {
        const reportDate = parseReportTimestamp(report.timestamp);
        const now = new Date();
        const diffMin = (now.getTime() - reportDate.getTime()) / (1000 * 60);
        return diffMin >= 0 && diffMin <= 5;
      }
      return true;
    }
    return true; // Trên desktop, người tạo được sửa trong vòng 15 ngày
  }

  return false;
};

/**
 * Kiểm tra quyền Xóa bản tin 4M1E1I:
 * 1. Admin / Ban TGĐ: Luôn được xóa (không giới hạn 15 ngày).
 * 2. Duyệt viên (Reviewer / canSpeciallyEditDelete) thuộc cùng chi nhánh/nhà máy:
 *    CHỈ ĐƯỢC XÓA trong vòng 15 ngày kể từ ngày tạo bản tin. Sau 15 ngày -> ẩn/từ chối quyền.
 * 3. Người đăng tin (Uploader):
 *    - Cho phép xóa trong vòng 5 phút (nếu trên mobile) hoặc 15 ngày (nếu desktop), nhưng không được vượt quá 15 ngày.
 */
export const canUserDeleteReport = (
  currentUser: any,
  report: { timestamp?: string; factory?: string; uploaderId?: string; uploaderName?: string; uploaderPhone?: string },
  options: { isMobile?: boolean } = {}
): boolean => {
  if (!currentUser || !report) return false;

  const roleUpper = (currentUser.role || "").toString().toUpperCase();
  const isAdmin =
    roleUpper === "CHỦ ADMIN" ||
    roleUpper === "ADMIN" ||
    currentUser.role === UserRole.ADMIN ||
    currentUser.id === "USR-ADMIN" ||
    currentUser.isSuperAdmin === true ||
    roleUpper.includes("ADMIN");

  // 1. Admin luôn có toàn quyền xóa
  if (isAdmin) return true;

  // Kiểm tra thời hạn 15 ngày kể từ ngày tạo bản tin
  const within15Days = isReportWithin15Days(report.timestamp);

  // Nếu đã quá 15 ngày -> Duyệt viên và Người dùng thông thường đều KHÔNG ĐƯỢC XÓA (ẨN CHỨC NĂNG)
  if (!within15Days) {
    return false;
  }

  // 2. Duyệt viên / Người có thẩm quyền chi nhánh (trong vòng 15 ngày)
  const isReviewerRole =
    roleUpper === "DUYỆT VIÊN" ||
    roleUpper === "REVIEWER" ||
    roleUpper === "APPROVER" ||
    currentUser.role === UserRole.REVIEWER ||
    currentUser.canSpeciallyEditDelete === true;

  if (isReviewerRole && isSameBranchOrFactory(currentUser.branch, report.factory)) {
    return true;
  }

  // 3. Người đăng tin (Uploader)
  const isUploader =
    (currentUser.id && report.uploaderId && currentUser.id === report.uploaderId) ||
    (currentUser.fullName && report.uploaderName && currentUser.fullName.trim().toLowerCase() === report.uploaderName.trim().toLowerCase()) ||
    (currentUser.phone && report.uploaderPhone && currentUser.phone.trim() === report.uploaderPhone.trim());

  if (isUploader) {
    if (options.isMobile) {
      if (report.timestamp) {
        const reportDate = parseReportTimestamp(report.timestamp);
        const now = new Date();
        const diffMin = (now.getTime() - reportDate.getTime()) / (1000 * 60);
        return diffMin >= 0 && diffMin <= 5;
      }
      return true;
    }
    return true; // Trên desktop, người tạo được xóa trong vòng 15 ngày
  }

  return false;
};



