import React, { useState, useEffect, useCallback, useRef } from "react";
import { getBranchCodeSuffix, formatNameCapitalized } from "./utils/branchHelpers";
import { AlertCircle, LogIn, Heart, ShieldCheck, Wifi, WifiOff, RefreshCw, Smartphone, Monitor, Lock, Building, ChevronDown, Briefcase, User as UserIcon, Check, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { T } from "./components/TranslateText";
import {
  User,
  UserRole,
  UserStatus,
  QualityReport,
  Company,
  Branch,
  Department,
  BroadcastNotice,
  ChatMessage,
  ProductionRequest,
  OrderImplementation,
  CatalogProduct,
  CatalogMold,
  ProductionRequestStatus,
  ProductionRequestItem,
  AppNotification,
  ForumTopic,
  ForumReply,
  ForumTopicCategory,
  ForumTopicStatus,
  ErrorCatalogItem
} from "./types";
import { generateNotifications } from "./utils/notificationHelper";
import {
  initialUsers,
  initialReports,
  initialCompanies,
  initialBranches,
  initialDepartments,
  initialBroadcastNotice,
  initialChatMessages,
  STANDARDIZED_QC_DEPT,
  initialProductsCatalog,
  initialMoldsCatalog,
  initialProductionRequests,
  initialProductionRequestItemsMap,
  initialOrderImplementations,
  initialErrorCatalog
} from "./data";
import MobileFrame from "./components/MobileFrame";
import { MobileListOnly } from "./components/MobileListOnly";
import ReportForm from "./components/ReportForm";
import DashboardDesktop from "./components/DashboardDesktop";
import { db } from "./utils/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { 
  COLLECTIONS, 
  seedFirestoreIfNeeded, 
  fetchCollection, 
  saveDocument, 
  deleteDocument 
} from "./utils/firebaseSync";

// Helper to parse date/time string format e.g., "18:15:18 18/06/2026" or "18/06/2026"
const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error: any) {
    console.warn(`[localStorage] Failed to save key "${key}". Quota exceeded or storage is disabled:`, error);
    if (error && (error.name === "QuotaExceededError" || error.code === 22 || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.message?.includes("quota"))) {
      try {
        console.warn("[localStorage] Storage quota exceeded. Automatically clearing older caches to preserve critical user data...");
        // Clear less critical caches to free up space
        localStorage.removeItem("4m1e1i_products_catalog");
        localStorage.removeItem("4m1e1i_molds_catalog");
        localStorage.removeItem("4m1e1i_chats");
        localStorage.removeItem("4m1e1i_broadcasts");
        
        // Try writing the value again after clearing space
        localStorage.setItem(key, value);
        console.log(`[localStorage] Retry writing key "${key}" succeeded after clearing caches!`);
      } catch (retryError) {
        console.warn(`[localStorage] Retry failed for key "${key}":`, retryError);
      }
    }
  }
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[localStorage] Failed to read key "${key}":`, error);
    return null;
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[localStorage] Failed to remove key "${key}":`, error);
  }
};

const safeParseJSON = (jsonStr: string | null, defaultValue: any): any => {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn(`[localStorage] Failed to parse JSON:`, error);
    return defaultValue;
  }
};

const parseReportDate = (dateStr: string | undefined): number => {
  if (!dateStr) return 0;
  const cleanedStr = dateStr.trim();
  // Match HH:mm:ss dd/MM/yy or HH:mm:ss dd/MM/yyyy
  const match = cleanedStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) {
    // Try dd/MM/yy fallback
    const fallbackMatch = cleanedStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (fallbackMatch) {
      const [_, d, m, y] = fallbackMatch;
      const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
      return new Date(year, parseInt(m, 10) - 1, parseInt(d, 10)).getTime();
    }
    return 0;
  }
  const [_, hrs, mns, scs, d, m, y] = match;
  const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
  return new Date(year, parseInt(m, 10) - 1, parseInt(d, 10), parseInt(hrs, 10), parseInt(mns, 10), parseInt(scs, 10)).getTime();
};

const sanitizeAndMigrateBranches = (rawBranches: Branch[]): Branch[] => {
  if (!Array.isArray(rawBranches)) return [];
  
  // 1. Map ID BBM to DNP-BBM to eradicate the old ID, and clean up wrong DNP-CTY/other prefixes for TPP
  let list = rawBranches.map(b => {
    if (b.id === "BBM" || b.id.toLowerCase() === "bbm") {
      return { ...b, id: "DNP-BBM", companyId: "DNP" };
    }
    if (b.id === "DNP-CTY" || b.id.toLowerCase() === "dnp-cty") {
      return { ...b, id: "TPP-CTY", name: "Văn Phòng Công Ty (TPP-CTY)", companyId: "TPP", isScoring: true };
    }
    if (b.id === "DNP-BNI" || b.id.toLowerCase() === "dnp-bni") {
      return { ...b, id: "TPP-BNI", name: "Chi Nhánh Bắc Ninh (TPP-BNI)", companyId: "TPP", isScoring: true };
    }
    if (b.id === "DNP-LAN" || b.id.toLowerCase() === "dnp-lan") {
      return { ...b, id: "TPP-LAN", name: "Chi Nhánh Long An (TPP-LAN)", companyId: "TPP", isScoring: true };
    }
    if (b.id === "DNP-314" || b.id.toLowerCase() === "dnp-314") {
      return { ...b, id: "TPP-314", name: "Nhà máy 314 (TPP-314)", companyId: "TPP", isScoring: true };
    }
    return b;
  });

  // 2. De-duplicate by ID
  const uniqueMap = new Map<string, Branch>();
  list.forEach(b => {
    uniqueMap.set(b.id, b);
  });
  list = Array.from(uniqueMap.values());

  // 3. Force name correctness for DNP-BBM, DNP-BBC, and all standard TPP branches
  list = list.map(b => {
    if (b.id === "DNP-BBM") {
      return { ...b, name: "Nhà máy BBM (DNP-BBM)", companyId: "DNP", isScoring: true };
    }
    if (b.id === "DNP-BBC") {
      return { ...b, name: "Nhà máy BBC (DNP-BBC)", companyId: "DNP", isScoring: true };
    }
    if (b.id === "TPP-CTY") {
      return { ...b, name: "Văn Phòng Công Ty (TPP-CTY)", companyId: "TPP", isScoring: true };
    }
    if (b.id === "TPP-BNI") {
      return { ...b, name: "Chi Nhánh Bắc Ninh (TPP-BNI)", companyId: "TPP", isScoring: true };
    }
    if (b.id === "TPP-LAN") {
      return { ...b, name: "Chi Nhánh Long An (TPP-LAN)", companyId: "TPP", isScoring: true };
    }
    if (b.id === "TPP-314") {
      return { ...b, name: "Nhà máy 314 (TPP-314)", companyId: "TPP", isScoring: true };
    }
    return b;
  });

  // 4. Ensure TPP and DNP standard branches exist
  if (!list.some(b => b.id === "TPP-CTY")) {
    list.push({ id: "TPP-CTY", name: "Văn Phòng Công Ty (TPP-CTY)", companyId: "TPP", isScoring: true });
  }
  if (!list.some(b => b.id === "TPP-BNI")) {
    list.push({ id: "TPP-BNI", name: "Chi Nhánh Bắc Ninh (TPP-BNI)", companyId: "TPP", isScoring: true });
  }
  if (!list.some(b => b.id === "TPP-LAN")) {
    list.push({ id: "TPP-LAN", name: "Chi Nhánh Long An (TPP-LAN)", companyId: "TPP", isScoring: true });
  }
  if (!list.some(b => b.id === "TPP-314")) {
    list.push({ id: "TPP-314", name: "Nhà máy 314 (TPP-314)", companyId: "TPP", isScoring: true });
  }
  if (!list.some(b => b.id === "DNP-BBM")) {
    list.push({ id: "DNP-BBM", name: "Nhà máy BBM (DNP-BBM)", companyId: "DNP", isScoring: true });
  }
  if (!list.some(b => b.id === "DNP-BBC")) {
    list.push({ id: "DNP-BBC", name: "Nhà máy BBC (DNP-BBC)", companyId: "DNP", isScoring: true });
  }

  // Remove any remaining old BBM ID or wrong DNP-CTY ID branch just in case
  list = list.filter(b => b.id !== "BBM" && b.id !== "DNP-CTY");

  return list;
};

const sanitizeAndMigrateDepartments = (rawDepts: Department[]): Department[] => {
  if (!Array.isArray(rawDepts)) return [];
  let list = rawDepts.map(d => {
    let bId = d.branchId;
    if (bId === "BBM") {
      bId = "DNP-BBM";
    }
    let name = d.name || "";
    if (name.includes("(BBM)")) {
      name = name.replace("(BBM)", "(DNP-BBM)");
    }
    if (name.includes("(BBC)")) {
      name = name.replace("(BBC)", "(DNP-BBC)");
    }
    return { ...d, branchId: bId, name };
  });

  // Ensure default departments for DNP-BBM and DNP-BBC exist
  const bbmQCExist = list.some(d => d.branchId === "DNP-BBM" && d.name.includes("Quản Lý Chất Lượng"));
  if (!bbmQCExist) {
    list.push({ id: "bbm-1", name: "Phòng Quản Lý Chất Lượng (DNP-BBM)", branchId: "DNP-BBM" });
  }
  const bbmKTExist = list.some(d => d.branchId === "DNP-BBM" && d.name.includes("Tài chính Kế toán"));
  if (!bbmKTExist) {
    list.push({ id: "bbm-2", name: "Phòng Tài chính Kế toán (DNP-BBM)", branchId: "DNP-BBM" });
  }

  const bbcQCExist = list.some(d => d.branchId === "DNP-BBC" && d.name.includes("Quản Lý Chất Lượng"));
  if (!bbcQCExist) {
    list.push({ id: "bbc-1", name: "Phòng Quản Lý Chất Lượng (DNP-BBC)", branchId: "DNP-BBC" });
  }
  const bbcKTExist = list.some(d => d.branchId === "DNP-BBC" && d.name.includes("Tài chính Kế toán"));
  if (!bbcKTExist) {
    list.push({ id: "bbc-2", name: "Phòng Tài chính Kế toán (DNP-BBC)", branchId: "DNP-BBC" });
  }

  // Group by branchId to migrate DEPT- IDs deterministically
  const branchesMap = new Map<string, Department[]>();
  list.forEach(d => {
    const arr = branchesMap.get(d.branchId) || [];
    arr.push(d);
    branchesMap.set(d.branchId, arr);
  });

  const migratedList: Department[] = [];

  branchesMap.forEach((depts, bId) => {
    const cleanDepts = depts.filter(d => !d.id.startsWith("DEPT-"));
    const dirtyDepts = depts.filter(d => d.id.startsWith("DEPT-"));

    if (dirtyDepts.length === 0) {
      migratedList.push(...cleanDepts);
      return;
    }

    // Determine default prefix for this branch
    let companyId = "TPP";
    if (bId.startsWith("DNP-")) {
      companyId = "DNP";
    } else if (bId.includes("-")) {
      companyId = bId.split("-")[0];
    }

    let base = bId;
    if (base.startsWith(`${companyId}-`)) {
      base = base.substring(companyId.length + 1);
    }
    let prefix = base.toLowerCase();
    if (prefix === "bni") prefix = "bn";
    if (prefix === "lan") prefix = "la";
    if (prefix === "314" || bId.includes("314")) prefix = "nm";

    // Check if the prefix conflicts with another branch's prefix (e.g., TPP-CTY uses "cty", so DNP-CTY must not use "cty")
    const prefixConflict = list.some(otherD => {
      if (otherD.branchId === bId) return false;
      return otherD.id.startsWith(`${prefix}-`);
    });

    if (prefixConflict) {
      prefix = `${companyId.toLowerCase()}-${prefix}`;
    }

    // Now find any existing index suffix under this prefix (e.g., prefix-1, prefix-2)
    let maxIdx = 0;
    cleanDepts.forEach(d => {
      if (d.id.startsWith(`${prefix}-`)) {
        const numPart = d.id.substring(prefix.length + 1);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxIdx) {
          maxIdx = num;
        }
      }
    });

    // Sort dirtyDepts by ID (which has timestamp) so it's stable
    dirtyDepts.sort((a, b) => a.id.localeCompare(b.id));

    // Assign new IDs
    const migratedDirty = dirtyDepts.map(d => {
      maxIdx++;
      return {
        ...d,
        id: `${prefix}-${maxIdx}`
      };
    });

    migratedList.push(...cleanDepts, ...migratedDirty);
  });

  return migratedList;
};

const sanitizeUsers = (rawUsers: User[]): User[] => {
  if (!Array.isArray(rawUsers)) return [];
  return rawUsers.map(u => {
    let br = u.branch || "";
    let dept = u.department || "";
    
    if (br === "Nhà máy BBM (DNP)" || br === "Nhà máy BBM" || br.includes("BBM")) {
      br = "Nhà máy BBM (DNP-BBM)";
    } else if (br === "Nhà máy BBC (DNP)" || br === "Nhà máy BBC" || br.includes("BBC")) {
      br = "Nhà máy BBC (DNP-BBC)";
    } else if (br.includes("Long An") || br.includes("LAN")) {
      br = "Chi Nhánh Long An (TPP-LAN)";
    } else if (br.includes("Bắc Ninh") || br.includes("BNI")) {
      br = "Chi Nhánh Bắc Ninh (TPP-BNI)";
    } else if (br.includes("314")) {
      br = "Nhà máy 314 (TPP-314)";
    } else if (br.includes("CTY") || br.includes("Văn Phòng")) {
      br = "Văn Phòng Công Ty (TPP-CTY)";
    }
    
    // Clean existing suffix from department
    let cleanDept = dept.replace(/\s\([^)]+\)$/, "").trim();
    
    // Auto-correct spelling:
    cleanDept = cleanDept.replace(/Quản\s+lí/gi, "Quản Lý")
                         .replace(/quản\s+lí/gi, "Quản Lý")
                         .replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng")
                         .replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
                         
    let suffix = "";
    if (br.includes("TPP-CTY") || br.includes("Văn Phòng")) {
      suffix = " (TPP-CTY)";
    } else if (br.includes("TPP-BNI") || br.includes("Bắc Ninh")) {
      suffix = " (TPP-BNI)";
    } else if (br.includes("TPP-LAN") || br.includes("Long An")) {
      suffix = " (TPP-LAN)";
    } else if (br.includes("TPP-314") || br.includes("314")) {
      suffix = " (TPP-314)";
    } else if (br.includes("BBM")) {
      suffix = " (DNP-BBM)";
    } else if (br.includes("BBC")) {
      suffix = " (DNP-BBC)";
    }
    
    return { 
      ...u, 
      branch: br, 
      department: suffix ? `${cleanDept}${suffix}` : cleanDept 
    };
  });
};

const sanitizeReports = (rawReports: QualityReport[]): QualityReport[] => {
  if (!Array.isArray(rawReports)) return [];
  const corrected = rawReports.map(r => {
    let fac = r.factory || "";
    let dept = r.uploaderDepartment || "";
    
    // Convert any DNP-CTY to TPP-CTY for company TPP
    if (fac.includes("DNP-CTY") || fac.includes("DNP-CT") || fac.includes("Văn Phòng") || fac.includes("CTY")) {
      fac = "Văn Phòng Công Ty (TPP-CTY)";
    } else if (fac.includes("Bắc Ninh") || fac.includes("BNI") || fac.includes("TPP-BNI")) {
      fac = "Chi Nhánh Bắc Ninh (TPP-BNI)";
    } else if (fac.includes("Long An") || fac.includes("LAN") || fac.includes("TPP-LAN")) {
      fac = "Chi Nhánh Long An (TPP-LAN)";
    } else if (fac.includes("314") || fac.includes("TPP-314")) {
      fac = "Nhà máy 314 (TPP-314)";
    }
    
    if (fac === "Nhà máy Đất Đỏ (BBM)" || fac === "Nhà máy BBM (DNP)" || fac === "Nhà máy BBM" || (fac.includes("BBM") && !fac.includes("DNP-BBM"))) {
      fac = "Nhà máy BBM (DNP-BBM)";
    }
    if (fac === "Nhà máy BBC" || (fac.includes("BBC") && !fac.includes("DNP-BBC"))) {
      fac = "Nhà máy BBC (DNP-BBC)";
    }
    
    if (dept.includes("(BBM)")) {
      dept = dept.replace("(BBM)", "(DNP-BBM)");
    }
    if (dept.includes("(BBC)")) {
      dept = dept.replace("(BBC)", "(DNP-BBC)");
    }
    if (dept.includes("(DNP-CTY)") || dept.includes("(DNP-CT)") || dept.includes("(DNP-CTY)")) {
      dept = dept.replace(/\(DNP-CTY\)/g, "(TPP-CTY)").replace(/\(DNP-CT\)/g, "(TPP-CTY)");
    }
    
    // Enforce correct parentheses suffixes matching the factory/branch
    if (fac === "Văn Phòng Công Ty (TPP-CTY)" && !dept.endsWith("(TPP-CTY)")) {
      dept = dept.replace(/\s*\([^)]+\)$/, "").trim() + " (TPP-CTY)";
    } else if (fac === "Chi Nhánh Bắc Ninh (TPP-BNI)" && !dept.endsWith("(TPP-BNI)")) {
      dept = dept.replace(/\s*\([^)]+\)$/, "").trim() + " (TPP-BNI)";
    } else if (fac === "Chi Nhánh Long An (TPP-LAN)" && !dept.endsWith("(TPP-LAN)")) {
      dept = dept.replace(/\s*\([^)]+\)$/, "").trim() + " (TPP-LAN)";
    } else if (fac === "Nhà máy 314 (TPP-314)" && !dept.endsWith("(TPP-314)")) {
      dept = dept.replace(/\s*\([^)]+\)$/, "").trim() + " (TPP-314)";
    } else if (fac === "Nhà máy BBM (DNP-BBM)" && !dept.endsWith("(DNP-BBM)")) {
      dept = dept.replace(/\s*\([^)]+\)$/, "").trim() + " (DNP-BBM)";
    } else if (fac === "Nhà máy BBC (DNP-BBC)" && !dept.endsWith("(DNP-BBC)")) {
      dept = dept.replace(/\s*\([^)]+\)$/, "").trim() + " (DNP-BBC)";
    }
    
    return { ...r, factory: fac, uploaderDepartment: dept };
  });

  // Sort chronologically (oldest first) to assign unique, deterministic sequential codes
  const sorted = [...corrected].sort((a, b) => {
    const timeA = parseReportDate(a.timestamp);
    const timeB = parseReportDate(b.timestamp);
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });

  const codeMap = new Map<string, string>();
  sorted.forEach((r, idx) => {
    const seq = idx + 1;
    const code = `B${String(seq).padStart(7, "0")}`;
    codeMap.set(r.id, code);
  });

  return corrected.map(r => ({
    ...r,
    reportCode: codeMap.get(r.id) || r.reportCode
  }));
};

const attachLocalImages = (rawReports: QualityReport[]): QualityReport[] => {
  if (!Array.isArray(rawReports)) return [];
  return rawReports.map((r: QualityReport) => {
    const storedImg = safeGetItem(`4m1e1i_img_${r.id}`);
    const storedImgUrls = safeParseJSON(safeGetItem(`4m1e1i_img_urls_${r.id}`), []);
    
    return {
      ...r,
      imageUrl: storedImg || r.imageUrl || "",
      imageUrls: (storedImgUrls && storedImgUrls.length > 0)
        ? storedImgUrls
        : (r.imageUrls && r.imageUrls.length > 0)
          ? r.imageUrls
          : storedImg
            ? [storedImg]
            : r.imageUrl
              ? [r.imageUrl]
              : []
    };
  });
};

export default function App() {
  // Firebase configurations & connection indicators
  const [dbLoading, setDbLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState("Đang kết nối Firestore...");
  const [dbConnected, setDbConnected] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);

  // Persistence state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = safeGetItem("4m1e1i_users");
    let loadedUsers = safeParseJSON(saved, initialUsers);
    // Restore original admin password for Lê Nhật Trường, promote Kim Thị Bích Tuyền and override branch/dept to BBM (DNP-BBM)
    loadedUsers = loadedUsers.map((u: User) => {
      if (u.id === "2024.00912") {
        return {
          ...u,
          role: UserRole.REVIEWER,
          branch: "Nhà máy BBM (DNP-BBM)",
          department: "Phòng Quản Lý Chất Lượng (DNP-BBM)"
        };
      }
      if (u.id === "2018.00281" && u.password === "123456") {
        return { ...u, password: "111222" };
      }
      return u;
    });
    const mapped = loadedUsers.map((u: User) => {
      let deptName = u.department || "";
      let branchName = u.branch || "";
      
      // Auto-correct spelling issues:
      deptName = deptName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
 
      let suffix = "";
      if (branchName.includes("TPP-CTY") || branchName.includes("Văn Phòng")) {
        suffix = " (TPP-CTY)";
      } else if (branchName.includes("TPP-BNI") || branchName.includes("Bắc Ninh")) {
        suffix = " (TPP-BNI)";
      } else if (branchName.includes("TPP-LAN") || branchName.includes("Long An")) {
        suffix = " (TPP-LAN)";
      } else if (branchName.includes("TPP-314") || branchName.includes("314")) {
        suffix = " (TPP-314)";
      } else if (branchName.includes("BBM")) {
        suffix = " (DNP-BBM)";
      } else if (branchName.includes("BBC")) {
        suffix = " (DNP-BBC)";
      }

      // Sanitize default passwords to 123456 as requested by user (only for non-ADMIN users)
      let userPwd = u.password;
      if (u.id === "2018.00281" && (!userPwd || userPwd === "123456")) {
        userPwd = "111222";
      } else {
        const isAdmin = u.role === UserRole.ADMIN;
        if (!isAdmin) {
          if (!userPwd || userPwd === "password123" || userPwd === "111222" || userPwd.startsWith("password") || userPwd === "password" || userPwd.toLowerCase().includes("password")) {
            userPwd = "123456";
          }
        }
      }
      
      if (suffix && deptName) {
        const cleanDeptName = deptName.replace(/\s\([^)]+\)$/, "").trim();
        const standardizedClean = cleanDeptName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
        return {
          ...u,
          password: userPwd,
          department: `${standardizedClean}${suffix}`
        };
      }
      return {
        ...u,
        password: userPwd,
        department: deptName.replace(/\s\([^)]+\)$/, "").trim().replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng")
      };
    });
    return sanitizeUsers(mapped);
  });

  const [reports, setReports] = useState<QualityReport[]>(() => {
    const saved = safeGetItem("4m1e1i_reports");
    const loadedReports = safeParseJSON(saved, initialReports);
    const mapped = loadedReports.map((r: QualityReport) => {
      let dept = r.uploaderDepartment || "";
      dept = dept.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
      return {
        ...r,
        uploaderDepartment: dept
      };
    });
    return sanitizeReports(attachLocalImages(mapped));
  });

  const [errorCatalog, setErrorCatalog] = useState<ErrorCatalogItem[]>(() => {
    const saved = safeGetItem("4m1e1i_error_catalog");
    return safeParseJSON(saved, initialErrorCatalog);
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = safeGetItem("4m1e1i_companies");
    return safeParseJSON(saved, initialCompanies);
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    let raw: Branch[] = [];
    try {
      const saved = safeGetItem("4m1e1i_branches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          raw = parsed.map((b: any) => ({
            ...b,
            isScoring: b.id === "TPP-CTY" ? true : b.isScoring
          }));
        } else {
          raw = initialBranches;
        }
      } else {
        raw = initialBranches;
      }
    } catch (e) {
      console.error("Lỗi parse local storage branches:", e);
      raw = initialBranches;
    }
    return sanitizeAndMigrateBranches(raw);
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    let finalDepts: Department[] = [];
    try {
      const savedBranchesStr = safeGetItem("4m1e1i_branches");
      let loadedBranches: Branch[] = initialBranches;
      try {
        if (savedBranchesStr) {
          const parsedB = JSON.parse(savedBranchesStr);
          if (Array.isArray(parsedB)) {
            loadedBranches = parsedB;
          }
        }
      } catch (e) {}

      const saved = safeGetItem("4m1e1i_departments");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          finalDepts = parsed.map((d: any) => {
            let cleanName = d.name || "";
            cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý");
            cleanName = cleanName.replace(/quản\s+lí/gi, "Quản Lý");
            cleanName = cleanName.replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng");
            cleanName = cleanName.replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

            // Strip any existing suffix like (TPP-CTY) or (BRANCH-...)
            cleanName = cleanName.replace(/\s\([^)]+\)$/, "").trim();

            // Dynamically find branch to determine what suffix to use
            let suffix = "";
            const br = loadedBranches.find((b) => b.id === d.branchId);
            if (br) {
              const brName = br.name || "";
              const match = brName.match(/\(([^)]+)\)/);
              if (match) {
                suffix = ` (${match[1]})`;
              } else {
                // Fallback for custom branch - extract uppercase initials/code
                const words = brName.trim().split(/\s+/);
                const lastWord = words[words.length - 1];
                if (lastWord && lastWord === lastWord.toUpperCase() && lastWord.length >= 2) {
                  suffix = ` (${lastWord})`;
                } else {
                  suffix = "";
                }
              }
            } else {
              if (d.branchId && !d.branchId.startsWith("BRANCH-") && !d.branchId.startsWith("DEPT-") && d.branchId.length <= 10) {
                suffix = ` (${d.branchId})`;
              }
            }

            if (suffix.includes("BRANCH-") || suffix.includes("DEPT-") || suffix.length > 15) {
              suffix = "";
            }

            return {
              ...d,
              name: suffix ? `${cleanName}${suffix}` : cleanName
            };
          });
        } else {
          finalDepts = initialDepartments;
        }
      } else {
        finalDepts = initialDepartments;
      }
    } catch (e) {
      console.error("Lỗi parse local storage departments:", e);
      finalDepts = initialDepartments;
    }
    return sanitizeAndMigrateDepartments(finalDepts);
  });

  const [broadcasts, setBroadcasts] = useState<BroadcastNotice[]>(() => {
    const saved = safeGetItem("4m1e1i_broadcasts");
    return safeParseJSON(saved, initialBroadcastNotice);
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = safeGetItem("4m1e1i_chats");
    return safeParseJSON(saved, initialChatMessages);
  });

  const [topics, setTopics] = useState<ForumTopic[]>(() => {
    const saved = safeGetItem("4m1e1i_topics");
    return safeParseJSON(saved, []);
  });

  const [replies, setReplies] = useState<ForumReply[]>(() => {
    const saved = safeGetItem("4m1e1i_replies");
    return safeParseJSON(saved, []);
  });

  // Offline queue
  const [offlineQueue, setOfflineQueue] = useState<QualityReport[]>(() => {
    const saved = safeGetItem("4m1e1i_offline_queue");
    return safeParseJSON(saved, []);
  });

  // Order pipeline & SCM states
  const [productionRequests, setProductionRequests] = useState<ProductionRequest[]>(() => {
    const saved = safeGetItem("4m1e1i_prod_requests");
    return safeParseJSON(saved, initialProductionRequests);
  });

  const [productionRequestItemsMap, setProductionRequestItemsMap] = useState<Record<string, ProductionRequestItem[]>>(() => {
    const saved = safeGetItem("4m1e1i_prod_request_items");
    return safeParseJSON(saved, initialProductionRequestItemsMap);
  });

  const [orderImplementations, setOrderImplementations] = useState<OrderImplementation[]>(() => {
    const saved = safeGetItem("4m1e1i_order_implementations");
    return safeParseJSON(saved, initialOrderImplementations);
  });

  const [productsCatalog, setProductsCatalog] = useState<CatalogProduct[]>(() => {
    const saved = safeGetItem("4m1e1i_products_catalog");
    return safeParseJSON(saved, initialProductsCatalog);
  });

  const [moldsCatalog, setMoldsCatalog] = useState<CatalogMold[]>(() => {
    const saved = safeGetItem("4m1e1i_molds_catalog");
    return safeParseJSON(saved, initialMoldsCatalog);
  });

  // Global settings
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = safeGetItem("4m1e1i_current_user");
    const u = safeParseJSON(saved, null);
    if (u && u.department) {
      u.department = u.department.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
    }
    return u;
  });

  const [offlineMode, setOfflineMode] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<QualityReport | null>(null);
  const [isNativeScrollActive, setIsNativeScrollActive] = useState(false);
  const [reportsForPrint, setReportsForPrint] = useState<any[] | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleSetNativeScrollActive = (active: boolean, filteredReports?: any[]) => {
    setIsNativeScrollActive(active);
    if (active && filteredReports) {
      setReportsForPrint(filteredReports);
    } else if (!active) {
      setReportsForPrint(null);
    }
  };

  const [isMobile, setIsMobile] = useState(() => {
    return window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [mobileUIConfig, setMobileUIConfig] = useState(() => {
    const saved = safeGetItem("4m1e1i_mobile_ui_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // ignore
      }
    }
    return {
      displayRule: "clean",
      columns: 2,
      padding: "normal",
      colorTheme: "blue",
      fontSize: "xs",
      customAliases: {
        "TPP-CTY": "VP Công Ty",
        "TPP-BNI": "Bắc Ninh",
        "TPP-LAN": "Long An",
        "TPP-314": "Nhà máy 314"
      }
    };
  });

  const [tickerConfig, setTickerConfig] = useState(() => {
    const saved = safeGetItem("4m1e1i_ticker_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // ignore
      }
    }
    return {
      text: "",
      speed: 35,
      spacing: 50
    };
  });

  const [isQcFeatureEnabled, setIsQcFeatureEnabled] = useState(() => {
    const saved = safeGetItem("4m1e1i_qc_feature_enabled");
    return saved !== "false"; // Default to true
  });

  const [aiKnowledgeText, setAiKnowledgeText] = useState(() => {
    return safeGetItem("4m1e1i_ai_knowledge_text") || "";
  });

  useEffect(() => {
    safeSetItem("4m1e1i_qc_feature_enabled", String(isQcFeatureEnabled));
  }, [isQcFeatureEnabled]);

  useEffect(() => {
    safeSetItem("4m1e1i_ticker_config", JSON.stringify(tickerConfig));
  }, [tickerConfig]);

  useEffect(() => {
    safeSetItem("4m1e1i_ai_knowledge_text", aiKnowledgeText);
  }, [aiKnowledgeText]);

  useEffect(() => {
    safeSetItem("4m1e1i_mobile_ui_config", JSON.stringify(mobileUIConfig));
  }, [mobileUIConfig]);

  const wasPopStateRef = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      wasPopStateRef.current = true;
      if (isFormOpen) setIsFormOpen(false);
      if (editingReport) setEditingReport(null);
      if (isNativeScrollActive) {
        setIsNativeScrollActive(false);
        setReportsForPrint(null);
      }
      if (confirmDialog) setConfirmDialog(null);
      setTimeout(() => {
        wasPopStateRef.current = false;
      }, 50);
    };

    const hasActiveOverlay = isFormOpen || !!editingReport || isNativeScrollActive || !!confirmDialog;

    if (hasActiveOverlay) {
      window.history.pushState({ inAppBackable: true }, "");
    } else {
      if (!wasPopStateRef.current) {
        if (window.history.state?.inAppBackable) {
          window.history.back();
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isFormOpen, editingReport, isNativeScrollActive, confirmDialog]);

  const handleUpdateTickerConfig = useCallback((newConfig: any) => {
    setTickerConfig(newConfig);
    if (dbConnected) {
      saveDocument("config", "ticker", newConfig).catch(console.error);
    }
  }, [dbConnected]);

  const handleUpdateAiKnowledge = useCallback((newText: string) => {
    setAiKnowledgeText(newText);
    if (dbConnected) {
      saveDocument("config", "ai_knowledge", { text: newText }).catch(console.error);
    }
  }, [dbConnected]);

  const handleUpdateMobileUIConfig = useCallback((updater: any) => {
    setMobileUIConfig((prev: any) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (dbConnected) {
        saveDocument("config", "mobile_ui", next).catch(console.error);
      }
      return next;
    });
  }, [dbConnected]);

  const [deletedNotifIds, setDeletedNotifIds] = useState<string[]>(() => {
    const saved = safeGetItem("4m1e1i_deleted_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    safeSetItem("4m1e1i_deleted_notifications", JSON.stringify(deletedNotifIds));
  }, [deletedNotifIds]);

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    const saved = safeGetItem("4m1e1i_read_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    safeSetItem("4m1e1i_read_notifications", JSON.stringify(readNotifIds));
  }, [readNotifIds]);

  const handleDeleteNotification = useCallback((id: string) => {
    setDeletedNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      if (dbConnected) {
        saveDocument("config", "deleted_notifications", { ids: next }).catch(console.error);
      }
      return next;
    });
  }, [dbConnected]);

  const systemNotifications = React.useMemo(() => {
    return generateNotifications(reports, deletedNotifIds, broadcasts, chats, users, topics, replies);
  }, [reports, deletedNotifIds, broadcasts, chats, users, topics, replies]);

  const prevBroadcastsRef = useRef<BroadcastNotice[]>([]);
  const isFirstBroadcastsLoadRef = useRef(true);
  
  const prevReportsRef = useRef<QualityReport[]>([]);
  const isFirstReportsLoadRef = useRef(true);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  // Listen and notify for broadcasts updates (real-time publish and delete)
  useEffect(() => {
    if (!broadcasts) return;

    if (isFirstBroadcastsLoadRef.current) {
      if (broadcasts.length > 0) {
        prevBroadcastsRef.current = broadcasts;
        isFirstBroadcastsLoadRef.current = false;
      }
      return;
    }

    const prev = prevBroadcastsRef.current;
    
    // Check for newly added broadcasts
    const added = broadcasts.filter((b) => !prev.some((p) => p.id === b.id));
    // Check for deleted broadcasts
    const deleted = prev.filter((p) => !broadcasts.some((b) => b.id === p.id));

    added.forEach((b) => {
      // Send a browser HTML5 Notification
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification(`📢 BẢN TIN MỚI: ${b.type || "Ban quản trị"}`, {
              body: `${b.sender}: "${b.content}"`,
              icon: "/logo_meta.jpg"
            });
          }
        }
      } catch (err) {
        console.warn("Lỗi thông báo trình duyệt:", err);
      }
      
      // Send a UI Toast notification (only if not sent by current user to avoid duplicate toast)
      const isMyNotice = currentUser && b.sender && b.sender.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
      if (!isMyNotice) {
        showToast(`📢 BẢN TIN MỚI (${b.sender}): "${b.content.substring(0, 50)}..."`, "info");
      }
    });

    deleted.forEach((b) => {
      // Send browser notification
      try {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("🗑️ ĐÃ GỠ BẢN TIN", {
            body: `Bản tin của ${b.sender} đã được gỡ khỏi hệ thống.`,
            icon: "/logo_meta.jpg"
          });
        }
      } catch (err) {
        console.warn(err);
      }
      
      const isMyNotice = currentUser && b.sender && b.sender.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
      if (!isMyNotice) {
        showToast(`🗑️ Đã gỡ bỏ bản tin của ${b.sender}!`, "warning");
      }
    });

    prevBroadcastsRef.current = broadcasts;
  }, [broadcasts, currentUser]);

  // Listen and notify for quality reports updates (real-time new reports and deletes)
  useEffect(() => {
    if (!reports) return;

    if (isFirstReportsLoadRef.current) {
      if (reports.length > 0) {
        prevReportsRef.current = reports;
        isFirstReportsLoadRef.current = false;
      }
      return;
    }

    const prev = prevReportsRef.current;
    
    // Check for newly added reports
    const added = reports.filter((r) => !prev.some((p) => p.id === r.id));
    // Check for deleted reports
    const deleted = prev.filter((p) => !reports.some((r) => r.id === p.id));

    // Check for updated reports with new updateLogs
    reports.forEach((r) => {
      const p = prev.find((x) => x.id === r.id);
      if (p) {
        const prevLogs = p.updateLogs || [];
        const currentLogs = r.updateLogs || [];
        if (currentLogs.length > prevLogs.length) {
          const newLogs = currentLogs.slice(prevLogs.length);
          newLogs.forEach((log) => {
            const cleanLog = log.replace(/\s*\(\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{2}\)\s*$/, "").trim();
            
            // Check if action was made by the current user to prevent self-notification
            let isMyAction = false;
            if (currentUser) {
              const myNameClean = currentUser.fullName.trim().toLowerCase();
              if (cleanLog.toLowerCase().includes(myNameClean)) {
                isMyAction = true;
              }
            }

            if (!isMyAction) {
              let toastText = "";
              const title = "🔄 BẢN TIN CẬP NHẬT";
              
              const likeMatch = cleanLog.match(/^Lượt thích mới \((.*)\)$/);
              const shareMatch = cleanLog.match(/^Chia sẻ mới \((.*)\)$/) || cleanLog.match(/^Tiếp nhận mới \((.*)\)$/);
              const chatMatch = cleanLog.match(/^Tương tác bình luận mới từ (.*?)$/);
              const dirMatch = cleanLog.match(/^Chỉ đạo mới \((.*?): "(.*)"\)$/);
              const ratingMatch = cleanLog.match(/^Đánh giá mới \((.*?): (\d+) sao\)$/);
              const badgeMatch = cleanLog.match(/^Trao huy hiệu mới \((.*?): "(.*?)"\)$/);
              const revokeBadgeMatch = cleanLog.match(/^Thu hồi huy hiệu \((.*?): "(.*?)"\)$/);

              if (likeMatch) {
                toastText = `❤️ ${likeMatch[1]} đã thích bản tin của ${r.uploaderName}`;
              } else if (shareMatch) {
                toastText = `✅ ${shareMatch[1]} đã xác nhận tiếp nhận bản tin của ${r.uploaderName}`;
              } else if (chatMatch) {
                toastText = `💬 ${chatMatch[1]} đã bình luận trên bản tin của ${r.uploaderName}`;
              } else if (dirMatch) {
                toastText = `🛡️ ${dirMatch[1]} chỉ đạo: "${dirMatch[2].substring(0, 30)}..."`;
              } else if (ratingMatch) {
                toastText = `⭐ ${ratingMatch[1]} đã đánh giá chất lượng ${ratingMatch[2]} sao bản tin của ${r.uploaderName}`;
              } else if (badgeMatch) {
                toastText = `🏅 ${badgeMatch[1]} đã trao huy hiệu "${badgeMatch[2]}" cho bản tin của ${r.uploaderName}`;
              } else if (revokeBadgeMatch) {
                toastText = `↩️ ${revokeBadgeMatch[1]} đã thu hồi huy hiệu "${revokeBadgeMatch[2]}"`;
              } else if (cleanLog.includes("Sửa chi tiết") || cleanLog.includes("Sửa chi nhánh") || cleanLog.includes("Sửa hạng mục 4M1E1I") || cleanLog.includes("Sửa ghi chú") || cleanLog.includes("Thay đổi mức cảnh báo") || cleanLog.includes("Sửa ảnh")) {
                toastText = `✏️ Bản tin của ${r.uploaderName} vừa được cập nhật: ${cleanLog}`;
              }

              if (toastText) {
                try {
                  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    new Notification(title, {
                      body: toastText,
                      icon: "/logo_meta.jpg"
                    });
                  }
                } catch (err) {
                  console.warn(err);
                }
                showToast(toastText, "info");
              }
            }
          });
        }
      }
    });

    added.forEach((r) => {
      const isMyReport = currentUser && r.uploaderName && r.uploaderName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
      if (!isMyReport) {
        // Send a browser HTML5 Notification
        try {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`📝 BÁO CÁO 4M1E1I MỚI`, {
              body: `${r.uploaderName} tại ${r.factory}: "${r.content.substring(0, 60)}..."`,
              icon: "/logo_meta.jpg"
            });
          }
        } catch (err) {
          console.warn(err);
        }
        
        showToast(`📝 BÁO CÁO MỚI từ ${r.uploaderName} (${r.factory}): "${r.content.substring(0, 45)}..."`, "info");
      }
    });

    deleted.forEach((r) => {
      const isMyReport = currentUser && r.uploaderName && r.uploaderName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
      if (!isMyReport) {
        showToast(`🗑️ Báo cáo chất lượng tại ${r.factory} đã được xóa bởi quản lý!`, "warning");
      }
    });

    prevReportsRef.current = reports;
  }, [reports, currentUser]);

  // Sign up and login screens
  const [authScreen, setAuthScreen] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [loginId, setLoginId] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");

  // Registration form inputs
  const [regFullName, setRegFullName] = useState("");
  const [regId, setRegId] = useState(""); // YYYY.XXXXX
  const [regPhone, setRegPhone] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regDepartment, setRegDepartment] = useState("");
  const [regBranch, setRegBranch] = useState("");
  const [regPosition, setRegPosition] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.STAFF);
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [isOpenRegCompany, setIsOpenRegCompany] = useState(false);
  const [isOpenRegBranch, setIsOpenRegBranch] = useState(false);
  const [isOpenRegDept, setIsOpenRegDept] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Synchronize and Cascade registration selections with master data lists
  useEffect(() => {
    if (!regCompany) return; // Do not force initial company selection on load
    if (companies && companies.length > 0) {
      const exists = companies.some((c) => c.id === regCompany);
      if (!exists) {
        setRegCompany("");
        setRegBranch("");
        setRegDepartment("");
      }
    }
  }, [companies, regCompany, branches]);

  useEffect(() => {
    if (!regCompany) {
      setRegBranch("");
      setRegDepartment("");
      return;
    }
    const companyBranches = branches.filter((b) => b.companyId === regCompany);
    if (companyBranches.length > 0) {
      if (regBranch) {
        const hasCurrentBranch = companyBranches.some((b) => {
          const nameWithSuffix = b.name.includes("(") 
            ? b.name 
            : `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
          return b.name === regBranch || nameWithSuffix === regBranch;
        });
        if (!hasCurrentBranch) {
          // Clear branch and department if they don't match the selected company
          setRegBranch("");
          setRegDepartment("");
        }
      }
    } else {
      setRegBranch("");
      setRegDepartment("");
    }
  }, [regCompany, branches, regBranch]);

  useEffect(() => {
    if (!regBranch) {
      setRegDepartment("");
      return;
    }
    const selectedB = branches.find((b) => {
      const nameWithSuffix = b.name.includes("(") 
        ? b.name 
        : `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
      return b.name === regBranch || nameWithSuffix === regBranch;
    });
    if (selectedB) {
      const branchDepts = departments.filter((d) => d.branchId === selectedB.id);
      if (branchDepts.length > 0) {
        if (regDepartment) {
          const hasCurrentDept = branchDepts.some((d) => {
            const nameWithSuffix = d.name.includes(`(${selectedB.id})`)
              ? d.name
              : `${d.name.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
            return d.name === regDepartment || nameWithSuffix === regDepartment;
          });
          if (!hasCurrentDept) {
            // Clear department if it doesn't match the selected branch
            setRegDepartment("");
          }
        }
      } else {
        setRegDepartment("");
      }
    } else {
      setRegDepartment("");
    }
  }, [regBranch, branches, departments, regDepartment]);

  const getFormattedUserBranch = (userBranchText: string, companyId?: string) => {
    if (!userBranchText) return "";
    if (/\([^)]+\)$/.test(userBranchText)) {
      return userBranchText;
    }
    const foundBranch = branches.find(
      (b) => b.name === userBranchText || b.name.replace(/\s*\([^)]+\)$/, "").trim() === userBranchText.replace(/\s*\([^)]+\)$/, "").trim()
    );
    if (foundBranch) {
      return `${userBranchText} (${foundBranch.companyId})`;
    }
    if (companyId) {
      return `${userBranchText} (${companyId})`;
    }
    return userBranchText;
  };

  const getFormattedUserDept = (userDeptText: string, userBranchText: string) => {
    if (!userDeptText) return "";
    if (/\([^)]+\)$/.test(userDeptText)) {
      return userDeptText;
    }
    const foundBranch = branches.find(
      (b) => b.name === userBranchText || b.name.replace(/\s*\([^)]+\)$/, "").trim() === userBranchText.replace(/\s*\([^)]+\)$/, "").trim()
    );
    if (foundBranch) {
      return `${userDeptText} (${foundBranch.id})`;
    }
    return userDeptText;
  };

  // Format employee ID helper (auto-insertion of dot, restricts length of 10, allows numbers and dot, removes spaces)
  const formatEmployeeId = (value: string, prevValue: string) => {
    let val = value.replace(/\s+/g, "");
    val = val.replace(/[^0-9.]/g, "");
    const isDeleting = val.length < prevValue.length;
    const digitsOnly = val.replace(/\./g, "");

    if (isDeleting) {
      return val.slice(0, 10);
    }
    if (digitsOnly.length >= 4) {
      return (digitsOnly.slice(0, 4) + "." + digitsOnly.slice(4)).slice(0, 10);
    }
    return digitsOnly.slice(0, 10);
  };

  // Format phone number helper (only allows digits, max 10 digits, auto adds space for "xxxx xxx xxx")
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const sliced = digits.slice(0, 10);
    if (sliced.length <= 4) {
      return sliced;
    }
    if (sliced.length <= 7) {
      return `${sliced.slice(0, 4)} ${sliced.slice(4)}`;
    }
    return `${sliced.slice(0, 4)} ${sliced.slice(4, 7)} ${sliced.slice(7)}`;
  };

  const isRegIdValid = /^\d{4}\.\d{5}$/.test(regId);
  const isLoginIdValid = /^\d{4}\.\d{5}$/.test(loginId);
  const isRegPhoneValid = regPhone.replace(/\s+/g, "").length === 10 && regPhone.replace(/\s+/g, "").startsWith("0");
  const isLoginPhoneValid = loginPhone.replace(/\s+/g, "").length === 10 && loginPhone.replace(/\s+/g, "").startsWith("0");

  // Synchronize with Firestore function
  const syncFromDb = async (isManual = false) => {
    if (!db) {
      setDbLoading(false);
      setDbStatus("Chế độ Offline/Local (VITE_FIREBASE_CONF chưa được cấu hình)");
      return;
    }
    try {
      const [
        fUsers,
        fReports,
        fCompanies,
        fBranches,
        fDepts,
        fBroadcasts,
        fChats,
        fProdRequests,
        fRequestItems,
        fOrderImpls,
        fProducts,
        fMolds,
        fConfigs,
        fTopics,
        fReplies
      ] = await Promise.all([
        fetchCollection<User>(COLLECTIONS.USERS),
        fetchCollection<QualityReport>(COLLECTIONS.REPORTS),
        fetchCollection<Company>(COLLECTIONS.COMPANIES),
        fetchCollection<Branch>(COLLECTIONS.BRANCHES),
        fetchCollection<Department>(COLLECTIONS.DEPARTMENTS),
        fetchCollection<BroadcastNotice>(COLLECTIONS.BROADCASTS),
        fetchCollection<ChatMessage>(COLLECTIONS.CHATS),
        fetchCollection<ProductionRequest>(COLLECTIONS.PRODUCTION_REQUESTS),
        fetchCollection<{ prId: string; items: any[] }>(COLLECTIONS.PRODUCTION_REQUEST_ITEMS),
        fetchCollection<OrderImplementation>(COLLECTIONS.ORDER_IMPLEMENTATIONS),
        fetchCollection<CatalogProduct>(COLLECTIONS.PRODUCTS_CATALOG),
        fetchCollection<CatalogMold>(COLLECTIONS.MOLDS_CATALOG),
        fetchCollection<any>("config"),
        fetchCollection<ForumTopic>(COLLECTIONS.TOPICS),
        fetchCollection<ForumReply>(COLLECTIONS.TOPIC_REPLIES)
      ]);

      let finalUsers = fUsers.length > 0 ? fUsers : [...users];
      finalUsers = sanitizeUsers(finalUsers.map((u) => {
        let userPwd = u.password;
        if (u.id === "2018.00281" && (!userPwd || userPwd === "123456")) {
          userPwd = "111222";
        } else {
          const isAdmin = u.role === UserRole.ADMIN;
          if (!isAdmin) {
            if (!userPwd || userPwd === "password123" || userPwd === "111222" || userPwd.startsWith("password") || userPwd === "password" || userPwd.toLowerCase().includes("password")) {
              userPwd = "123456";
            }
          }
        }
        let deptName = u.department || "";
        deptName = deptName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
        deptName = deptName.replace(/\s\([^)]+\)$/, "").trim();
        
        let suffix = "";
        let branchName = u.branch || "";
        if (branchName.includes("TPP-CTY") || branchName.includes("Văn Phòng")) {
          suffix = " (TPP-CTY)";
        } else if (branchName.includes("TPP-BNI") || branchName.includes("Bắc Ninh")) {
          suffix = " (TPP-BNI)";
        } else if (branchName.includes("TPP-LAN") || branchName.includes("Long An")) {
          suffix = " (TPP-LAN)";
        } else if (branchName.includes("TPP-314") || branchName.includes("314")) {
          suffix = " (TPP-314)";
        } else if (branchName.includes("BBM")) {
          suffix = " (DNP-BBM)";
        } else if (branchName.includes("BBC")) {
          suffix = " (DNP-BBC)";
        }
        
        return {
          ...u,
          password: userPwd,
          department: suffix ? `${deptName}${suffix}` : deptName
        };
      }));
      setUsers(finalUsers);

      const finalReports = sanitizeReports(attachLocalImages(fReports.length > 0 ? fReports : [...reports]));
      setReports(finalReports);

      let latestCompanies = fCompanies.length > 0 ? fCompanies : [...companies];
      let latestBranches = fBranches.length > 0 ? fBranches : [...branches];

      // TỰ ĐỘNG DI TRÚ DỮ LIỆU CŨ: "TPP-Group" -> "TPP"
      const hasTppGroup = latestCompanies.some(c => c.id === "TPP-Group");
      if (hasTppGroup) {
        console.log("Phát hiện dữ liệu TPP-Group cũ, đang tự động đồng bộ sang TPP...");
        const tppGroupCompany = latestCompanies.find(c => c.id === "TPP-Group");
        const restCompanies = latestCompanies.filter(c => c.id !== "TPP-Group");
        
        if (!restCompanies.some(c => c.id === "TPP")) {
          restCompanies.push({
            id: "TPP",
            name: tppGroupCompany?.name || "TÂN PHỦ VIỆT NAM"
          });
        }
        latestCompanies = restCompanies;

        latestBranches = latestBranches.map(b => {
          if (b.companyId === "TPP-Group") {
            return { ...b, companyId: "TPP" };
          }
          return b;
        });

        setCompanies(latestCompanies);
        setBranches(sanitizeAndMigrateBranches(latestBranches));
        safeSetItem("4m1e1i_companies", JSON.stringify(latestCompanies));
        safeSetItem("4m1e1i_branches", JSON.stringify(sanitizeAndMigrateBranches(latestBranches)));

        if (dbConnected) {
          try {
            await deleteDocument(COLLECTIONS.COMPANIES, "TPP-Group");
            const tppCompany = latestCompanies.find(c => c.id === "TPP");
            if (tppCompany) {
              await saveDocument(COLLECTIONS.COMPANIES, "TPP", tppCompany);
            }
            const sanitizedB = sanitizeAndMigrateBranches(latestBranches);
            for (const b of sanitizedB) {
              await saveDocument(COLLECTIONS.BRANCHES, b.id, b);
            }
          } catch (err) {
            console.error("Lỗi khi xóa TPP-Group hoặc lưu TPP lên Firestore:", err);
          }
        }
      } else {
        const sanitizedB = sanitizeAndMigrateBranches(latestBranches);
        setBranches(sanitizedB);
        safeSetItem("4m1e1i_branches", JSON.stringify(sanitizedB));
        
        if (dbConnected) {
          try {
            // Force-write correct branches with ID and suffix to database to avoid ghost values on other devices
            const bbmBr = sanitizedB.find(b => b.id === "DNP-BBM");
            if (bbmBr) await saveDocument(COLLECTIONS.BRANCHES, "DNP-BBM", bbmBr);
            const bbcBr = sanitizedB.find(b => b.id === "DNP-BBC");
            if (bbcBr) await saveDocument(COLLECTIONS.BRANCHES, "DNP-BBC", bbcBr);
            
            // Delete old BBM branch ID
            await deleteDocument(COLLECTIONS.BRANCHES, "BBM");
          } catch (err) {
            console.error("Lỗi khi cập nhật branches lên Firestore:", err);
          }
        }

        if (fCompanies.length > 0) {
          setCompanies(fCompanies);
        }
      }

      let latestDepts = fDepts.length > 0 ? fDepts : [...departments];
      const oldDeptIdsToDelete = latestDepts.filter(d => d.id.startsWith("DEPT-")).map(d => d.id);
      
      latestDepts = sanitizeAndMigrateDepartments(latestDepts);
      setDepartments(latestDepts);
      safeSetItem("4m1e1i_departments", JSON.stringify(latestDepts));

      if (dbConnected) {
        try {
          // If any old DEPT- IDs were in Firestore, delete them!
          if (oldDeptIdsToDelete.length > 0) {
            for (const oldId of oldDeptIdsToDelete) {
              await deleteDocument(COLLECTIONS.DEPARTMENTS, oldId).catch(console.error);
            }
          }
          // Save ALL departments to Firestore to ensure we have the newly-generated clean IDs updated
          for (const d of latestDepts) {
            await saveDocument(COLLECTIONS.DEPARTMENTS, d.id, d);
          }
        } catch (err) {
          console.error("Lỗi khi lưu departments lên Firestore:", err);
        }
      }

      setBroadcasts(fBroadcasts);
      setChats(fChats);
      setProductionRequests(fProdRequests);

      if (fTopics && fTopics.length > 0) {
        setTopics(fTopics);
      } else {
        setTopics([
          {
            id: "TOPIC-1",
            title: "Góp ý cải tiến chức năng add hình ảnh",
            description: "Chúng tôi đề xuất chức năng nén hình ảnh tự động trước khi tải lên để tiết kiệm dung lượng 3G/4G và giảm thời gian chờ khi úp hình báo cáo chất lượng.",
            category: "Góp ý chức năng",
            creatorName: "Lê Nhật Trường",
            creatorPhone: "0901234567",
            creatorRole: "NHÂN VIÊN",
            timestamp: "14/07/26 10:30:00",
            status: "OPEN",
            isPinned: true
          },
          {
            id: "TOPIC-2",
            title: "Góp ý cải tiến thả tim nhận chỉ đạo",
            description: "Nên thêm các trạng thái khác như \"Đã tiếp thu\" hoặc \"Đang xử lý\" khi tương tác thả tim để cấp dưới biết Ban Quản Trị đã nhận được thông tin.",
            category: "Cải tiến 4M1E",
            creatorName: "Nguyễn Văn A",
            creatorPhone: "0987654321",
            creatorRole: "NHÂN VIÊN",
            timestamp: "14/07/26 09:15:00",
            status: "PROCESSING",
            isPinned: false
          }
        ]);
      }

      if (fReplies && fReplies.length > 0) {
        setReplies(fReplies);
      } else {
        setReplies([
          {
            id: "REPLY-1-1",
            topicId: "TOPIC-1",
            senderName: "BAN QUẢN TRỊ 🛡️",
            senderPhone: "BQT",
            senderRole: "CHỦ ADMIN",
            message: "Cảm ơn ý kiến đóng góp rất thực tế của anh Trường. Chúng tôi đã ghi nhận và đang phối hợp với đội ngũ IT để tích hợp thư viện nén ảnh tự động ngay trên trình duyệt.",
            timestamp: "14/07/26 11:00:00"
          },
          {
            id: "REPLY-2-1",
            topicId: "TOPIC-2",
            senderName: "BAN QUẢN TRỊ 🛡️",
            senderPhone: "BQT",
            senderRole: "CHỦ ADMIN",
            message: "Ý kiến rất hay. Chúng tôi đang thiết kế lại phần tương tác để có nhiều biểu tượng phản hồi trực quan hơn.",
            timestamp: "14/07/26 09:45:00"
          }
        ]);
      }

      if (fRequestItems.length > 0) {
        const itemsMap: Record<string, any[]> = {};
        fRequestItems.forEach((x) => {
          if (x.prId) itemsMap[x.prId] = x.items || [];
        });
        setProductionRequestItemsMap(itemsMap);
      }

      if (fOrderImpls.length > 0) {
         setOrderImplementations(fOrderImpls);
      }

      if (fProducts.length > 0) {
        setProductsCatalog(fProducts);
      }

      if (fMolds.length > 0) {
        setMoldsCatalog(fMolds);
      }

      const remoteConfig = fConfigs.find((c: any) => c.id === "mobile_ui");
      if (remoteConfig) {
        const { id, ...cleanCfg } = remoteConfig;
        setMobileUIConfig((prev: any) => ({
          ...prev,
          ...cleanCfg
        }));
      }

      const remoteTicker = fConfigs.find((c: any) => c.id === "ticker");
      if (remoteTicker) {
        const { id, ...cleanTicker } = remoteTicker;
        setTickerConfig((prev: any) => ({
          ...prev,
          ...cleanTicker
        }));
      }

      const remoteAiKnowledge = fConfigs.find((c: any) => c.id === "ai_knowledge");
      if (remoteAiKnowledge && typeof remoteAiKnowledge.text === "string") {
        setAiKnowledgeText(remoteAiKnowledge.text);
      }

      setDbConnected(true);
      setSyncCompleted(true);
      setDbStatus("Đồng bộ liên kết với server thành công!");
      if (isManual) {
        showToast("Đã tải lại và đồng bộ dữ liệu mới nhất thành công!", "success");
      }
    } catch (error: any) {
      const isPermissionError = error?.code === "permission-denied" || error?.message?.toLowerCase().includes("permission") || error?.message?.toLowerCase().includes("insufficient");
      if (isPermissionError) {
        console.log("[Firestore] Firestore loading offline (permission denied/declined). Running smoothly in Local/Offline fallback mode.");
      } else {
        console.warn("[Firestore] Firestore loading error:", error);
      }
      setDbStatus("Đồng bộ thất bại, chuyển chế độ ngoại tuyến");
      if (isManual) {
        showToast("Lỗi khi tải lại dữ liệu từ server!", "error");
      }
    } finally {
      setDbLoading(false);
    }
  };

  // Synchronize with Firestore upon startup
  useEffect(() => {
    syncFromDb();
  }, []);

  // Real-time synchronization for dynamic collections: reports, chats, broadcasts
  useEffect(() => {
    if (!db || !dbConnected || dbLoading) return;

    const unsubscribeReports = onSnapshot(
      collection(db, COLLECTIONS.REPORTS),
      (snapshot) => {
        const list: QualityReport[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as QualityReport);
        });
        setReports(sanitizeReports(attachLocalImages(list)));
      },
      (error) => {
        console.error("Lỗi đồng bộ báo cáo thời gian thực:", error);
      }
    );

    const unsubscribeChats = onSnapshot(
      collection(db, COLLECTIONS.CHATS),
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ChatMessage);
        });
        setChats(list);
      },
      (error) => {
        console.error("Lỗi đồng bộ chat thời gian thực:", error);
      }
    );

    const unsubscribeBroadcasts = onSnapshot(
      collection(db, COLLECTIONS.BROADCASTS),
      (snapshot) => {
        const list: BroadcastNotice[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as BroadcastNotice);
        });
        setBroadcasts(list);
      },
      (error) => {
        console.error("Lỗi đồng bộ thông báo thời gian thực:", error);
      }
    );

    const unsubscribeTopics = onSnapshot(
      collection(db, COLLECTIONS.TOPICS),
      (snapshot) => {
        const list: ForumTopic[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ForumTopic);
        });
        setTopics(list);
      },
      (error) => {
        console.error("Lỗi đồng bộ forum topics thời gian thực:", error);
      }
    );

    const unsubscribeReplies = onSnapshot(
      collection(db, COLLECTIONS.TOPIC_REPLIES),
      (snapshot) => {
        const list: ForumReply[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ForumReply);
        });
        setReplies(list);
      },
      (error) => {
        console.error("Lỗi đồng bộ forum replies thời gian thực:", error);
      }
    );

    const unsubscribeConfigs = onSnapshot(
      collection(db, "config"),
      (snapshot) => {
        snapshot.forEach((doc) => {
          if (doc.id === "ticker") {
            const data = doc.data();
            setTickerConfig((prev: any) => {
              if (
                prev.text !== data.text ||
                prev.speed !== data.speed ||
                prev.spacing !== data.spacing
              ) {
                return {
                  text: data.text || "",
                  speed: data.speed || 35,
                  spacing: data.spacing || 50
                };
              }
              return prev;
            });
          } else if (doc.id === "mobile_ui") {
            const data = doc.data();
            setMobileUIConfig((prev: any) => {
              const { id, ...cleanData } = data;
              if (JSON.stringify(prev) !== JSON.stringify({ ...prev, ...cleanData })) {
                return {
                  ...prev,
                  ...cleanData
                };
              }
              return prev;
            });
          } else if (doc.id === "ai_knowledge") {
            const data = doc.data();
            if (data && typeof data.text === "string") {
              setAiKnowledgeText(data.text);
            }
          } else if (doc.id === "deleted_notifications") {
            const data = doc.data();
            if (data && Array.isArray(data.ids)) {
              setDeletedNotifIds(data.ids);
            }
          }
        });
      },
      (error) => {
        console.error("Lỗi đồng bộ cấu hình thời gian thực:", error);
      }
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, COLLECTIONS.USERS),
      (snapshot) => {
        const list: User[] = [];
        snapshot.forEach((doc) => {
          const data = { ...doc.data() } as any;
          const appUser: any = {
            ...data,
            id: doc.id || data.id,
            phone: data.phone || data.phoneNumber || "",
            fullName: data.fullName || data.name || "",
            createdAt: data.createdAt || new Date().toISOString()
          };
          
          if (data.role === "admin") appUser.role = UserRole.ADMIN;
          else if (data.role === "approver") appUser.role = UserRole.REVIEWER;
          else if (data.role === "employee") appUser.role = UserRole.STAFF;
          else if (data.role) appUser.role = data.role;
          
          if (data.status === "pending") appUser.status = UserStatus.PENDING;
          else if (data.status === "approved" || data.status === "active") appUser.status = UserStatus.ACTIVE;
          else if (data.status === "rejected") appUser.status = UserStatus.REJECTED;
          else if (data.status === "locked") appUser.status = UserStatus.LOCKED;
          else if (data.status) appUser.status = data.status;
          
          list.push(appUser as User);
        });
        
        const sanitizedLatest = sanitizeUsers(list);
        setUsers((prev) => {
          return prev.map((u) => {
            const fetched = sanitizedLatest.find((lu) => lu.id === u.id);
            if (fetched) {
              return {
                ...u,
                ...fetched,
                password: fetched.password || u.password
              };
            }
            return u;
          });
        });
      },
      (error) => {
        console.error("Lỗi đồng bộ người dùng thời gian thực:", error);
      }
    );

    return () => {
      unsubscribeReports();
      unsubscribeChats();
      unsubscribeBroadcasts();
      unsubscribeTopics();
      unsubscribeReplies();
      unsubscribeConfigs();
      unsubscribeUsers();
    };
  }, [dbConnected, dbLoading]);

  // Save changes to localStorage on any state modification
  useEffect(() => {
    safeSetItem("4m1e1i_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeSetItem("4m1e1i_error_catalog", JSON.stringify(errorCatalog));
  }, [errorCatalog]);

  useEffect(() => {
    // Tách riêng hình ảnh nặng ra khỏi danh sách báo cáo chính khi lưu vào localStorage để giữ danh sách văn bản nhẹ nhất có thể, tránh lỗi QuotaExceededError
    const lightweightReports = reports.map((r) => {
      const { imageUrl, imageUrls, ...rest } = r;
      return rest;
    });
    safeSetItem("4m1e1i_reports", JSON.stringify(lightweightReports));

    // Sắp xếp và lưu hình ảnh (Base64) riêng biệt cho tối đa 10 báo cáo mới nhất để tối ưu hóa bộ nhớ
    const sorted = [...reports].sort((a, b) => parseReportDate(b.timestamp) - parseReportDate(a.timestamp));
    sorted.forEach((r, idx) => {
      const imgKey = `4m1e1i_img_${r.id}`;
      const imgUrlsKey = `4m1e1i_img_urls_${r.id}`;

      // Giữ hình ảnh cho tối đa 10 báo cáo mới nhất, xóa các ảnh cũ hơn để giải phóng bộ nhớ
      if (idx < 10 && !r.isDeleted) {
        if (r.imageUrl && r.imageUrl.startsWith("data:")) {
          safeSetItem(imgKey, r.imageUrl);
        }
        if (r.imageUrls && r.imageUrls.length > 0) {
          safeSetItem(imgUrlsKey, JSON.stringify(r.imageUrls));
        }
      } else {
        safeRemoveItem(imgKey);
        safeRemoveItem(imgUrlsKey);
      }
    });

    // Dọn dẹp các khóa ảnh rác của các báo cáo đã bị xóa hoàn toàn khỏi danh sách
    try {
      const reportIds = new Set(reports.map(r => r.id));
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("4m1e1i_img_")) {
          const id = key.replace("4m1e1i_img_urls_", "").replace("4m1e1i_img_", "");
          if (!reportIds.has(id)) {
            safeRemoveItem(key);
          }
        }
      }
    } catch (e) {
      console.warn("Lỗi dọn dẹp các khóa ảnh rác:", e);
    }
  }, [reports]);

  useEffect(() => {
    safeSetItem("4m1e1i_companies", JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    safeSetItem("4m1e1i_branches", JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    safeSetItem("4m1e1i_departments", JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    safeSetItem("4m1e1i_broadcasts", JSON.stringify(broadcasts));
  }, [broadcasts]);

  useEffect(() => {
    safeSetItem("4m1e1i_prod_requests", JSON.stringify(productionRequests));
    if (syncCompleted && dbConnected && !dbLoading) {
      productionRequests.forEach((pr) => saveDocument(COLLECTIONS.PRODUCTION_REQUESTS, pr.id, pr));
    }
  }, [productionRequests, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    safeSetItem("4m1e1i_prod_request_items", JSON.stringify(productionRequestItemsMap));
    if (syncCompleted && dbConnected && !dbLoading) {
      Object.entries(productionRequestItemsMap).forEach(([prId, items]) => {
        saveDocument(COLLECTIONS.PRODUCTION_REQUEST_ITEMS, prId, { prId, items });
      });
    }
  }, [productionRequestItemsMap, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    safeSetItem("4m1e1i_order_implementations", JSON.stringify(orderImplementations));
    if (syncCompleted && dbConnected && !dbLoading) {
      orderImplementations.forEach((oi) => saveDocument(COLLECTIONS.ORDER_IMPLEMENTATIONS, oi.id, oi));
    }
  }, [orderImplementations, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    safeSetItem("4m1e1i_products_catalog", JSON.stringify(productsCatalog));
    if (syncCompleted && dbConnected && !dbLoading) {
      productsCatalog.forEach((p) => saveDocument(COLLECTIONS.PRODUCTS_CATALOG, p.code, p));
    }
  }, [productsCatalog, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    safeSetItem("4m1e1i_molds_catalog", JSON.stringify(moldsCatalog));
    if (syncCompleted && dbConnected && !dbLoading) {
      moldsCatalog.forEach((m) => saveDocument(COLLECTIONS.MOLDS_CATALOG, m.code, m));
    }
  }, [moldsCatalog, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    // Giới hạn lịch sử chat lưu trong localStorage xuống 100 tin nhắn mới nhất để tránh lỗi đầy bộ nhớ trình duyệt QuotaExceededError
    const sorted = [...chats].sort((a, b) => {
      const parseChatDate = (dateStr: string | undefined): number => {
        if (!dateStr) return 0;
        const match = dateStr.trim().match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (match) {
          const [, h, m, s, day, month, year] = match;
          const fullYear = year.length === 2 ? 2000 + parseInt(year, 10) : parseInt(year, 10);
          return new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10), parseInt(h, 10), parseInt(m, 10), parseInt(s, 10)).getTime();
        }
        return 0;
      };
      return parseChatDate(b.timestamp) - parseChatDate(a.timestamp);
    });
    const pruned = sorted.slice(0, 100);
    safeSetItem("4m1e1i_chats", JSON.stringify(pruned));
  }, [chats]);

  useEffect(() => {
    safeSetItem("4m1e1i_offline_queue", JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    safeSetItem("4m1e1i_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  // Synchronize currentUser fields if they are updated in the general user list
  useEffect(() => {
    if (currentUser) {
      const match = users.find((u) => u.id === currentUser.id);
      if (match) {
        if (
          match.role !== currentUser.role ||
          match.status !== currentUser.status ||
          match.fullName !== currentUser.fullName ||
          match.department !== currentUser.department ||
          match.branch !== currentUser.branch ||
          match.bypassApproval !== currentUser.bypassApproval ||
          match.canSpeciallyEditDelete !== currentUser.canSpeciallyEditDelete
        ) {
          setCurrentUser(match);
        }
      }
    }
  }, [users, currentUser]);

  // Auto-polling user status check from Firestore every 8 seconds when user is pending
  useEffect(() => {
    if (!currentUser || currentUser.status !== UserStatus.PENDING) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        if (!dbConnected) return; // Only pull if connected
        const latestUsers = await fetchCollection<User>(COLLECTIONS.USERS);
        if (latestUsers && latestUsers.length > 0) {
          const match = latestUsers.find(
            (u) => u.id === currentUser.id || u.phone.replace(/\s+/g, "") === currentUser.phone.replace(/\s+/g, "")
          );
          if (match) {
            // Sync in local memory
            setUsers((prev) => prev.map((u) => u.id === match.id ? match : u));
            
            if (match.status === UserStatus.ACTIVE) {
              // Automatically transition to MAIN dashboard!
              setCurrentUser(match);
              safeSetItem("4m1e1i_current_user", JSON.stringify(match));
            } else if (match.status === UserStatus.REJECTED || match.status === UserStatus.LOCKED) {
              // Sync transition
              setCurrentUser(match);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi tự động kiểm tra trạng thái phê duyệt: ", err);
      }
    }, 8000);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, dbConnected]);

  // Nhịp tim hiện diện (Presence Heartbeat) để cập nhật trạng thái hoạt động thực tế định kỳ 45 giây
  useEffect(() => {
    if (!currentUser?.id) return;

    const updatePresence = async () => {
      if (!syncCompleted) return; // Chỉ cập nhật khi đã đồng bộ xong dữ liệu từ server để tránh ghi đè trắng lịch sử hoạt động
      try {
        const now = Date.now();
        let nextLogsToSave: number[] = [];

        // Cập nhật local state ngay lập tức để người dùng xem chính xác trạng thái của mình
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === currentUser.id) {
              const currentLogs = u.activeLogs || [];
              const lastLog = currentLogs[currentLogs.length - 1];
              // Ngưỡng 10 phút để ghi nhận một phiên/lượt ra vào mới
              const shouldAddLog = !lastLog || (now - lastLog >= 10 * 60 * 1000);
              const nextLogs = shouldAddLog ? [...currentLogs, now] : currentLogs;
              nextLogsToSave = nextLogs;
              return { ...u, lastActive: now, activeLogs: nextLogs };
            }
            return u;
          })
        );

        if (dbConnected && !dbLoading) {
          // Lưu TRÚC TIẾP định dạng chỉ cập nhật lastActive và activeLogs lên Firestore để tránh ghi đè làm thay đổi trạng thái phê duyệt thực tế của người dùng từ admin
          if (currentUser.fullName && currentUser.phone) {
            await saveDocument(COLLECTIONS.USERS, currentUser.id, {
              lastActive: now,
              activeLogs: nextLogsToSave
            });
          }
        }
      } catch (err) {
        console.warn("Cập nhật trạng thái hoạt động thất bại (bỏ qua lỗi chạy ngầm):", err);
      }
    };

    // Cập nhật ngay khi login/vừa mở app
    updatePresence();

    // Định kỳ gửi 45 giây một lần khi trang đang hiển thị
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        updatePresence();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [currentUser?.id, dbConnected, dbLoading, syncCompleted]);

  // Định kỳ tải lại danh sách user để cập nhật trạng thái online của mọi người (60 giây một lần)
  useEffect(() => {
    if (!currentUser || currentUser.status === UserStatus.PENDING || !dbConnected || dbLoading) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          const latestUsers = await fetchCollection<User>(COLLECTIONS.USERS);
          if (latestUsers && latestUsers.length > 0) {
            const sanitizedLatest = sanitizeUsers(latestUsers);
            setUsers((prev) => {
              // Đồng bộ toàn bộ các trường phân quyền (role, status, bypassApproval, canSpeciallyEditDelete) từ server
              return prev.map((u) => {
                const fetched = sanitizedLatest.find((lu) => lu.id === u.id);
                if (fetched) {
                  return {
                    ...u,
                    ...fetched,
                    lastActive: fetched.lastActive || u.lastActive
                  };
                }
                return u;
              });
            });
          }
        }
      } catch (err) {
        console.warn("Lỗi cập nhật danh sách người dùng online tự động:", err);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [currentUser, dbConnected, dbLoading]);

  // Automatic screen detect and fully immersive fullscreen for mobile devices with tap, double-click, and double-tap listeners
  useEffect(() => {
    const isMobileDevice = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let lastTap = 0;

    let clickCount = 0;
    let clickTimer: any = null;
    let tapCount = 0;
    let tapTimer: any = null;
    let lastTouchTime = 0;

    const toggleFullscreenOnInteraction = (action?: "enter" | "exit") => {
      const doc = document as any;
      const docEl = document.documentElement as any;
      const isCurrentlyFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      
      if (action === "enter" || (!action && !isCurrentlyFs)) {
        if (!isCurrentlyFs) {
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen({ navigationUI: "hide" });
          } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
          }
        }
      } else if (action === "exit" || (!action && isCurrentlyFs)) {
        if (isCurrentlyFs) {
          if (doc.exitFullscreen) {
            doc.exitFullscreen().catch(() => {});
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
          } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
          }
        }
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      if (Date.now() - lastTouchTime < 600) {
        return;
      }
      const target = e.target as HTMLElement;
      if (target) {
        if (
          target.tagName === "INPUT" || 
          target.tagName === "TEXTAREA" || 
          target.tagName === "BUTTON" || 
          target.tagName === "A" ||
          target.closest(".cursor-zoom-in") || 
          target.closest(".cursor-move") ||
          target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }
      }

      clickCount++;
      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      clickTimer = setTimeout(() => {
        if (clickCount === 2) {
          toggleFullscreenOnInteraction("enter");
        } else if (clickCount >= 3) {
          toggleFullscreenOnInteraction("exit");
        }
        clickCount = 0;
      }, 350);
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchTime = Date.now();
      const target = e.target as HTMLElement;
      if (target) {
        if (
          target.tagName === "INPUT" || 
          target.tagName === "TEXTAREA" || 
          target.tagName === "BUTTON" || 
          target.tagName === "A" ||
          target.closest(".cursor-zoom-in") || 
          target.closest(".cursor-move") ||
          target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }
      }

      tapCount++;
      if (tapTimer) {
        clearTimeout(tapTimer);
      }

      if (tapCount > 1 && e.cancelable) {
        e.preventDefault();
      }

      tapTimer = setTimeout(() => {
        if (tapCount === 2) {
          toggleFullscreenOnInteraction("enter");
        } else if (tapCount >= 3) {
          toggleFullscreenOnInteraction("exit");
        }
        tapCount = 0;
      }, 350);
    };

    // Auto trigger on first touch or click
    const handleFirstInteraction = () => {
      // Just enter fullscreen on first load
      const doc = document as any;
      const docEl = document.documentElement as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen({ navigationUI: "hide" });
        }
      }
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
    };

    if (isMobileDevice) {
      window.addEventListener("touchstart", handleFirstInteraction, { passive: true });
      window.addEventListener("click", handleFirstInteraction);
    }

    // Always support click/double click and double tap/triple tap for toggling fullscreen
    window.addEventListener("click", handleMouseClick);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("click", handleMouseClick);
      window.removeEventListener("touchstart", handleTouchStart);
      if (clickTimer) clearTimeout(clickTimer);
      if (tapTimer) clearTimeout(tapTimer);
    };
  }, []);

  // Handle auto-sync when network gets re-enabled
  const handleToggleOfflineMode = () => {
    const nextOffline = !offlineMode;
    setOfflineMode(nextOffline);
    
    if (!nextOffline && offlineQueue.length > 0) {
      // Automatically dump elements into standard database
      setReports((prev) => [
        ...offlineQueue.map((oq) => ({
          ...oq,
          id: `R-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          googleDrivePath: `My Drive > 4M1E1I Reports > AutoSync > ${oq.timestamp.replace(/[:\/]/g, "")}.pdf`
        })),
        ...prev
      ]);
      setOfflineQueue([]);
      showToast("Khôi phục kết nối mạng thành công! Toàn bộ tệp hàng đợi offline đã được đồng bộ đồng nhất lên máy chủ.", "success");
    }
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setRegisterSuccessMsg("");

    const cleanId = loginId.trim();
    const cleanPhone = loginPhone.replace(/\s+/g, "");
    const cleanPassword = loginPassword.trim();

    if (!cleanId || !cleanPhone || !cleanPassword) {
      setAuthError("Vui lòng nhập đầy đủ Mã nhân sự, Số điện thoại và Mật khẩu.");
      return;
    }

    // Lookup user in state by id AND phone number
    const found = users.find(
      (u) => 
        u.id.trim() === cleanId && 
        u.phone.replace(/\s+/g, "") === cleanPhone
    );

    if (!found) {
      setAuthError("Thông tin đăng nhập không chính xác. Quý khách vui lòng kiểm tra lại Mã nhân sự hoặc Số điện thoại.");
      return;
    }

    if (found.password && found.password !== cleanPassword) {
      setAuthError("Mật khẩu không chính xác. Vui lòng nhập lại.");
      return;
    }

    if (found.status === UserStatus.REJECTED) {
      setAuthError("Yêu cầu đăng ký của bạn đã bị từ chối. Vui lòng liên hệ quản lý cấp trên.");
      return;
    }

    if (found.status === UserStatus.LOCKED) {
      setAuthError("Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Bộ phận CNTT để mở lại.");
      return;
    }

    // Logged in successfully (approved or pending)
    setCurrentUser(found);
  };

  // Sign up handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setRegisterSuccessMsg("");

    const cleanPhone = regPhone.replace(/\s+/g, "");

    if (!regFullName.trim() || !regId.trim() || !cleanPhone || !regPassword.trim() || !regConfirmPassword.trim()) {
      setAuthError("Tất cả các trường đánh dấu (*) đều bắt buộc hoàn thiện.");
      return;
    }

    // Confirm passwords match
    if (regPassword !== regConfirmPassword) {
      setAuthError("Mật khẩu và Xác nhận mật khẩu không khớp.");
      return;
    }

    // Verify personnel ID formatting e.g., 2018.00281
    const idRegex = /^\d{4}\.\d{5}$/;
    if (!idRegex.test(regId.trim())) {
      setAuthError("Định dạng Mã nhân sự sai quy chuẩn. Định dạng mẫu đúng: YYYY.XXXXX (ví dụ: 2018.00281)");
      return;
    }

    // Verify phone digit count
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith("0")) {
      setAuthError("Vui lòng nhập đúng SĐT cá nhân gồm 10 chữ số (bắt đầu bằng số 0)");
      return;
    }

    // Check if phone number already registered
    const preExistingPhone = users.find((u) => u.phone.replace(/\s+/g, "") === cleanPhone);
    if (preExistingPhone) {
      setAuthError("Số điện thoại đã được đăng ký");
      return;
    }

    // Check if personnel ID already exists
    const preExistingId = users.find((u) => u.id === regId.trim());
    if (preExistingId) {
      setAuthError("Mã nhân sự này đã tồn tại trên hệ thống!");
      return;
    }

    // Find representing company based on selection
    const regBranchObj = branches.find((b) => b.name === regBranch);
    const regCompanyObj = regBranchObj ? companies.find((c) => c.id === regBranchObj.companyId) : null;
    const regCompanyVal = regCompanyObj ? regCompanyObj.name : "TÂN PHÚ VIỆT NAM";

    // Register user with PENDING state and STAFF (employee) role
    const newUser: User = {
      id: regId.trim(),
      fullName: formatNameCapitalized(regFullName.trim()),
      phone: cleanPhone,
      department: regDepartment,
      branch: regBranch,
      role: UserRole.STAFF, // employee default
      status: UserStatus.PENDING, // pending default
      password: regPassword,
      company: regCompanyVal,
      position: regPosition.trim() || "Nhân Viên"
    };

    const sanitizedNew = sanitizeUsers([newUser])[0];

    setUsers((prev) => [...prev, sanitizedNew]);
    
    if (dbConnected) {
      saveDocument(COLLECTIONS.USERS, sanitizedNew.id, sanitizedNew).catch(console.error);
    }

    // Keep user logged in under pending status, which displays Waiting landing screen with auto-polling
    setCurrentUser(sanitizedNew);
    setRegisterSuccessMsg("Đăng ký tài khoản thành công! Tài khoản của bạn đang chờ quản trị viên phê duyệt.");

    // Clear registration fields
    setRegFullName("");
    setRegId("");
    setRegPhone("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegPosition("");
  };

  // Admin controls
  const handleUpdateStatus = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    if (dbConnected) {
      // Find the user from the current state and apply the status update for saving
      const found = users.find((u) => u.id === id);
      if (found) {
        const updatedUser = { ...found, status };
        saveDocument(COLLECTIONS.USERS, id, updatedUser).catch(console.error);
      }
    }
  };

  const handleUpdateRole = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    if (dbConnected) {
      // Find the user from the current state and apply the role update for saving
      const found = users.find((u) => u.id === id);
      if (found) {
        const updatedUser = { ...found, role };
        saveDocument(COLLECTIONS.USERS, id, updatedUser).catch(console.error);
      }
    }
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.USERS, id);
    }
  };

  const handleAddUser = (user: User) => {
    const sanitized = sanitizeUsers([user])[0];
    setUsers((prev) => {
      if (prev.some((u) => u.id === sanitized.id)) return prev;
      return [...prev, sanitized];
    });
    if (dbConnected) {
      saveDocument(COLLECTIONS.USERS, sanitized.id, sanitized).catch(console.error);
    }
  };

  const handleUpdateUser = (updatedUser: User, oldId?: string) => {
    const sanitized = sanitizeUsers([updatedUser])[0];
    const actualOldId = oldId || sanitized.id;

    setUsers((prev) => prev.map((u) => (u.id === actualOldId ? sanitized : u)));

    if (actualOldId !== sanitized.id) {
      setReports((prev) =>
        prev.map((r) => (r.uploaderId === actualOldId ? { ...r, uploaderId: sanitized.id } : r))
      );
    }

    if (currentUser && (currentUser.id === actualOldId || currentUser.id === sanitized.id)) {
      setCurrentUser(sanitized);
    }

    if (dbConnected) {
      if (actualOldId !== sanitized.id) {
        deleteDocument(COLLECTIONS.USERS, actualOldId).catch(console.error);
      }
      saveDocument(COLLECTIONS.USERS, sanitized.id, sanitized).catch(console.error);
    }
  };

  // Code list lookup managers
  const handleAddCompany = (c: Company) => {
    setCompanies((prev) => [...prev, c]);
    if (dbConnected) {
      saveDocument(COLLECTIONS.COMPANIES, c.id, c).catch(console.error);
    }
  };

  const handleUpdateCompany = (oldId: string, updated: Company) => {
    const oldC = companies.find(c => c.id === oldId);
    const oldName = oldC ? oldC.name : "";
    const newName = updated.name;

    // 1. If ID was modified, cascade update all branches' companyId
    if (oldId !== updated.id) {
      setBranches((prev) => {
        const nextBranches = prev.map((b) => b.companyId === oldId ? { ...b, companyId: updated.id } : b);
        if (dbConnected) {
          nextBranches.forEach(b => {
            if (b.companyId === updated.id) {
              saveDocument(COLLECTIONS.BRANCHES, b.id, b).catch(console.error);
            }
          });
        }
        return nextBranches;
      });
    }

    // 2. Cascade update users' company names
    if (oldName && oldName !== newName) {
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => {
          if (u.company === oldName) {
            const nextU = { ...u, company: newName };
            if (dbConnected) {
              saveDocument(COLLECTIONS.USERS, nextU.id, nextU).catch(console.error);
            }
            return nextU;
          }
          return u;
        });
        return nextUsers;
      });

      if (currentUser && currentUser.company === oldName) {
        setCurrentUser((prev) => prev ? { ...prev, company: newName } : null);
      }
    }

    // 3. Replace the company
    setCompanies((prev) => {
      const filtered = prev.filter((c) => c.id !== oldId);
      return [...filtered, updated];
    });

    if (dbConnected) {
      if (oldId !== updated.id) {
        deleteDocument(COLLECTIONS.COMPANIES, oldId).catch(console.error);
      }
      saveDocument(COLLECTIONS.COMPANIES, updated.id, updated).catch(console.error);
    }
  };

  const handleAddBranch = (b: Branch) => {
    setBranches((prev) => [...prev, b]);
    if (dbConnected) {
      saveDocument(COLLECTIONS.BRANCHES, b.id, b).catch(console.error);
    }
  };

  const handleUpdateBranch = (oldId: string, updated: Branch) => {
    const oldBranch = branches.find(b => b.id === oldId);
    const oldName = oldBranch ? oldBranch.name : "";
    const newName = updated.name;

    // 1. Cascade update parent references if branch ID changed
    if (oldId !== updated.id) {
      setDepartments((prev) => {
        const nextDepts = prev.map((d) => d.branchId === oldId ? { ...d, branchId: updated.id } : d);
        if (dbConnected) {
          nextDepts.forEach((d) => {
            if (d.branchId === updated.id) {
              saveDocument(COLLECTIONS.DEPARTMENTS, d.id, d).catch(console.error);
            }
          });
        }
        return nextDepts;
      });
    }

    if (oldName && oldName !== newName) {
      // 1. Cascade update reports' factory names
      setReports((prevReports) => {
        const nextReports = prevReports.map((r) => {
          if (r.factory === oldName) {
            const nextR = { ...r, factory: newName };
            if (dbConnected) {
              saveDocument(COLLECTIONS.REPORTS, nextR.id, nextR).catch(console.error);
            }
            return nextR;
          }
          return r;
        });
        return nextReports;
      });

      // 2. Cascade update users' branch names
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => {
          if (u.branch === oldName) {
            const nextU = { ...u, branch: newName };
            if (dbConnected) {
              saveDocument(COLLECTIONS.USERS, nextU.id, nextU).catch(console.error);
            }
            return nextU;
          }
          return u;
        });
        return nextUsers;
      });

      if (currentUser && currentUser.branch === oldName) {
        setCurrentUser((prev) => prev ? { ...prev, branch: newName } : null);
      }

      // 3. Cascade update department suffix codes belonging to this branch
      const oldSuffix = getBranchCodeSuffix(oldName);
      const newSuffix = getBranchCodeSuffix(newName);
      setDepartments((prevDepts) => {
        const nextDepts = prevDepts.map((d) => {
          const dBranchId = d.branchId === oldId ? updated.id : d.branchId;
          if (d.branchId === oldId || d.branchId === updated.id) {
            let cleanDeptName = d.name;
            if (cleanDeptName.endsWith(oldSuffix)) {
              cleanDeptName = cleanDeptName.substring(0, cleanDeptName.length - oldSuffix.length);
            } else {
              cleanDeptName = cleanDeptName.replace(/\s\([A-Z0-9-]+\)$/, "").trim();
            }
            const nextD = { ...d, branchId: dBranchId, name: `${cleanDeptName}${newSuffix}` };
            if (dbConnected) {
              saveDocument(COLLECTIONS.DEPARTMENTS, nextD.id, nextD).catch(console.error);
            }
            return nextD;
          }
          return d;
        });
        return nextDepts;
      });
    } else if (oldId !== updated.id) {
      // Branch ID changed but name didn't. Still need to update department suffix if it was based on old branch ID!
      const oldSuffix = ` (${oldId})`;
      const newSuffix = ` (${updated.id})`;
      const oldNameSuffix = getBranchCodeSuffix(oldName);
      setDepartments((prevDepts) => {
        const nextDepts = prevDepts.map((d) => {
          if (d.branchId === oldId) {
            let cleanDeptName = d.name;
            let nextD: Department;
            if (cleanDeptName.endsWith(oldNameSuffix)) {
              nextD = { ...d, branchId: updated.id };
            } else if (cleanDeptName.endsWith(oldSuffix)) {
              cleanDeptName = cleanDeptName.substring(0, cleanDeptName.length - oldSuffix.length);
              nextD = { ...d, branchId: updated.id, name: `${cleanDeptName}${newSuffix}` };
            } else {
              nextD = { ...d, branchId: updated.id };
            }
            if (dbConnected) {
              saveDocument(COLLECTIONS.DEPARTMENTS, nextD.id, nextD).catch(console.error);
            }
            return nextD;
          }
          return d;
        });
        return nextDepts;
      });
    }

    setBranches((prev) => {
      const filtered = prev.filter((b) => b.id !== oldId);
      return [...filtered, updated];
    });

    if (dbConnected) {
      if (oldId !== updated.id) {
        deleteDocument(COLLECTIONS.BRANCHES, oldId).catch(console.error);
      }
      saveDocument(COLLECTIONS.BRANCHES, updated.id, updated).catch(console.error);
    }
  };

  const handleAddDepartment = (d: Department) => {
    let cleanName = d.name.trim();
    // Auto-correct spelling issues:
    cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý");
    cleanName = cleanName.replace(/quản\s+lí/gi, "Quản Lý");
    cleanName = cleanName.replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng");
    cleanName = cleanName.replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

    const activeBranch = branches.find((b) => b.id === d.branchId);
    let suffix = activeBranch ? getBranchCodeSuffix(activeBranch.name) : "";
    if (d.branchId && (d.branchId.startsWith("BRANCH-") || d.branchId.startsWith("DEPT-"))) {
      suffix = "";
    }

    if (suffix) {
      if (!cleanName.endsWith(suffix)) {
        cleanName = cleanName.replace(/\s\([^)]+\)$/, "").trim();
      } else {
        cleanName = cleanName.substring(0, cleanName.length - suffix.length).trim();
      }
    } else {
      cleanName = cleanName.replace(/\s\([^)]+\)$/, "").trim();
    }
    
    // Reinforce spelling check
    cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

    const newDept = {
      ...d,
      name: suffix ? `${cleanName}${suffix}` : cleanName
    };
    setDepartments((prev) => [...prev, newDept]);
    if (dbConnected) {
      saveDocument(COLLECTIONS.DEPARTMENTS, newDept.id, newDept).catch(console.error);
    }
  };

  const handleUpdateDepartment = (oldId: string, updated: Department) => {
    let cleanName = updated.name.trim();
    // Auto-correct spelling issues:
    cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý");
    cleanName = cleanName.replace(/quản\s+lí/gi, "Quản Lý");
    cleanName = cleanName.replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng");
    cleanName = cleanName.replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

    const activeBranch = branches.find((b) => b.id === updated.branchId);
    let suffix = activeBranch ? getBranchCodeSuffix(activeBranch.name) : "";
    if (updated.branchId && (updated.branchId.startsWith("BRANCH-") || updated.branchId.startsWith("DEPT-"))) {
      suffix = "";
    }

    if (suffix) {
      if (!cleanName.endsWith(suffix)) {
        cleanName = cleanName.replace(/\s\([^)]+\)$/, "").trim();
        cleanName = `${cleanName}${suffix}`;
      }
    } else {
      cleanName = cleanName.replace(/\s\([^)]+\)$/, "").trim();
    }

    updated = {
      ...updated,
      name: cleanName
    };

    const oldDept = departments.find(d => d.id === oldId);
    const oldName = oldDept ? oldDept.name : "";
    const newName = updated.name;

    if (oldName && oldName !== newName) {
      // Cascade update reports' department names (both field aliases for safety)
      setReports((prevReports) => {
        const nextReports = prevReports.map((r) => {
          let changed = false;
          const updatedReport = { ...r };
          if (r.uploaderDepartment === oldName) {
            updatedReport.uploaderDepartment = newName;
            changed = true;
          }
          if ((r as any).department === oldName) {
            (updatedReport as any).department = newName;
            changed = true;
          }
          if (changed && dbConnected) {
            saveDocument(COLLECTIONS.REPORTS, updatedReport.id, updatedReport).catch(console.error);
          }
          return changed ? updatedReport : r;
        });
        return nextReports;
      });

      // Cascade update users' department names
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => {
          if (u.department === oldName) {
            const nextU = { ...u, department: newName };
            if (dbConnected) {
              saveDocument(COLLECTIONS.USERS, nextU.id, nextU).catch(console.error);
            }
            return nextU;
          }
          return u;
        });
        return nextUsers;
      });
      if (currentUser && currentUser.department === oldName) {
        setCurrentUser((prev) => prev ? { ...prev, department: newName } : null);
      }
    }

    setDepartments((prev) => {
      const filtered = prev.filter((d) => d.id !== oldId);
      return [...filtered, updated];
    });

    if (dbConnected) {
      if (oldId !== updated.id) {
        deleteDocument(COLLECTIONS.DEPARTMENTS, oldId).catch(console.error);
      }
      saveDocument(COLLECTIONS.DEPARTMENTS, updated.id, updated).catch(console.error);
    }
  };

  const handleDeleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.BRANCHES, id).catch(console.error);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.DEPARTMENTS, id).catch(console.error);
    }
  };

  const handleDeleteCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.COMPANIES, id).catch(console.error);
    }
  };

  // Broadcaster Notice
  const handleAddBroadcast = (notice: string, type: string) => {
    const newNotice: BroadcastNotice = {
      id: `NOTICE-${Date.now()}`,
      type,
      content: notice,
      sender: currentUser?.fullName || "Hệ thống",
      timestamp: new Date().toLocaleDateString("vi-VN").replace(/\/\d{2}(\d{2})$/, "/$1")
    };
    setBroadcasts((prev) => [newNotice, ...prev]);
    if (dbConnected) {
      saveDocument(COLLECTIONS.BROADCASTS, newNotice.id, newNotice).catch((err) => {
        console.error("Lỗi khi gửi thông báo lên Firestore:", err);
      });
    }
  };

  const handleDeleteBroadcast = (id: string) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.BROADCASTS, id).catch((err) => {
        console.error("Lỗi khi xóa thông báo trên Firestore:", err);
      });
    }
  };

  const getFormattedTimestamp = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hrs = String(now.getHours()).padStart(2, '0');
    const mns = String(now.getMinutes()).padStart(2, '0');
    const scs = String(now.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hrs}:${mns}:${scs}`;
  };

  // Forum Topic & Reply Actions
  const handleAddForumTopic = (
    title: string,
    description: string,
    category: ForumTopicCategory
  ) => {
    if (!currentUser) return;
    const newTopic: ForumTopic = {
      id: `TOPIC-${Date.now()}`,
      title,
      description,
      category,
      creatorName: currentUser.fullName,
      creatorPhone: currentUser.phone,
      creatorRole: currentUser.role,
      timestamp: getFormattedTimestamp(),
      status: "OPEN",
      isPinned: false
    };
    setTopics((prev) => [...prev, newTopic]);
    if (dbConnected) {
      saveDocument(COLLECTIONS.TOPICS, newTopic.id, newTopic).catch((err) => {
        console.error("Lỗi khi tạo chủ đề lên Firestore:", err);
      });
    }
    showToast("Đã tạo chủ đề trao đổi mới!", "success");
  };

  const handleAddForumReply = (topicId: string, message: string) => {
    if (!currentUser) return;
    const newReply: ForumReply = {
      id: `REPLY-${Date.now()}`,
      topicId,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      senderRole: currentUser.role,
      message,
      timestamp: getFormattedTimestamp()
    };
    setReplies((prev) => [...prev, newReply]);
    if (dbConnected) {
      saveDocument(COLLECTIONS.TOPIC_REPLIES, newReply.id, newReply).catch((err) => {
        console.error("Lỗi khi gửi phản hồi lên Firestore:", err);
      });
    }
  };

  const handleUpdateForumTopicStatus = (topicId: string, status: ForumTopicStatus) => {
    setTopics((prev) => prev.map((t) => {
      if (t.id !== topicId) return t;
      const updated = { ...t, status };
      if (dbConnected) {
        saveDocument(COLLECTIONS.TOPICS, updated.id, updated).catch((err) => {
          console.error("Lỗi khi cập nhật trạng thái chủ đề:", err);
        });
      }
      return updated;
    }));
    showToast("Đã cập nhật trạng thái chủ đề!", "success");
  };

  const handleToggleForumTopicPin = (topicId: string) => {
    setTopics((prev) => prev.map((t) => {
      if (t.id !== topicId) return t;
      const updated = { ...t, isPinned: !t.isPinned };
      if (dbConnected) {
        saveDocument(COLLECTIONS.TOPICS, updated.id, updated).catch((err) => {
          console.error("Lỗi khi ghim/bỏ ghim chủ đề:", err);
        });
      }
      return updated;
    }));
    showToast("Đã cập nhật trạng thái ghim chủ đề!", "success");
  };

  // Forum message
  const handleAddChatMessage = (
    msg: string,
    reportRefId?: string,
    threadId?: string,
    threadTitle?: string,
    threadCategory?: string
  ) => {
    if (!currentUser) return;
    const newChat: ChatMessage = {
      id: `CHAT-${Date.now()}`,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      senderPhone: currentUser.phone,
      message: msg,
      timestamp: new Date().toLocaleString("vi-VN"),
      ...(reportRefId ? { reportRefId } : {}),
      ...(threadId ? { threadId } : {}),
      ...(threadTitle ? { threadTitle } : {}),
      ...(threadCategory ? { threadCategory } : {})
    };
    setChats((prev) => [...prev, newChat]);
    if (dbConnected) {
      saveDocument(COLLECTIONS.CHATS, newChat.id, newChat).catch((err) => {
        console.error("Lỗi khi gửi bình luận lên Firestore:", err);
      });
    }

    // If chat is related to a report, update that report's updatedAt to trigger priority jump
    if (reportRefId) {
      let updatedRep: QualityReport | null = null;
      setReports((prevReports) => prevReports.map((r) => {
        if (r.id !== reportRefId) return r;
        
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mns = String(now.getMinutes()).padStart(2, '0');
        const scs = String(now.getSeconds()).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const updateTimeStr = `${hrs}:${mns}:${scs} ${date}/${month}/${year}`;

        const logs = r.updateLogs ? [...r.updateLogs] : [];
        logs.push(`Tương tác bình luận mới từ ${currentUser.fullName} (${updateTimeStr})`);

        updatedRep = {
          ...r,
          updatedAt: updateTimeStr,
          updateLogs: logs
        };
        return updatedRep;
      }));

      // Since we updated the report, save it directly to Firestore too
      setTimeout(() => {
        if (updatedRep && dbConnected) {
          saveDocument(COLLECTIONS.REPORTS, reportRefId, updatedRep).catch((err) => {
            console.error("Lỗi khi lưu báo cáo được bình luận lên Firestore:", err);
          });
        }
      }, 50);
    }
  };

  // Report Submission Handler
  const handleSubmitReport = async (payload: Omit<QualityReport, "id" | "googleDrivePath">) => {
    if (offlineMode) {
      // Save inside local offline storage queue
      const offlineItem: QualityReport = {
        ...payload,
        id: `OFFLINE-${Date.now()}`
      };
      setOfflineQueue((prev) => [offlineItem, ...prev]);
      showToast("Đang ngắt mạng. Đã lưu báo cáo cục bộ vào hàng chờ offline thành công!", "warning");
    } else {
      if (editingReport) {
        // Edit flow
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mns = String(now.getMinutes()).padStart(2, '0');
        const scs = String(now.getSeconds()).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const updateTimeStr = `${hrs}:${mns}:${scs} ${date}/${month}/${year}`;

        const logs = editingReport.updateLogs ? [...editingReport.updateLogs] : [];
        const changes: string[] = [];
        if (editingReport.content !== payload.content) changes.push("Sửa chi tiết");
        if (editingReport.factory !== payload.factory) changes.push("Sửa chi nhánh");
        if (editingReport.category !== payload.category) changes.push("Sửa hạng mục 4M1E1I");
        if (editingReport.notes !== payload.notes) changes.push("Sửa ghi chú");
        if (editingReport.isAbnormal !== payload.isAbnormal) changes.push("Thay đổi mức cảnh báo");
        if (editingReport.imageUrl !== payload.imageUrl || (payload.imageUrls && JSON.stringify(editingReport.imageUrls) !== JSON.stringify(payload.imageUrls))) {
          changes.push("Sửa ảnh");
        }

        const logMsg = changes.length > 0 ? `${changes.join(", ")} (${updateTimeStr})` : `Cập nhật thông tin (${updateTimeStr})`;
        logs.push(logMsg);

        const updatedReport: QualityReport = {
          ...editingReport,
          ...payload,
          updatedAt: updateTimeStr,
          updateLogs: logs
        };

        const nextReportsList = sanitizeReports(
          reports.map((r) => (r.id === editingReport.id ? updatedReport : r))
        );
        const finalizedUpdatedReport = nextReportsList.find(r => r.id === editingReport.id) || updatedReport;

        setReports(nextReportsList);

        if (syncCompleted && dbConnected && !dbLoading) {
          saveDocument(COLLECTIONS.REPORTS, editingReport.id, finalizedUpdatedReport)
            .then((success) => {
              if (!success) {
                showToast("Lỗi máy chủ! Không thể cập nhật báo cáo lên hệ thống đám mây. Vui lòng kiểm tra kết nối 4G/Wifi.", "error");
              }
            })
            .catch((err) => {
              console.error("Lỗi khi tải báo cáo cập nhật lên Firestore:", err);
              showToast("Lỗi đồng bộ máy chủ! Bản cập nhật chưa được lưu lên đám mây.", "error");
            });
        }

        showToast("Đã cập nhật tệp tin biến động chất lượng thành công!", "success");
      } else {
        // New report flow
        const newId = `R-${Date.now()}`;
        
        let finalBypass = currentUser?.bypassApproval;
        let finalRole = currentUser?.role;

        if (syncCompleted && dbConnected && !dbLoading && currentUser?.id) {
          try {
            // Chủ động tải về thông tin phân quyền mới nhất của tài khoản này ngay khi bấm Đăng tin
            const latestUsers = await fetchCollection<User>(COLLECTIONS.USERS);
            const freshUser = latestUsers.find(u => u.id === currentUser.id);
            if (freshUser) {
              finalBypass = freshUser.bypassApproval;
              finalRole = freshUser.role;
              // Đồng bộ tức thì vào bộ nhớ local
              setUsers(prev => prev.map(u => u.id === freshUser.id ? freshUser : u));
              setCurrentUser(freshUser);
            }
          } catch (err) {
            console.warn("Could not fetch fresh user profile before submitting, falling back to local memory:", err);
          }
        }

        const needsApproval = currentUser && finalRole === UserRole.STAFF && !finalBypass;

        const newReport: QualityReport = {
          ...payload,
          id: newId,
          isApproved: !needsApproval,
          googleDrivePath: `My Drive > 4M1E1I Reports > AutoSync > ${payload.timestamp.replace(/[:\/]/g, "")}.pdf`
        };

        const nextReportsList = sanitizeReports([newReport, ...reports]);
        const finalizedNewReport = nextReportsList.find(r => r.id === newId) || newReport;

        setReports(nextReportsList);

        if (syncCompleted && dbConnected && !dbLoading) {
          saveDocument(COLLECTIONS.REPORTS, newId, finalizedNewReport)
            .then((success) => {
              if (!success) {
                showToast("Lỗi máy chủ! Không thể gửi báo cáo lên đám mây. Vui lòng kiểm tra kết nối 4G/Wifi.", "error");
              }
            })
            .catch((err) => {
              console.error("Lỗi khi tải báo cáo mới lên Firestore:", err);
              showToast("Lỗi đồng bộ máy chủ! Bản tin mới chưa được gửi thành công lên đám mây.", "error");
            });
        }
        
        // Auto alert sound simulator if abnormal
        if (payload.isAbnormal) {
          if (needsApproval) {
            showToast(`CẢNH BÁO BẤT THƯỜNG (CHỜ DUYỆT): Bản đề xuất lỗi tại ${payload.factory} đã được ghi nhận và đang chờ Duyệt viên xét duyệt!`, "warning");
          } else {
            showToast(`CẢNH BÁO BẤT THƯỜNG: Nhân viên ${payload.uploaderName} vừa phát hiện báo cáo tại ${payload.factory}. Hệ thống đã gửi thông báo khẩn cho Admin!`, "warning");
          }
        } else {
          if (needsApproval) {
            showToast("Gửi đề xuất thành công! Đang chờ Duyệt viên của bộ phận phê duyệt.", "success");
          } else {
            showToast("Đã gửi báo cáo chất lượng 4M1E1I lên máy chủ thành công!", "success");
          }
        }
      }
    }

    setIsFormOpen(false);
    setEditingReport(null);
  };

  // Edit report trigger from cards list
  const handleEditReportTrigger = (report: QualityReport) => {
    setEditingReport(report);
    setIsFormOpen(true);
  };

  // Delete report trigger
  const handleDeleteReportTrigger = (id: string, forcePermanent?: boolean) => {
    if (forcePermanent) {
      setConfirmDialog({
        isOpen: true,
        title: "Xóa vĩnh viễn báo cáo?",
        message: "Kiểm soát chất lượng: Bạn có thật sự muốn XÓA VĨNH VIỄN bản báo cáo này? Thao tác này KHÔNG THỂ KHÔI PHỤC!",
        onConfirm: () => {
          setReports((prev) => sanitizeReports(prev.filter((r) => r.id !== id)));
          if (dbConnected) {
            deleteDocument(COLLECTIONS.REPORTS, id);
          }
          setConfirmDialog(null);
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: "Chuyển vào Thùng rác?",
        message: "Kiểm soát chất lượng: Bạn có chắc chắn muốn chuyển bản báo cáo này vào Thùng rác?",
        onConfirm: () => {
          setReports((prev) => {
            const deletedReport = prev.find((r) => r.id === id);
            if (deletedReport) {
              const updated: QualityReport = {
                ...deletedReport,
                isDeleted: true,
                deletedAt: new Date().toISOString()
              };
              if (dbConnected) {
                saveDocument(COLLECTIONS.REPORTS, id, updated).catch((err) => {
                  console.error("Lỗi khi chuyển báo cáo vào thùng rác Firestore:", err);
                });
              }
              return sanitizeReports(prev.map((r) => r.id === id ? updated : r));
            }
            return prev;
          });
          setConfirmDialog(null);
        }
      });
    }
  };

  // Update report handler for likes, shares, or directives
  const handleUpdateReport = (updatedReport: QualityReport) => {
    const existing = reports.find(r => r.id === updatedReport.id);
    if (!existing) return;

    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mns = String(now.getMinutes()).padStart(2, '0');
    const scs = String(now.getSeconds()).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const updateTimeStr = `${hrs}:${mns}:${scs} ${date}/${month}/${year}`;

    const logs = existing.updateLogs ? [...existing.updateLogs] : [];
    const changes: string[] = [];

    const oldLikes = existing.likedBy || [];
    const newLikes = updatedReport.likedBy || [];
    if (newLikes.length > oldLikes.length) {
      const addedLike = newLikes.find(l => !oldLikes.includes(l)) || "Kiểm soát viên";
      changes.push(`Lượt thích mới (${addedLike})`);
    } else if (newLikes.length < oldLikes.length) {
      const removedLike = oldLikes.find(l => !newLikes.includes(l)) || "Kiểm soát viên";
      changes.push(`Bỏ thích (${removedLike})`);
    }

    const oldShares = existing.sharedBy || [];
    const newShares = updatedReport.sharedBy || [];
    if (newShares.length > oldShares.length) {
      const addedShare = newShares.find(s => !oldShares.includes(s)) || "Kiểm soát viên";
      changes.push(`Tiếp nhận mới (${addedShare})`);
    }

    const oldDirs = existing.directives || [];
    const newDirs = updatedReport.directives || [];
    if (newDirs.length > oldDirs.length) {
      const addedDir = newDirs[newDirs.length - 1];
      changes.push(`Chỉ đạo mới (${addedDir.author}: "${addedDir.text.substring(0, 15)}...")`);
    }

    const oldRatings = existing.ratings || [];
    const newRatings = updatedReport.ratings || [];
    if (newRatings.length > oldRatings.length) {
      const addedRating = newRatings.find(nr => !oldRatings.some(or => or.evaluatorId === nr.evaluatorId));
      if (addedRating) {
        const avgStars = Math.round((addedRating.imagesRating + addedRating.infoRating + addedRating.timelinessRating) / 3);
        changes.push(`Đánh giá mới (${addedRating.evaluatorName}: ${avgStars} sao)`);
      }
    } else if (newRatings.length === oldRatings.length) {
      newRatings.forEach((nr) => {
        const or = oldRatings.find(o => o.evaluatorId === nr.evaluatorId);
        if (or) {
          const oldAvg = Math.round((or.imagesRating + or.infoRating + or.timelinessRating) / 3);
          const newAvg = Math.round((nr.imagesRating + nr.infoRating + nr.timelinessRating) / 3);
          if (oldAvg !== newAvg) {
            changes.push(`Đánh giá mới (${nr.evaluatorName}: ${newAvg} sao)`);
          }
        }
      });
    }

    const oldBadges = existing.badges || [];
    const newBadges = updatedReport.badges || [];
    if (newBadges.length > oldBadges.length) {
      const addedBadge = newBadges.find(nb => !oldBadges.some(ob => ob.id === nb.id && ob.giverId === nb.giverId));
      if (addedBadge) {
        changes.push(`Trao huy hiệu mới (${addedBadge.giverName}: "${addedBadge.name}")`);
      }
    } else if (newBadges.length < oldBadges.length) {
      const removedBadge = oldBadges.find(ob => !newBadges.some(nb => nb.id === ob.id && nb.giverId === ob.giverId));
      if (removedBadge) {
        changes.push(`Thu hồi huy hiệu (${removedBadge.giverName}: "${removedBadge.name}")`);
      }
    }

    let finalReport = updatedReport;
    if (changes.length > 0) {
      const logMsg = `${changes.join(", ")} (${updateTimeStr})`;
      logs.push(logMsg);
      finalReport = {
        ...updatedReport,
        updatedAt: updateTimeStr,
        updateLogs: logs
      };
    }

    const nextReportsList = sanitizeReports(
      reports.map((r) => r.id === updatedReport.id ? finalReport : r)
    );
    const finalizedReport = nextReportsList.find(r => r.id === updatedReport.id) || finalReport;

    setReports(nextReportsList);

    // Save to Firestore so it is persistent across devices
    saveDocument(COLLECTIONS.REPORTS, finalizedReport.id, finalizedReport).catch((err) => {
      console.error("Lỗi khi lưu cập nhật báo cáo lên Firestore:", err);
    });
  };

  const handleAddErrorCatalogItem = useCallback((item: ErrorCatalogItem) => {
    setErrorCatalog((prev) => {
      if (prev.some((x) => x.code === item.code)) {
        return prev;
      }
      return [...prev, item];
    });
    showToast("Đã thêm mã lỗi mới vào danh mục! 📝", "success");
  }, []);

  const handleUpdateErrorCatalogItem = useCallback((code: string, updated: ErrorCatalogItem) => {
    setErrorCatalog((prev) => prev.map((item) => (item.code === code ? updated : item)));
    showToast("Đã cập nhật thông tin mã lỗi thành công! 💾", "success");
  }, []);

  const handleDeleteErrorCatalogItem = useCallback((code: string) => {
    setErrorCatalog((prev) => prev.filter((item) => item.code !== code));
    showToast("Đã xóa mã lỗi khỏi danh mục! 🗑️", "success");
  }, []);

  // Export full reports backup (including image Base64 strings)
  const handleExportBackup = useCallback(() => {
    try {
      const dataStr = JSON.stringify(reports, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yy = String(today.getFullYear()).slice(-2);
      const dateStr = `${dd}_${mm}_${yy}`;
      link.href = url;
      link.download = `Saoluu_Daydu_4M1E1I_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Đã xuất file sao lưu đầy đủ kèm hình ảnh thành công! 💾", "success");
    } catch (err) {
      console.error("Lỗi xuất file sao lưu:", err);
      showToast("Lỗi khi xuất file sao lưu dữ liệu!", "error");
    }
  }, [reports]);

  // Import reports backup from JSON file, merge with existing, save to local and sync to Firestore
  const handleImportBackup = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) {
        showToast("Định dạng file không chính xác! File phải là một mảng dữ liệu báo cáo.", "error");
        return false;
      }

      const validReports = parsed.filter((r: any) => r && typeof r === "object" && r.id && r.factory && r.timestamp);
      if (validReports.length === 0) {
        showToast("Không tìm thấy dữ liệu báo cáo hợp lệ trong file sao lưu!", "error");
        return false;
      }

      setReports((prev) => {
        const mergedMap = new Map<string, QualityReport>();
        prev.forEach((r) => mergedMap.set(r.id, r));
        validReports.forEach((r) => {
          mergedMap.set(r.id, r);
        });
        const mergedList = Array.from(mergedMap.values());
        
        // Push merged list to Firestore if connected
        if (dbConnected) {
          validReports.forEach((r) => {
            saveDocument(COLLECTIONS.REPORTS, r.id, r).catch((err) => {
              console.error(`Lỗi khi tải báo cáo ${r.id} lên Firestore:`, err);
            });
          });
        }
        
        return sanitizeReports(mergedList);
      });

      showToast(`Đã khôi phục thành công ${validReports.length} bản tin từ file sao lưu!`, "success");
      return true;
    } catch (err) {
      console.error("Lỗi nhập dữ liệu sao lưu:", err);
      showToast("File JSON không hợp lệ hoặc bị lỗi phân tích!", "error");
      return false;
    }
  }, [dbConnected]);

  // Render Authentication Section (Login / registration cards)
  if (!currentUser) {
    const isRegIdValid = /^\d{4}\.\d{5}$/.test(regId);
    const isRegPhoneValid = regPhone.replace(/\s+/g, "").length === 10 && regPhone.replace(/\s+/g, "").startsWith("0");
    const isLoginPhoneValid = loginPhone.replace(/\s+/g, "").length === 10 && loginPhone.replace(/\s+/g, "").startsWith("0");

    return (
      <div className={`min-h-screen bg-[#F0F2F5] flex flex-col items-center p-4 relative font-sans overflow-y-auto selection:bg-blue-600 selection:text-white ${
        authScreen === "REGISTER" ? "justify-start pt-2 sm:pt-6 pb-20" : "justify-center"
      }`}>
        {/* Soft elegant backdrops */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 bg-opacity-10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-400 bg-opacity-10 rounded-full blur-[160px] pointer-events-none" />

        {/* Action card enclosing everything (branding logo + login/register switcher + forms) */}
        <div className={`w-full bg-white border border-slate-200 shadow-xl relative z-10 animate-scale-in text-slate-800 transition-all duration-300 ${
          authScreen === "REGISTER" 
            ? "max-w-lg rounded-2xl pt-6 px-6 pb-36 sm:pt-8 sm:px-8 sm:pb-44 my-1" 
            : "max-w-md rounded-[32px] p-6 sm:p-8"
        }`}>
          
          {/* Corporate branding header: Logo META 4M1E1I as requested */}
          <div className="flex flex-col items-center select-none text-center animate-fade-in mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl flex flex-col items-center justify-center shadow-lg border border-blue-400/20 transform transition hover:scale-105 duration-200 mb-3.5">
              <span translate="no" className="notranslate font-sans font-black text-xs sm:text-sm tracking-[0.25em] text-blue-100 uppercase mb-1 leading-none">
                META
              </span>
              <span translate="no" className="notranslate font-sans font-black text-lg sm:text-xl tracking-wider text-white leading-none">
                ANDON
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold tracking-normal mt-0.5 uppercase">
              <T>KIỂM SOÁT BIẾN ĐỘNG - NGĂN CHẶN RỦI RO</T>
            </p>
          </div>
          
          {/* Beautiful sliding tab switcher */}
          <div className={`flex bg-slate-100 p-1 rounded-xl select-none border border-slate-200 ${authScreen === "REGISTER" ? "mb-3" : "mb-6"}`}>
            <button
              type="button"
              onClick={() => {
                setAuthScreen("LOGIN");
                setAuthError("");
                setRegisterSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-305 cursor-pointer ${
                authScreen === "LOGIN"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <T>Đăng Nhập</T>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthScreen("REGISTER");
                setAuthError("");
                setRegisterSuccessMsg("");
                setRegCompany("");
                setRegBranch("");
                setRegDepartment("");
              }}
              className={`flex-1 py-1.5 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-305 cursor-pointer ${
                authScreen === "REGISTER"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <T>Đăng Ký</T>
            </button>
          </div>

          {/* Status feedback */}
          {authError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span translate="no" className="notranslate font-semibold block">{authError}</span>
            </div>
          )}

          {registerSuccessMsg && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span translate="no" className="notranslate font-semibold block">{registerSuccessMsg}</span>
            </div>
          )}

          {authScreen === "LOGIN" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <T>MÃ NHÂN SỰ</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ví dụ: 2026.00001"
                    value={loginId}
                    onChange={(e) => setLoginId(formatEmployeeId(e.target.value, loginId))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {loginId.length > 0 && !isLoginIdValid && (
                  <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1.5 font-semibold">
                    Mã nhân sự phải đúng định dạng YYYY.XXXXX (10 ký tự)
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <T>SỐ ĐIỆN THOẠI</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập số điện thoại..."
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(formatPhoneNumber(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {loginPhone.length > 0 && !isLoginPhoneValid && (
                  <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1.5 font-semibold">
                    Vui lòng nhập đúng SĐT cá nhân gồm 10 chữ số (bắt đầu bằng số 0)
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <T>MẬT KHẨU</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Remember account option matches mockups */}
              <div className="flex items-center gap-2 select-none pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-[11px] text-slate-500 font-medium cursor-pointer">
                  <T>Nhớ thông tin đăng nhập</T>
                </label>
              </div>

              <button
                type="submit"
                disabled={!isLoginIdValid || !isLoginPhoneValid || !loginPassword.trim()}
                className={`w-full py-3.5 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  (!isLoginIdValid || !isLoginPhoneValid || !loginPassword.trim())
                    ? "bg-slate-350 cursor-not-allowed opacity-50 select-none shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                }`}
              >
                <LogIn className="w-4 h-4" />
                <T>VÀO HỆ THỐNG</T>
              </button>

              {/* Administrative and help notice inside nice curved block */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center select-none mt-2">
                <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                  <T>Nếu không đăng nhập được, liên hệ Admin:</T>
                </p>
                <p className="text-xs text-blue-600 font-black font-semibold mt-1">
                  <T>Lê Nhật Trường (0907.767.304)</T>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 pt-1.5">
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <T>HỌ VÀ TÊN</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập họ tên đầy đủ..."
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <T>CHỨC VỤ *</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nhân Viên, Trưởng Ca, Trưởng Phòng..."
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Grid 1: employee ID and phone number - side by side on wide screen, stack on mobile for maximum legibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">
                    <T>MÃ NHÂN SỰ *</T>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2026.00001"
                      value={regId}
                      onChange={(e) => setRegId(formatEmployeeId(e.target.value, regId))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {regId.length > 0 && !isRegIdValid && (
                    <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1 font-bold">
                      Định dạng sai: YYYY.XXXXX
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">
                    <T>SỐ ĐIỆN THOẠI *</T>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ví dụ: 090x..."
                      value={regPhone}
                      onChange={(e) => setRegPhone(formatPhoneNumber(e.target.value))}
                      className={`w-full bg-slate-50 border pl-9 pr-3 py-2.5 text-xs text-slate-850 font-mono shadow-sm focus:outline-none transition-colors rounded-xl ${
                        regPhone.length > 0 && !isRegPhoneValid
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  {regPhone.length > 0 && !isRegPhoneValid && (
                    <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1 font-bold">
                      SĐT gồm 10 số (0xx)
                    </span>
                  )}
                </div>
              </div>

              {/* Grid 2: password and confirm password - responsive layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">
                    <T>MẬT KHẨU *</T>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Mật khẩu..."
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">
                    <T>XÁC NHẬN *</T>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Nhập lại..."
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  {regPassword !== regConfirmPassword && regConfirmPassword.length > 0 && (
                    <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1 font-bold">
                      Mật khẩu không khớp
                    </span>
                  )}
                </div>
              </div>

              <div className="select-none relative z-40">
                <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  <T>CÔNG TY THÀNH VIÊN</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpenRegCompany(!isOpenRegCompany);
                      setIsOpenRegBranch(false);
                      setIsOpenRegDept(false);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm text-left flex items-center justify-between cursor-pointer"
                  >
                    <span translate="no" className={`notranslate truncate block max-w-full ${regCompany ? "text-slate-850 font-semibold text-xs" : "text-slate-400 font-semibold text-[11px]"}`}>
                      {companies.find((c) => c.id === regCompany)?.name || "--- Chọn Công ty thành viên ---"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {isOpenRegCompany && (
                    <>
                      <div className="fixed inset-0 z-45" onClick={() => setIsOpenRegCompany(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-[180px] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setRegCompany("");
                            setRegBranch("");
                            setRegDepartment("");
                            setIsOpenRegCompany(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 cursor-pointer"
                        >
                          --- Chọn Công ty thành viên ---
                        </button>
                        {companies.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setRegCompany(c.id);
                              setRegBranch("");
                              setRegDepartment("");
                              setIsOpenRegCompany(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                              regCompany === c.id ? "bg-blue-50/70 text-blue-800 font-bold" : "text-slate-805"
                            }`}
                          >
                            <span>{c.name}</span>
                            {regCompany === c.id && <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="select-none relative z-30">
                <label className="text-[11px] text-emerald-700 font-bold uppercase block mb-1">
                  <T>CHI NHÁNH/ VĂN PHÒNG ĐẠI DIỆN *</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-emerald-600">
                    <Building className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpenRegBranch(!isOpenRegBranch);
                      setIsOpenRegCompany(false);
                      setIsOpenRegDept(false);
                    }}
                    style={{ borderColor: "#10b981" }}
                    className="w-full bg-white border border-emerald-500 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm text-left flex items-center justify-between cursor-pointer animate-fade-in"
                  >
                    <span className={regBranch ? "text-slate-850 font-semibold" : "text-slate-400 font-semibold text-[11px] truncate block max-w-full"}>
                      {regBranch || "--- Chọn Chi nhánh/ Văn Phòng đại diện ---"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-emerald-600" />
                  </button>

                  {isOpenRegBranch && (
                    <>
                      <div className="fixed inset-0 z-35" onClick={() => setIsOpenRegBranch(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-[180px] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setRegBranch("");
                            setRegDepartment("");
                            setIsOpenRegBranch(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 cursor-pointer"
                        >
                          --- Chọn Chi nhánh/ Văn Phòng đại diện ---
                        </button>
                        {(() => {
                          const allBranches = regCompany 
                            ? branches.filter((b) => b.companyId === regCompany)
                            : branches;
                          return allBranches.map((b) => {
                            const nameWithSuffix = b.name.includes("(") 
                              ? b.name 
                              : `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
                            const isSelected = regBranch === nameWithSuffix;
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setRegBranch(nameWithSuffix);
                                  setRegCompany(b.companyId); // Automatically sync the company
                                  setRegDepartment("");
                                  setIsOpenRegBranch(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  isSelected ? "bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500 pl-3.5" : "text-slate-805"
                                }`}
                              >
                                <span>{nameWithSuffix}</span>
                                {isSelected && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="select-none relative z-20">
                <label className="text-[11px] text-emerald-700 font-bold uppercase block mb-1">
                  <T>BỘ PHẬN/ ĐƠN VỊ *</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-emerald-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpenRegDept(!isOpenRegDept);
                      setIsOpenRegCompany(false);
                      setIsOpenRegBranch(false);
                    }}
                    style={{ borderColor: "#10b981" }}
                    className="w-full bg-white border border-emerald-500 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm text-left flex items-center justify-between cursor-pointer animate-fade-in"
                  >
                    <span className={regDepartment ? "text-slate-850 font-semibold" : "text-slate-400 font-semibold text-[11px] truncate block max-w-full"}>
                      {regDepartment || "--- Chọn Bộ phận/ Đơn vị làm việc ---"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-emerald-600" />
                  </button>

                  {isOpenRegDept && (
                    <>
                      <div className="fixed inset-0 z-25" onClick={() => setIsOpenRegDept(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-[180px] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setRegDepartment("");
                            setIsOpenRegDept(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 cursor-pointer"
                        >
                          --- Chọn Bộ phận/ Đơn vị làm việc ---
                        </button>
                        {(() => {
                          const selectedB = branches.find((b) => {
                            const nameWithSuffix = b.name.includes("(") 
                              ? b.name 
                              : `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
                            return b.name === regBranch || nameWithSuffix === regBranch;
                          });
                          const filteredDepts = selectedB
                            ? departments.filter((d) => d.branchId === selectedB.id)
                            : [];
                          return filteredDepts.map((d) => {
                            const branchSuffix = selectedB ? selectedB.id : d.branchId;
                            const nameWithSuffix = d.name.includes("(")
                              ? d.name
                              : `${d.name.replace(/\s*\([^)]+\)$/, "").trim()} (${branchSuffix})`;
                            const isSelected = regDepartment === nameWithSuffix;
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setRegDepartment(nameWithSuffix);
                                  setIsOpenRegDept(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  isSelected ? "bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500 pl-3.5" : "text-slate-855"
                                }`}
                              >
                                <span>{nameWithSuffix}</span>
                                {isSelected && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 select-none">
                <button
                  type="submit"
                  disabled={!isRegIdValid || !isRegPhoneValid || !regBranch || !regDepartment || !regFullName.trim() || !regPassword.trim() || regPassword !== regConfirmPassword || !regPosition.trim()}
                  className={`w-full py-3.5 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                    (!isRegIdValid || !isRegPhoneValid || !regBranch || !regDepartment || !regFullName.trim() || !regPassword.trim() || regPassword !== regConfirmPassword || !regPosition.trim())
                      ? "bg-slate-350 cursor-not-allowed opacity-50 select-none shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                  }`}
                >
                  <T>Đăng Ký Tài Khoản</T>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Intercept pending users and lock them onto the Waiting Landing Screen with auto-polling checks
  if (currentUser && currentUser.status === UserStatus.PENDING) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 relative font-sans overflow-y-auto selection:bg-blue-600 selection:text-white">
        {/* Soft elegant backdrops */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-400 bg-opacity-10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-400 bg-opacity-10 rounded-full blur-[160px] pointer-events-none" />

        {/* Corporate branding header */}
        <div className="flex flex-col items-center mb-8 select-none text-center animate-fade-in pointer-events-none">
          <div className="px-10 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[18px] flex items-center justify-center shadow-lg border border-blue-400/20 mb-3.5 transform transition hover:scale-105 duration-200">
            <span translate="no" className="notranslate font-sans font-black text-2xl tracking-wider text-white leading-none">
              4M1E1I
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold tracking-normal mt-1 uppercase">
            <T>KIỂM SOÁT BIẾN ĐỘNG - NGĂN CHẶN RỦI RO</T>
          </p>
        </div>

        {/* Waiting card */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-lg relative z-10 text-center space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 animate-pulse">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-850 uppercase">
              <T>TÀI KHOẢN ĐANG CHỜ PHÊ DUYỆT</T>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              <T>Hệ thống đang kiểm tra trạng thái kích hoạt tài khoản của bạn trên nền tảng cơ sở dữ liệu.</T>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <T>Thông báo phê duyệt tài khoản</T>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
              <T>Tài khoản của bạn đang chờ quản trị viên phê duyệt. Hệ thống sẽ tự động đưa bạn vào màn hình chính sau khi Trưởng bộ phận hoặc Chủ Admin kích hoạt (tự động kiểm tra trạng thái mỗi 8 giây).</T>
            </p>
          </div>

          {/* User details summary for reference */}
          <div className="border border-slate-100 p-4 rounded-xl text-left text-xs text-slate-600 space-y-1.5 bg-slate-50">
            <div><strong><T>Họ tên:</T></strong> <span translate="no" className="notranslate">{currentUser.fullName}</span></div>
            <div><strong><T>Số điện thoại:</T></strong> <span translate="no" className="notranslate">{currentUser.phone}</span></div>
            <div><strong><T>Mã nhân sự:</T></strong> <span translate="no" className="notranslate">{currentUser.id}</span></div>
            <div><strong><T>Bộ phận/Chi nhánh:</T></strong> <span translate="no" className="notranslate">{getFormattedUserDept(currentUser.department, currentUser.branch)} - {getFormattedUserBranch(currentUser.branch, currentUser.company)}</span></div>
          </div>

          {/* Polling loading bar */}
          <div className="space-y-1.5 pt-2">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full w-2/3 rounded-full animate-pulse" style={{ animationDuration: "2s" }} />
            </div>
            <div className="text-[10px] text-slate-400 font-bold tracking-tight">
              <T>Tự động kiểm tra sau mỗi 8 giây...</T>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentUser(null);
              safeRemoveItem("4m1e1i_current_user");
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
          >
            <T>THOÁT RA / ĐĂNG NHẬP SỐ KHÁC</T>
          </button>
        </div>
      </div>
    );
  }

  const handleForceSyncMetadata = async () => {
    if (!dbConnected) {
      throw new Error("Không có kết nối đến cơ sở dữ liệu Cloud Firestore!");
    }
    
    // 1. Sync Companies
    const cloudCompanies = await fetchCollection<Company>(COLLECTIONS.COMPANIES);
    for (const cloudC of cloudCompanies) {
      if (!companies.some(c => c.id === cloudC.id)) {
        await deleteDocument(COLLECTIONS.COMPANIES, cloudC.id);
      }
    }
    for (const c of companies) {
      await saveDocument(COLLECTIONS.COMPANIES, c.id, c);
    }

    // 2. Sync Branches
    const cloudBranches = await fetchCollection<Branch>(COLLECTIONS.BRANCHES);
    for (const cloudB of cloudBranches) {
      if (!branches.some(b => b.id === cloudB.id)) {
        await deleteDocument(COLLECTIONS.BRANCHES, cloudB.id);
      }
    }
    for (const b of branches) {
      await saveDocument(COLLECTIONS.BRANCHES, b.id, b);
    }

    // 3. Sync Departments
    const cloudDepts = await fetchCollection<Department>(COLLECTIONS.DEPARTMENTS);
    for (const cloudD of cloudDepts) {
      if (!departments.some(d => d.id === cloudD.id)) {
        await deleteDocument(COLLECTIONS.DEPARTMENTS, cloudD.id);
      }
    }
    for (const d of departments) {
      await saveDocument(COLLECTIONS.DEPARTMENTS, d.id, d);
    }
  };

  const handleForceSyncUsers = async () => {
    if (!dbConnected) {
      throw new Error("Không có kết nối đến cơ sở dữ liệu Cloud Firestore!");
    }
    
    // Sync Users
    const cloudUsers = await fetchCollection<User>(COLLECTIONS.USERS);
    for (const cloudU of cloudUsers) {
      if (!users.some(u => u.id === cloudU.id)) {
        await deleteDocument(COLLECTIONS.USERS, cloudU.id);
      }
    }
    for (const u of users) {
      await saveDocument(COLLECTIONS.USERS, u.id, u);
    }
  };

  const confirmDialogMarkup = confirmDialog && confirmDialog.isOpen && (
    <div style={{ zIndex: 200000 }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 shadow-2xl border border-slate-150 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm mb-2">
          <T>{confirmDialog.title}</T>
        </h3>
        <p className="text-slate-500 text-[11px] mb-6 leading-relaxed px-1">
          <T>{confirmDialog.message}</T>
        </p>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={() => setConfirmDialog(null)}
            className="py-2.5 text-[11px] font-bold border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <T>QUAY LẠI</T>
          </button>
          <button
            type="button"
            onClick={() => {
              confirmDialog.onConfirm();
            }}
            className="py-2.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <T>ĐỒNG Ý</T>
          </button>
        </div>
      </div>
    </div>
  );

  // Nếu đang kích hoạt chụp cuộn xả khung, cưỡng bức kết xuất duy nhất danh sách báo cáo, không giữ bất kỳ lớp giao diện máy tính nào trong DOM
  if (isNativeScrollActive) {
    return (
      <MobileListOnly
        reports={reportsForPrint || reports}
        currentUser={currentUser}
        branches={branches}
        mobileUIConfig={mobileUIConfig}
        onClose={() => handleSetNativeScrollActive(false)}
      />
    );
  }

  // Active user view workspace: 1. Real mobile device logic (Strictly separate DOM from Desktop layout)
  if (currentUser && isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans relative overflow-x-hidden p-0">
        {isFormOpen ? (
          <ReportForm
            key={editingReport ? editingReport.id : "new"}
            currentUser={currentUser}
            users={users}
            editingReport={editingReport}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingReport(null);
            }}
            onSubmitReport={handleSubmitReport}
            offlineMode={offlineMode}
            branches={branches}
            mobileUIConfig={mobileUIConfig}
            onShowToast={showToast}
            isQcFeatureEnabled={isQcFeatureEnabled}
          />
        ) : (
          <MobileFrame
            errorCatalog={errorCatalog}
            onAddErrorCatalogItem={handleAddErrorCatalogItem}
            isQcFeatureEnabled={isQcFeatureEnabled}
            onToggleQcFeature={setIsQcFeatureEnabled}
            reports={reports}
            currentUserId={currentUser.id}
            onOpenReportForm={() => setIsFormOpen(true)}
            onDeleteReport={handleDeleteReportTrigger}
            onEditReport={handleEditReportTrigger}
            offlineMode={offlineMode}
            currentUser={currentUser}
            onUpdateReport={handleUpdateReport}
            mobileUIConfig={mobileUIConfig}
            onUpdateMobileUIConfig={handleUpdateMobileUIConfig}
            onLogout={() => setCurrentUser(null)}
            branches={branches}
            onManualRefresh={syncFromDb}
            users={users}
            companies={companies}
            onSwitchToDesktop={() => {}}
            chats={chats}
            onAddChatMessage={handleAddChatMessage}
            onUpdateUserStatus={handleUpdateStatus}
            onUpdateUserRole={handleUpdateRole}
            isNativeScrollActive={isNativeScrollActive}
            setIsNativeScrollActive={handleSetNativeScrollActive}
            tickerConfig={tickerConfig}
            broadcasts={broadcasts}
            onUpdateTickerConfig={handleUpdateTickerConfig}
            aiKnowledgeText={aiKnowledgeText}
            onUpdateAiKnowledge={handleUpdateAiKnowledge}
            onAddBroadcast={handleAddBroadcast}
            onDeleteBroadcast={handleDeleteBroadcast}
            deletedNotifIds={deletedNotifIds}
            onDeleteNotification={handleDeleteNotification}
            systemNotifications={systemNotifications}
            readNotifIds={readNotifIds}
            setReadNotifIds={setReadNotifIds}
            topics={topics}
            replies={replies}
            onAddForumTopic={handleAddForumTopic}
            onAddForumReply={handleAddForumReply}
            onUpdateForumTopicStatus={handleUpdateForumTopicStatus}
            onToggleForumTopicPin={handleToggleForumTopicPin}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {/* High-fidelity elegant Custom Toast system for CBNV */}
        {toast && (
          <div 
            style={{ zIndex: 100000 }} 
            className="fixed top-6 left-1/2 -translate-x-1/2 max-w-[90vw] w-fit min-w-[300px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 border border-slate-700/50 select-none animate-fadeIn transition-all"
          >
            {toast.type === "success" && (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {toast.type === "warning" && (
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
            )}
            
            <div className="flex-1 text-left text-[11px] font-bold leading-normal text-slate-100 pr-2">
              <T>{toast.message}</T>
            </div>
            
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold px-1 rounded-sm active:scale-95"
            >
              ✕
            </button>
          </div>
        )}

        {confirmDialogMarkup}
      </div>
    );
  }

  // Active user view workspace: 2. Simulated smartphone workspace on desktop screens for STAFF or REVIEWER
  if (currentUser && (currentUser.role === UserRole.STAFF || currentUser.role === UserRole.REVIEWER)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#2563eb] to-[#1d4ed8] flex items-center justify-center p-0 sm:p-4 relative font-sans overflow-hidden select-none">
        {/* Ambient decorative glowing spots */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-400 bg-opacity-30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#6366f1] bg-opacity-35 rounded-full blur-[140px] pointer-events-none" />

        {isFormOpen ? (
          <ReportForm
            key={editingReport ? editingReport.id : "new"}
            currentUser={currentUser}
            users={users}
            editingReport={editingReport}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingReport(null);
            }}
            onSubmitReport={handleSubmitReport}
            offlineMode={offlineMode}
            branches={branches}
            mobileUIConfig={mobileUIConfig}
            onShowToast={showToast}
            isQcFeatureEnabled={isQcFeatureEnabled}
          />
        ) : (
          <MobileFrame
            errorCatalog={errorCatalog}
            onAddErrorCatalogItem={handleAddErrorCatalogItem}
            isQcFeatureEnabled={isQcFeatureEnabled}
            onToggleQcFeature={setIsQcFeatureEnabled}
            reports={reports}
            currentUserId={currentUser.id}
            onOpenReportForm={() => setIsFormOpen(true)}
            onDeleteReport={handleDeleteReportTrigger}
            onEditReport={handleEditReportTrigger}
            offlineMode={offlineMode}
            currentUser={currentUser}
            onUpdateReport={handleUpdateReport}
            mobileUIConfig={mobileUIConfig}
            onUpdateMobileUIConfig={handleUpdateMobileUIConfig}
            onLogout={() => setCurrentUser(null)}
            branches={branches}
            onManualRefresh={syncFromDb}
            users={users}
            companies={companies}
            onSwitchToDesktop={() => {}}
            chats={chats}
            onAddChatMessage={handleAddChatMessage}
            onUpdateUserStatus={handleUpdateStatus}
            onUpdateUserRole={handleUpdateRole}
            isNativeScrollActive={isNativeScrollActive}
            setIsNativeScrollActive={handleSetNativeScrollActive}
            tickerConfig={tickerConfig}
            broadcasts={broadcasts}
            onUpdateTickerConfig={handleUpdateTickerConfig}
            aiKnowledgeText={aiKnowledgeText}
            onUpdateAiKnowledge={handleUpdateAiKnowledge}
            onAddBroadcast={handleAddBroadcast}
            onDeleteBroadcast={handleDeleteBroadcast}
            deletedNotifIds={deletedNotifIds}
            onDeleteNotification={handleDeleteNotification}
            systemNotifications={systemNotifications}
            readNotifIds={readNotifIds}
            setReadNotifIds={setReadNotifIds}
            topics={topics}
            replies={replies}
            onAddForumTopic={handleAddForumTopic}
            onAddForumReply={handleAddForumReply}
            onUpdateForumTopicStatus={handleUpdateForumTopicStatus}
            onToggleForumTopicPin={handleToggleForumTopicPin}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {/* High-fidelity elegant Custom Toast system for CBNV */}
        {toast && (
          <div 
            style={{ zIndex: 100000 }} 
            className="fixed top-6 left-1/2 -translate-x-1/2 max-w-[90vw] w-fit min-w-[300px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 border border-slate-700/50 select-none animate-fadeIn transition-all"
          >
            {toast.type === "success" && (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {toast.type === "warning" && (
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
            )}
            
            <div className="flex-1 text-left text-[11px] font-bold leading-normal text-slate-100 pr-2">
              <T>{toast.message}</T>
            </div>
            
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold px-1 rounded-sm active:scale-95"
            >
              ✕
            </button>
          </div>
        )}

        {confirmDialogMarkup}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col relative overflow-hidden font-sans">
      {/* Upper header line with simulated offline trigger */}
      <div className="hidden lg:flex bg-[#1E293B] px-6 py-2 border-b border-slate-700 justify-between items-center select-none text-[10px] text-slate-300 shrink-0 main-app-header">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          <T>BỘ PHẬN CHỈ ĐẠO:</T>
          <T className="font-bold text-white uppercase">{STANDARDIZED_QC_DEPT} TÂN PHÚ VIỆT NAM</T>
          <span className="text-slate-600 mx-1">|</span>
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none ${
            dbConnected 
              ? "bg-emerald-500/20 text-emerald-405 border border-emerald-500/30" 
              : dbLoading 
                ? "bg-blue-500/25 text-blue-300 border border-blue-500/30"
                : "bg-slate-700 text-slate-400 border border-slate-600"
          }`}>
            <span className={`w-1 h-1 rounded-full ${dbConnected ? "bg-emerald-400" : dbLoading ? "bg-blue-500 animate-ping" : "bg-slate-400"}`} />
            <span translate="no" className="notranslate">CLOUD DB: {dbStatus}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* OFFLINE PRETEST MODE CONTROLLER */}
          <button
            onClick={handleToggleOfflineMode}
            className={`px-3 py-1 rounded-full text-[9px] font-extrabold flex items-center gap-1.5 transition-all select-none cursor-pointer ${
              offlineMode
                ? "bg-red-500/20 text-red-400 border border-red-500/30 font-bold"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            }`}
            title="Nhấn để ngắt/kết nối mạng để giả lập chế độ offline"
          >
            {offlineMode ? <WifiOff className="w-3 h-3 text-red-500" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <T>{offlineMode ? "ĐANG OFFLINE (Gỉa lập mất mạng)" : "ĐANG ONLINE (Giả lập có mạng)"}</T>
          </button>

          {/* Toggle preview visualizer */}
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold rounded-full flex items-center gap-1 transition-all cursor-pointer"
          >
            {showMobilePreview ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
            <T>{showMobilePreview ? "ĐÓNG GIẢ LẬP MOBILE" : "MỞ GIẢ LẬP MOBILE"}</T>
          </button>
        </div>
      </div>

      {/* Side-by-side layout (Desktop view takes full remaining space, accompanied by a luxury Floating/Stuck iPhone preview) */}
      <div className="flex-1 flex min-h-0">
        <div className="hidden lg:flex flex-1 min-w-0 flex-col dashboard-desktop-wrapper">
          <DashboardDesktop
            currentUser={currentUser}
            users={users}
            reports={reports}
            companies={companies}
            branches={branches}
            departments={departments}
            broadcasts={broadcasts}
            chats={chats}
            offlineMode={offlineMode}
            onUpdateUserStatus={handleUpdateStatus}
            onUpdateUserRole={handleUpdateRole}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onAddDepartment={handleAddDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteCompany={handleDeleteCompany}
            onDeleteBranch={handleDeleteBranch}
            onDeleteDepartment={handleDeleteDepartment}
            onAddBroadcast={handleAddBroadcast}
            onAddChatMessage={handleAddChatMessage}
            onLogout={() => setCurrentUser(null)}
            onToggleMobilePreview={() => setShowMobilePreview((prev) => !prev)}
            onUpdateUser={handleUpdateUser}
            productionRequests={productionRequests}
            setProductionRequests={setProductionRequests}
            productionRequestItemsMap={productionRequestItemsMap}
            setProductionRequestItemsMap={setProductionRequestItemsMap}
            orderImplementations={orderImplementations}
            setOrderImplementations={setOrderImplementations}
            productsCatalog={productsCatalog}
            setProductsCatalog={setProductsCatalog}
            moldsCatalog={moldsCatalog}
            setMoldsCatalog={setMoldsCatalog}
            onUpdateReport={handleUpdateReport}
            onDeleteReport={handleDeleteReportTrigger}
            onForceSyncMetadata={handleForceSyncMetadata}
            onForceSyncUsers={handleForceSyncUsers}
            onShowToast={showToast}
            onDeleteBroadcast={handleDeleteBroadcast}
            tickerConfig={tickerConfig}
            onUpdateTickerConfig={handleUpdateTickerConfig}
            aiKnowledgeText={aiKnowledgeText}
            onUpdateAiKnowledge={handleUpdateAiKnowledge}
            systemNotifications={systemNotifications}
            onDeleteNotification={handleDeleteNotification}
            readNotifIds={readNotifIds}
            setReadNotifIds={setReadNotifIds}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            errorCatalog={errorCatalog}
            onAddErrorCatalogItem={handleAddErrorCatalogItem}
            onUpdateErrorCatalogItem={handleUpdateErrorCatalogItem}
            onDeleteErrorCatalogItem={handleDeleteErrorCatalogItem}
            isQcFeatureEnabled={isQcFeatureEnabled}
            onToggleQcFeature={setIsQcFeatureEnabled}
          />
        </div>

        {/* Floating/Docked elegant iPhone mockup frame on the right side if active */}
        {showMobilePreview && (
          <div className="hidden lg:flex w-[420px] bg-[#F7F9FC] border-l border-slate-200 p-6 flex-col items-center shrink-0 overflow-y-auto select-none shadow-inner mobile-preview-dock">
            <div className="w-full flex items-center justify-between mb-4 header-mobile-controls">
              <T className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">
                📱 Xem trước giao diện di động (Mobile Preview)
              </T>
            </div>

            {isFormOpen ? (
              <ReportForm
                key={editingReport ? editingReport.id : "new"}
                currentUser={currentUser}
                users={users}
                editingReport={editingReport}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingReport(null);
                }}
                onSubmitReport={handleSubmitReport}
                offlineMode={offlineMode}
                branches={branches}
                mobileUIConfig={mobileUIConfig}
                onShowToast={showToast}
                errorCatalog={errorCatalog}
                isQcFeatureEnabled={isQcFeatureEnabled}
              />
            ) : (
              <MobileFrame
                errorCatalog={errorCatalog}
                onAddErrorCatalogItem={handleAddErrorCatalogItem}
                isQcFeatureEnabled={isQcFeatureEnabled}
                onToggleQcFeature={setIsQcFeatureEnabled}
                reports={reports}
                currentUserId={currentUser.id}
                onOpenReportForm={() => setIsFormOpen(true)}
                onDeleteReport={handleDeleteReportTrigger}
                onEditReport={handleEditReportTrigger}
                offlineMode={offlineMode}
                currentUser={currentUser}
                onUpdateReport={handleUpdateReport}
                mobileUIConfig={mobileUIConfig}
                onUpdateMobileUIConfig={handleUpdateMobileUIConfig}
                onLogout={() => setCurrentUser(null)}
                branches={branches}
                onManualRefresh={syncFromDb}
                users={users}
                companies={companies}
                onSwitchToDesktop={() => setShowMobilePreview(false)}
                aiKnowledgeText={aiKnowledgeText}
                onUpdateAiKnowledge={handleUpdateAiKnowledge}
                chats={chats}
                onAddChatMessage={handleAddChatMessage}
                onUpdateUserStatus={handleUpdateStatus}
                onUpdateUserRole={handleUpdateRole}
                isNativeScrollActive={isNativeScrollActive}
                setIsNativeScrollActive={handleSetNativeScrollActive}
                tickerConfig={tickerConfig}
                broadcasts={broadcasts}
                onUpdateTickerConfig={handleUpdateTickerConfig}
                onAddBroadcast={handleAddBroadcast}
                onDeleteBroadcast={handleDeleteBroadcast}
                deletedNotifIds={deletedNotifIds}
                onDeleteNotification={handleDeleteNotification}
                systemNotifications={systemNotifications}
                readNotifIds={readNotifIds}
                setReadNotifIds={setReadNotifIds}
                topics={topics}
                replies={replies}
                onAddForumTopic={handleAddForumTopic}
                onAddForumReply={handleAddForumReply}
                onUpdateForumTopicStatus={handleUpdateForumTopicStatus}
                onToggleForumTopicPin={handleToggleForumTopicPin}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
              />
            )}
          </div>
        )}
      </div>

      {/* Floating mobile simulator overlay on small screen if toggled */}
      {showMobilePreview && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-0">
          <div className="relative w-full h-[100dvh] max-w-[440px] flex flex-col items-center justify-center">
            {isFormOpen ? (
              <ReportForm
                key={editingReport ? editingReport.id : "new"}
                currentUser={currentUser}
                users={users}
                editingReport={editingReport}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingReport(null);
                }}
                onSubmitReport={handleSubmitReport}
                offlineMode={offlineMode}
                branches={branches}
                mobileUIConfig={mobileUIConfig}
                onShowToast={showToast}
                errorCatalog={errorCatalog}
                isQcFeatureEnabled={isQcFeatureEnabled}
              />
            ) : (
              <MobileFrame
                errorCatalog={errorCatalog}
                onAddErrorCatalogItem={handleAddErrorCatalogItem}
                isQcFeatureEnabled={isQcFeatureEnabled}
                onToggleQcFeature={setIsQcFeatureEnabled}
                reports={reports}
                currentUserId={currentUser.id}
                onOpenReportForm={() => setIsFormOpen(true)}
                onDeleteReport={handleDeleteReportTrigger}
                onEditReport={handleEditReportTrigger}
                offlineMode={offlineMode}
                currentUser={currentUser}
                onUpdateReport={handleUpdateReport}
                mobileUIConfig={mobileUIConfig}
                onUpdateMobileUIConfig={handleUpdateMobileUIConfig}
                onLogout={() => setCurrentUser(null)}
                branches={branches}
                onManualRefresh={syncFromDb}
                users={users}
                companies={companies}
                onSwitchToDesktop={() => setShowMobilePreview(false)}
                aiKnowledgeText={aiKnowledgeText}
                onUpdateAiKnowledge={handleUpdateAiKnowledge}
                chats={chats}
                onAddChatMessage={handleAddChatMessage}
                onUpdateUserStatus={handleUpdateStatus}
                onUpdateUserRole={handleUpdateRole}
                isNativeScrollActive={isNativeScrollActive}
                setIsNativeScrollActive={handleSetNativeScrollActive}
                tickerConfig={tickerConfig}
                broadcasts={broadcasts}
                onUpdateTickerConfig={handleUpdateTickerConfig}
                onAddBroadcast={handleAddBroadcast}
                onDeleteBroadcast={handleDeleteBroadcast}
                deletedNotifIds={deletedNotifIds}
                onDeleteNotification={handleDeleteNotification}
                systemNotifications={systemNotifications}
                readNotifIds={readNotifIds}
                setReadNotifIds={setReadNotifIds}
                topics={topics}
                replies={replies}
                onAddForumTopic={handleAddForumTopic}
                onAddForumReply={handleAddForumReply}
                onUpdateForumTopicStatus={handleUpdateForumTopicStatus}
                onToggleForumTopicPin={handleToggleForumTopicPin}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
              />
            )}
          </div>
        </div>
      )}

      {/* High-fidelity elegant Custom Confirmation Dialog */}
      {confirmDialogMarkup}

      {/* High-fidelity elegant Custom Toast system */}
      {toast && (
        <div 
          style={{ zIndex: 100000 }} 
          className="fixed top-6 left-1/2 -translate-x-1/2 max-w-[90vw] w-fit min-w-[300px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 border border-slate-700/50 select-none animate-fadeIn transition-all"
        >
          {toast.type === "success" && (
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
          )}
          {toast.type === "error" && (
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {toast.type === "warning" && (
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
          {toast.type === "info" && (
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
          )}
          
          <div className="flex-1 text-left text-[11px] font-bold leading-normal text-slate-100 pr-2">
            <T>{toast.message}</T>
          </div>
          
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold px-1 rounded-sm active:scale-95"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
