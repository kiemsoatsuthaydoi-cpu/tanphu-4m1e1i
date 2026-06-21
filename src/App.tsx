import React, { useState, useEffect } from "react";
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
  ProductionRequestItem
} from "./types";
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
  initialOrderImplementations
} from "./data";
import MobileFrame from "./components/MobileFrame";
import ReportForm from "./components/ReportForm";
import DashboardDesktop from "./components/DashboardDesktop";
import { db } from "./utils/firebase";
import { 
  COLLECTIONS, 
  seedFirestoreIfNeeded, 
  fetchCollection, 
  saveDocument, 
  deleteDocument 
} from "./utils/firebaseSync";

// Helper to parse date/time string format e.g., "18:15:18 18/06/2026" or "18/06/2026"
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

export default function App() {
  // Firebase configurations & connection indicators
  const [dbLoading, setDbLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState("Đang kết nối Firestore...");
  const [dbConnected, setDbConnected] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);

  // Persistence state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("4m1e1i_users");
    let loadedUsers = saved ? JSON.parse(saved) : initialUsers;
    // Restore original admin password for Lê Nhật Trường and promote Kim Thị Bích Tuyền
    loadedUsers = loadedUsers.map((u: User) => {
      if (u.id === "2024.00912") {
        return { ...u, role: UserRole.REVIEWER };
      }
      if (u.id === "2018.00281" && u.password === "123456") {
        return { ...u, password: "111222" };
      }
      return u;
    });
    return loadedUsers.map((u: User) => {
      let deptName = u.department || "";
      let branchName = u.branch || "";
      
      // Auto-correct spelling issues:
      deptName = deptName.replace(/Quản\s+lí/gi, "Quản Lý");
      deptName = deptName.replace(/quản\s+lí/gi, "Quản Lý");
      deptName = deptName.replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng");
      deptName = deptName.replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

      let suffix = "";
      if (branchName.includes("TPP-CTY") || branchName.includes("Văn Phòng")) {
        suffix = " (TPP-CTY)";
      } else if (branchName.includes("TPP-BNI") || branchName.includes("Bắc Ninh")) {
        suffix = " (TPP-BNI)";
      } else if (branchName.includes("TPP-LAN") || branchName.includes("Long An")) {
        suffix = " (TPP-LAN)";
      } else if (branchName.includes("TPP-314") || branchName.includes("314")) {
        suffix = " (TPP-314)";
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
  });

  const [reports, setReports] = useState<QualityReport[]>(() => {
    const saved = localStorage.getItem("4m1e1i_reports");
    const loadedReports = saved ? JSON.parse(saved) : initialReports;
    return loadedReports.map((r: QualityReport) => {
      let dept = r.uploaderDepartment || "";
      dept = dept.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
      return {
        ...r,
        uploaderDepartment: dept
      };
    });
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem("4m1e1i_companies");
    if (saved) {
      return JSON.parse(saved);
    }
    return initialCompanies;
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem("4m1e1i_branches");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((b: any) => ({
        ...b,
        name: b.name
          .replace(" (CNBN)", "")
          .replace(" (CNLA)", "")
          .replace(" (NM314)", ""),
        isScoring: b.id === "TPP-CTY" ? true : b.isScoring
      }));
    }
    return initialBranches;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const savedBranchesStr = localStorage.getItem("4m1e1i_branches");
    const loadedBranches: Branch[] = savedBranchesStr ? JSON.parse(savedBranchesStr) : initialBranches;

    const saved = localStorage.getItem("4m1e1i_departments");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((d: any) => {
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
          const match = br.name.match(/\(([^)]+)\)/);
          if (match) {
            suffix = ` (${match[1]})`;
          } else {
            // Fallback for custom branch - extract uppercase initials/code
            const words = br.name.trim().split(/\s+/);
            const lastWord = words[words.length - 1];
            if (lastWord && lastWord === lastWord.toUpperCase() && lastWord.length >= 2) {
              suffix = ` (${lastWord})`;
            } else {
              suffix = "";
            }
          }
        } else {
          if (!d.branchId.startsWith("BRANCH-") && !d.branchId.startsWith("DEPT-") && d.branchId.length <= 10) {
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
    }
    return initialDepartments;
  });

  const [broadcasts, setBroadcasts] = useState<BroadcastNotice[]>(() => {
    const saved = localStorage.getItem("4m1e1i_broadcasts");
    return saved ? JSON.parse(saved) : initialBroadcastNotice;
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("4m1e1i_chats");
    return saved ? JSON.parse(saved) : initialChatMessages;
  });

  // Offline queue
  const [offlineQueue, setOfflineQueue] = useState<QualityReport[]>(() => {
    const saved = localStorage.getItem("4m1e1i_offline_queue");
    return saved ? JSON.parse(saved) : [];
  });

  // Order pipeline & SCM states
  const [productionRequests, setProductionRequests] = useState<ProductionRequest[]>(() => {
    const saved = localStorage.getItem("4m1e1i_prod_requests");
    return saved ? JSON.parse(saved) : initialProductionRequests;
  });

  const [productionRequestItemsMap, setProductionRequestItemsMap] = useState<Record<string, ProductionRequestItem[]>>(() => {
    const saved = localStorage.getItem("4m1e1i_prod_request_items");
    return saved ? JSON.parse(saved) : initialProductionRequestItemsMap;
  });

  const [orderImplementations, setOrderImplementations] = useState<OrderImplementation[]>(() => {
    const saved = localStorage.getItem("4m1e1i_order_implementations");
    return saved ? JSON.parse(saved) : initialOrderImplementations;
  });

  const [productsCatalog, setProductsCatalog] = useState<CatalogProduct[]>(() => {
    const saved = localStorage.getItem("4m1e1i_products_catalog");
    return saved ? JSON.parse(saved) : initialProductsCatalog;
  });

  const [moldsCatalog, setMoldsCatalog] = useState<CatalogMold[]>(() => {
    const saved = localStorage.getItem("4m1e1i_molds_catalog");
    return saved ? JSON.parse(saved) : initialMoldsCatalog;
  });

  // Global settings
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("4m1e1i_current_user");
    if (saved) {
      const u = JSON.parse(saved);
      if (u && u.department) {
        u.department = u.department.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
      }
      return u;
    }
    return null;
  });

  const [offlineMode, setOfflineMode] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<QualityReport | null>(null);

  const [mobileUIConfig, setMobileUIConfig] = useState(() => {
    const saved = localStorage.getItem("4m1e1i_mobile_ui_config");
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

  useEffect(() => {
    localStorage.setItem("4m1e1i_mobile_ui_config", JSON.stringify(mobileUIConfig));
    if (syncCompleted && dbConnected && !dbLoading) {
      saveDocument("config", "mobile_ui", mobileUIConfig).catch(console.error);
    }
  }, [mobileUIConfig, dbConnected, dbLoading, syncCompleted]);

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
  const [regCompany, setRegCompany] = useState("TPP-Group");
  const [regDepartment, setRegDepartment] = useState("");
  const [regBranch, setRegBranch] = useState("");
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
    if (companies && companies.length > 0) {
      const exists = companies.some((c) => c.id === regCompany);
      if (!exists) {
        setRegCompany(companies[0].id);
        const filteredB = branches.filter((b) => b.companyId === companies[0].id);
        const fb = filteredB.find(b => b.isScoring) || filteredB[0];
        setRegBranch(fb ? fb.name : "");
        setRegDepartment("");
      }
    }
  }, [companies, regCompany, branches]);

  useEffect(() => {
    const companyBranches = branches.filter((b) => b.companyId === regCompany);
    if (companyBranches.length > 0) {
      const hasCurrentBranch = companyBranches.some((b) => {
        const nameWithSuffix = b.name.includes("(") 
          ? b.name 
          : `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
        return b.name === regBranch || nameWithSuffix === regBranch;
      });
      if (!hasCurrentBranch) {
        const firstBranch = companyBranches.find(b => b.isScoring) || companyBranches[0];
        const nameWithSuffix = firstBranch.name.includes("(") 
          ? firstBranch.name 
          : `${firstBranch.name.replace(/\s*\([^)]+\)$/, "").trim()} (${firstBranch.companyId})`;
        setRegBranch(nameWithSuffix);
        setRegDepartment("");
      }
    } else {
      setRegBranch("");
      setRegDepartment("");
    }
  }, [regCompany, branches, regBranch]);

  useEffect(() => {
    const selectedB = branches.find((b) => {
      const nameWithSuffix = b.name.includes("(") 
        ? b.name 
        : `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
      return b.name === regBranch || nameWithSuffix === regBranch;
    });
    if (selectedB) {
      const branchDepts = departments.filter((d) => d.branchId === selectedB.id);
      if (branchDepts.length > 0) {
        const hasCurrentDept = branchDepts.some((d) => {
          const nameWithSuffix = d.name.includes(`(${selectedB.id})`)
            ? d.name
            : `${d.name.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
          return d.name === regDepartment || nameWithSuffix === regDepartment;
        });
        if (!hasCurrentDept) {
          const firstDept = branchDepts[0];
          const nameWithSuffix = firstDept.name.includes(`(${selectedB.id})`)
            ? firstDept.name
            : `${firstDept.name.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
          setRegDepartment(nameWithSuffix);
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
      setDbStatus("Chế độ Offline/Local (VITE_FIREBASE_CONF chưa được khai báo)");
      if (isManual) {
        showToast("Chế độ Offline/Local (Không dùng Firestore)", "info");
      }
      return;
    }
    try {
      setDbStatus(isManual ? "Đang tải dữ liệu mới từ Firestore..." : "Đang đồng bộ dữ liệu với Firestore...");
      // 1. Seed default data if users collection is empty
      await seedFirestoreIfNeeded();

      // 2. Load Firestore collections directly to ensure full synchronization and prevent deleted records from resurrecting
      const fUsers = await fetchCollection<User>(COLLECTIONS.USERS);
      if (fUsers.length > 0) {
        const cleanedFetched = fUsers.map((u) => {
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
          }
          
          return {
            ...u,
            password: userPwd,
            department: suffix ? `${deptName}${suffix}` : deptName
          };
        });
        setUsers(cleanedFetched);
      }

      const fReports = await fetchCollection<QualityReport>(COLLECTIONS.REPORTS);
      if (fReports.length > 0) {
        setReports(fReports);
      }

      const fCompanies = await fetchCollection<Company>(COLLECTIONS.COMPANIES);
      if (fCompanies.length > 0) {
        setCompanies(fCompanies);
      }

      const fBranches = await fetchCollection<Branch>(COLLECTIONS.BRANCHES);
      if (fBranches.length > 0) {
         setBranches(fBranches);
      }

      const fDepts = await fetchCollection<Department>(COLLECTIONS.DEPARTMENTS);
      if (fDepts.length > 0) {
        const latestBranches = fBranches.length > 0 ? fBranches : initialBranches;
        const cleanedFetched = fDepts.map((d) => {
          let cleanName = d.name || "";
          cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
          cleanName = cleanName.replace(/\s\([^)]+\)$/, "").trim();

          let suffix = "";
          const br = latestBranches.find((b) => b.id === d.branchId);
          if (br) {
            const match = br.name.match(/\(([^)]+)\)/);
            if (match) {
              suffix = ` (${match[1]})`;
            } else {
              const words = br.name.trim().split(/\s+/);
              const lastWord = words[words.length - 1];
              if (lastWord === lastWord.toUpperCase() && lastWord.length >= 2) {
                suffix = ` (${lastWord})`;
              }
            }
          } else {
            if (!d.branchId.startsWith("BRANCH-") && !d.branchId.startsWith("DEPT-") && d.branchId.length <= 10) {
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
        setDepartments(cleanedFetched);
      }

      const fBroadcasts = await fetchCollection<BroadcastNotice>(COLLECTIONS.BROADCASTS);
      if (fBroadcasts.length > 0) {
        setBroadcasts(fBroadcasts);
      }

      const fChats = await fetchCollection<ChatMessage>(COLLECTIONS.CHATS);
      if (fChats.length > 0) {
        setChats(fChats);
      }

      const fProdRequests = await fetchCollection<ProductionRequest>(COLLECTIONS.PRODUCTION_REQUESTS);
      if (fProdRequests.length > 0) {
        setProductionRequests(fProdRequests);
      }

      const fRequestItems = await fetchCollection<{ prId: string; items: any[] }>(COLLECTIONS.PRODUCTION_REQUEST_ITEMS);
      if (fRequestItems.length > 0) {
        const itemsMap: Record<string, any[]> = {};
        fRequestItems.forEach((x) => {
          if (x.prId) itemsMap[x.prId] = x.items || [];
        });
        setProductionRequestItemsMap(itemsMap);
      }

      const fOrderImpls = await fetchCollection<OrderImplementation>(COLLECTIONS.ORDER_IMPLEMENTATIONS);
      if (fOrderImpls.length > 0) {
         setOrderImplementations(fOrderImpls);
      }

      const fProducts = await fetchCollection<CatalogProduct>(COLLECTIONS.PRODUCTS_CATALOG);
      if (fProducts.length > 0) {
        setProductsCatalog(fProducts);
      }

      const fMolds = await fetchCollection<CatalogMold>(COLLECTIONS.MOLDS_CATALOG);
      if (fMolds.length > 0) {
        setMoldsCatalog(fMolds);
      }

      try {
        const fConfigs = await fetchCollection<any>("config");
        const remoteConfig = fConfigs.find((c) => c.id === "mobile_ui");
        if (remoteConfig) {
          const { id, ...cleanCfg } = remoteConfig;
          setMobileUIConfig((prev: any) => ({
            ...prev,
            ...cleanCfg
          }));
        }
      } catch (err) {
        console.error("Failed fetching remote config from cloud:", err);
      }

      setDbConnected(true);
      setSyncCompleted(true);
      setDbStatus("Đồng bộ liên kết với server thành công!");
      if (isManual) {
        showToast("Đã tải lại và đồng bộ dữ liệu mới nhất thành công!", "success");
      }
    } catch (error) {
      console.error("Firestore loading error:", error);
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

  // Save changes to localStorage on any state modification
  useEffect(() => {
    localStorage.setItem("4m1e1i_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_reports", JSON.stringify(reports));
    if (syncCompleted && dbConnected && !dbLoading) {
      reports.forEach((r) => saveDocument(COLLECTIONS.REPORTS, r.id, r));
    }
  }, [reports, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_companies", JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_branches", JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_departments", JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_broadcasts", JSON.stringify(broadcasts));
    if (syncCompleted && dbConnected && !dbLoading) {
      broadcasts.forEach((b) => saveDocument(COLLECTIONS.BROADCASTS, b.id, b));
    }
  }, [broadcasts, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_prod_requests", JSON.stringify(productionRequests));
    if (syncCompleted && dbConnected && !dbLoading) {
      productionRequests.forEach((pr) => saveDocument(COLLECTIONS.PRODUCTION_REQUESTS, pr.id, pr));
    }
  }, [productionRequests, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_prod_request_items", JSON.stringify(productionRequestItemsMap));
    if (syncCompleted && dbConnected && !dbLoading) {
      Object.entries(productionRequestItemsMap).forEach(([prId, items]) => {
        saveDocument(COLLECTIONS.PRODUCTION_REQUEST_ITEMS, prId, { prId, items });
      });
    }
  }, [productionRequestItemsMap, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_order_implementations", JSON.stringify(orderImplementations));
    if (syncCompleted && dbConnected && !dbLoading) {
      orderImplementations.forEach((oi) => saveDocument(COLLECTIONS.ORDER_IMPLEMENTATIONS, oi.id, oi));
    }
  }, [orderImplementations, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_products_catalog", JSON.stringify(productsCatalog));
    if (syncCompleted && dbConnected && !dbLoading) {
      productsCatalog.forEach((p) => saveDocument(COLLECTIONS.PRODUCTS_CATALOG, p.code, p));
    }
  }, [productsCatalog, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_molds_catalog", JSON.stringify(moldsCatalog));
    if (syncCompleted && dbConnected && !dbLoading) {
      moldsCatalog.forEach((m) => saveDocument(COLLECTIONS.MOLDS_CATALOG, m.code, m));
    }
  }, [moldsCatalog, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_chats", JSON.stringify(chats));
    if (syncCompleted && dbConnected && !dbLoading) {
      chats.forEach((c) => saveDocument(COLLECTIONS.CHATS, c.id, c));
    }
  }, [chats, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_offline_queue", JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_current_user", JSON.stringify(currentUser));
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
          match.branch !== currentUser.branch
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
              localStorage.setItem("4m1e1i_current_user", JSON.stringify(match));
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
      try {
        const now = Date.now();
        // Cập nhật local state ngay lập tức để người dùng xem chính xác trạng thái của mình
        setUsers((prev) =>
          prev.map((u) => (u.id === currentUser.id ? { ...u, lastActive: now } : u))
        );

        if (dbConnected && !dbLoading) {
          // Lưu trạng thái lastActive lên Firestore
          await saveDocument(COLLECTIONS.USERS, currentUser.id, {
            ...currentUser,
            lastActive: now
          });
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
  }, [currentUser?.id, dbConnected, dbLoading]);

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
            setUsers((prev) => {
              // Cập nhật lastActive từ server, nhưng bảo toàn các thông tin cục bộ chưa sync nếu có
              return prev.map((u) => {
                const fetched = latestUsers.find((lu) => lu.id === u.id);
                if (fetched) {
                  return {
                    ...u,
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

    const requestFullscreenOnInteraction = () => {
      const doc = document as any;
      const docEl = document.documentElement as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
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
    };

    const handleDblClick = () => {
      requestFullscreenOnInteraction();
    };

    const handleTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        if (e.cancelable) {
          e.preventDefault();
        }
        requestFullscreenOnInteraction();
      }
      lastTap = now;
    };

    // Auto trigger on first touch or click
    const handleFirstInteraction = () => {
      requestFullscreenOnInteraction();
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
    };

    if (isMobileDevice) {
      window.addEventListener("touchstart", handleFirstInteraction, { passive: true });
      window.addEventListener("click", handleFirstInteraction);
    }

    // Always support double click and double tap for toggling fullscreen
    window.addEventListener("dblclick", handleDblClick);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("dblclick", handleDblClick);
      window.removeEventListener("touchstart", handleTouchStart);
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
      fullName: regFullName.trim(),
      phone: cleanPhone,
      department: regDepartment,
      branch: regBranch,
      role: UserRole.STAFF, // employee default
      status: UserStatus.PENDING, // pending default
      password: regPassword,
      company: regCompanyVal
    };

    setUsers((prev) => [...prev, newUser]);
    
    if (dbConnected) {
      saveDocument(COLLECTIONS.USERS, newUser.id, newUser).catch(console.error);
    }

    // Keep user logged in under pending status, which displays Waiting landing screen with auto-polling
    setCurrentUser(newUser);
    setRegisterSuccessMsg("Đăng ký tài khoản thành công! Tài khoản của bạn đang chờ quản trị viên phê duyệt.");

    // Clear registration fields
    setRegFullName("");
    setRegId("");
    setRegPhone("");
    setRegPassword("");
    setRegConfirmPassword("");
  };

  // Admin controls
  const handleUpdateStatus = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const handleUpdateRole = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.USERS, id);
    }
  };

  const handleAddUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    if (dbConnected) {
      saveDocument(COLLECTIONS.USERS, updatedUser.id, updatedUser).catch(console.error);
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

  const getBranchCodeSuffix = (brName: string) => {
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
    if (d.branchId.startsWith("BRANCH-") || d.branchId.startsWith("DEPT-")) {
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
    if (updated.branchId.startsWith("BRANCH-") || updated.branchId.startsWith("DEPT-")) {
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
  };

  // Forum message
  const handleAddChatMessage = (msg: string, reportRefId?: string) => {
    if (!currentUser) return;
    const newChat: ChatMessage = {
      id: `CHAT-${Date.now()}`,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      senderPhone: currentUser.phone,
      message: msg,
      timestamp: new Date().toLocaleString("vi-VN"),
      ...(reportRefId ? { reportRefId } : {})
    };
    setChats((prev) => [...prev, newChat]);
  };

  // Report Submission Handler
  const handleSubmitReport = (payload: Omit<QualityReport, "id" | "googleDrivePath">) => {
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

        setReports((prev) =>
          prev.map((r) => (r.id === editingReport.id ? updatedReport : r))
        );

        if (syncCompleted && dbConnected && !dbLoading) {
          saveDocument(COLLECTIONS.REPORTS, editingReport.id, updatedReport).catch((err) => {
            console.error("Lỗi khi tải báo cáo cập nhật lên Firestore:", err);
          });
        }

        showToast("Đã cập nhật tệp tin biến động chất lượng thành công!", "success");
      } else {
        // New report flow
        const newId = `R-${Date.now()}`;
        const newReport: QualityReport = {
          ...payload,
          id: newId,
          googleDrivePath: `My Drive > 4M1E1I Reports > AutoSync > ${payload.timestamp.replace(/[:\/]/g, "")}.pdf`
        };
        setReports((prev) => [newReport, ...prev]);

        if (syncCompleted && dbConnected && !dbLoading) {
          saveDocument(COLLECTIONS.REPORTS, newId, newReport).catch((err) => {
            console.error("Lỗi khi tải báo cáo mới lên Firestore:", err);
          });
        }
        
        // Auto alert sound simulator if abnormal
        if (payload.isAbnormal) {
          showToast(`CẢNH BÁO BẤT THƯỜNG: Nhân viên ${payload.uploaderName} vừa phát hiện báo cáo tại ${payload.factory}. Hệ thống đã gửi thông báo khẩn cho Admin!`, "warning");
        } else {
          showToast("Đã gửi báo cáo chất lượng 4M1E1I lên máy chủ thành công!", "success");
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
      if (confirm("Kiểm soát chất lượng: Bạn có thật sự muốn XÓA VĨNH VIỄN bản báo cáo này? Thao tác này KHÔNG THỂ KHÔI PHỤC!")) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (dbConnected) {
          deleteDocument(COLLECTIONS.REPORTS, id);
        }
      }
    } else {
      if (confirm("Kiểm soát chất lượng: Bạn có chắc chắn muốn chuyển bản báo cáo này vào Thùng rác?")) {
        setReports((prev) => prev.map((r) => {
          if (r.id !== id) return r;
          return {
            ...r,
            isDeleted: true,
            deletedAt: new Date().toISOString()
          };
        }));
      }
    }
  };

  // Update report handler for likes, shares, or directives
  const handleUpdateReport = (updatedReport: QualityReport) => {
    setReports((prev) => prev.map((r) => {
      if (r.id !== updatedReport.id) return r;

      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mns = String(now.getMinutes()).padStart(2, '0');
      const scs = String(now.getSeconds()).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const updateTimeStr = `${hrs}:${mns}:${scs} ${date}/${month}/${year}`;

      const logs = r.updateLogs ? [...r.updateLogs] : [];
      const changes: string[] = [];

      const oldLikes = r.likedBy || [];
      const newLikes = updatedReport.likedBy || [];
      if (newLikes.length > oldLikes.length) {
        const addedLike = newLikes.find(l => !oldLikes.includes(l)) || "Kiểm soát viên";
        changes.push(`Lượt thích mới (${addedLike})`);
      }

      const oldShares = r.sharedBy || [];
      const newShares = updatedReport.sharedBy || [];
      if (newShares.length > oldShares.length) {
        const addedShare = newShares.find(s => !oldShares.includes(s)) || "Kiểm soát viên";
        changes.push(`Chia sẻ mới (${addedShare})`);
      }

      const oldDirs = r.directives || [];
      const newDirs = updatedReport.directives || [];
      if (newDirs.length > oldDirs.length) {
        const addedDir = newDirs[newDirs.length - 1];
        changes.push(`Chỉ đạo mới (${addedDir.author}: "${addedDir.text.substring(0, 15)}...")`);
      }

      if (changes.length > 0) {
        const logMsg = `${changes.join(", ")} (${updateTimeStr})`;
        logs.push(logMsg);
        return {
          ...updatedReport,
          updatedAt: updateTimeStr,
          updateLogs: logs
        };
      }

      return updatedReport;
    }));
  };

  // Render Authentication Section (Login / registration cards)
  if (!currentUser) {
    const isRegIdValid = /^\d{4}\.\d{5}$/.test(regId);
    const isRegPhoneValid = regPhone.replace(/\s+/g, "").length === 10 && regPhone.replace(/\s+/g, "").startsWith("0");
    const isLoginPhoneValid = loginPhone.replace(/\s+/g, "").length === 10 && loginPhone.replace(/\s+/g, "").startsWith("0");

    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 relative font-sans overflow-y-auto selection:bg-blue-600 selection:text-white">
        {/* Soft elegant backdrops */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 bg-opacity-10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-400 bg-opacity-10 rounded-full blur-[160px] pointer-events-none" />

        {/* Action card enclosing everything (branding logo + login/register switcher + forms) */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-xl relative z-10 animate-scale-in text-slate-800">
          
          {/* Corporate branding header: Logo 4M1E1I as requested */}
          <div className="flex flex-col items-center mb-6 select-none text-center animate-fade-in">
            <div className="px-10 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[18px] flex items-center justify-center shadow-lg border border-blue-400/20 mb-3.5 transform transition hover:scale-105 duration-200">
              <span translate="no" className="notranslate font-sans font-black text-2xl tracking-wider text-white leading-none">
                4M1E1I
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold tracking-normal mt-1 uppercase">
              <T>HỆ THỐNG KIỂM SOÁT NGUỒN LỰC SX-KD</T>
            </p>
          </div>
          
          {/* Beautiful sliding tab switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 select-none border border-slate-200">
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
            <form onSubmit={handleRegister} className="space-y-4">
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
                  <T>MÃ NHÂN SỰ</T>
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
                    placeholder="Ví dụ: 0907 767 304"
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
                    placeholder="Tạo mật khẩu đăng nhập..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <T>XÁC NHẬN MẬT KHẨU</T>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu để xác nhận..."
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
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
                    <span>{companies.find((c) => c.id === regCompany)?.name || regCompany}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {isOpenRegCompany && (
                    <>
                      <div className="fixed inset-0 z-45" onClick={() => setIsOpenRegCompany(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-[220px] overflow-y-auto">
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
                              regCompany === c.id ? "bg-blue-50/70 text-blue-800 font-bold" : "text-slate-800"
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
                    <span className={regBranch ? "text-slate-800 font-semibold" : "text-slate-400 font-semibold"}>
                      {regBranch || "--- Chọn Chi nhánh/ Văn Phòng đại diện ---"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-emerald-600" />
                  </button>

                  {isOpenRegBranch && (
                    <>
                      <div className="fixed inset-0 z-35" onClick={() => setIsOpenRegBranch(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-[220px] overflow-y-auto">
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
                          const filteredBranches = branches.filter((b) => b.companyId === regCompany);
                          return filteredBranches.map((b) => {
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
                                  setRegDepartment("");
                                  setIsOpenRegBranch(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  isSelected ? "bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500 pl-3.5" : "text-slate-850"
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
                    <span className={regDepartment ? "text-slate-800 font-semibold" : "text-slate-400 font-semibold"}>
                      {regDepartment || "--- Chọn Bộ phận/ Đơn vị làm việc ---"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-emerald-600" />
                  </button>

                  {isOpenRegDept && (
                    <>
                      <div className="fixed inset-0 z-25" onClick={() => setIsOpenRegDept(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-[220px] overflow-y-auto">
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
                                  isSelected ? "bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500 pl-3.5" : "text-slate-850"
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

              <button
                type="submit"
                disabled={!isRegIdValid || !isRegPhoneValid || !regBranch || !regDepartment || !regFullName.trim() || !regPassword.trim() || regPassword !== regConfirmPassword}
                className={`w-full py-3.5 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  (!isRegIdValid || !isRegPhoneValid || !regBranch || !regDepartment || !regFullName.trim() || !regPassword.trim() || regPassword !== regConfirmPassword)
                    ? "bg-slate-350 cursor-not-allowed opacity-50 select-none shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                }`}
              >
                <T>Đăng Ký Tài Khoản</T>
              </button>
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
            <T>HỆ THỐNG KIỂM SOÁT NGUỒN LỰC SX-KD</T>
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
              localStorage.removeItem("4m1e1i_current_user");
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

  // Active user view workspace (Integrates Admin Panel and Client Phone Simulator side-by-side)
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col relative overflow-hidden font-sans">
      {/* Upper header line with simulated offline trigger */}
      <div className="bg-[#1E293B] px-6 py-2 border-b border-slate-700 flex justify-between items-center select-none text-[10px] text-slate-300 shrink-0 select-none">
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
        <div className="flex-1 min-w-0 flex flex-col">
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
          />
        </div>

        {/* Floating/Docked elegant iPhone mockup frame on the right side if active */}
        {showMobilePreview && (
          <div className="hidden lg:flex w-[420px] bg-[#F7F9FC] border-l border-slate-200 p-6 flex-col items-center shrink-0 overflow-y-auto select-none shadow-inner">
            <div className="w-full flex items-center justify-between mb-4 header-mobile-controls">
              <T className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">
                📱 Xem trước giao diện di động (Mobile Preview)
              </T>
            </div>

            {isFormOpen ? (
              <ReportForm
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
              />
            ) : (
              <MobileFrame
                reports={reports}
                currentUserId={currentUser.id}
                onOpenReportForm={() => setIsFormOpen(true)}
                onDeleteReport={handleDeleteReportTrigger}
                onEditReport={handleEditReportTrigger}
                offlineMode={offlineMode}
                currentUser={currentUser}
                onUpdateReport={handleUpdateReport}
                mobileUIConfig={mobileUIConfig}
                onUpdateMobileUIConfig={setMobileUIConfig}
                onLogout={() => setCurrentUser(null)}
                branches={branches}
                onManualRefresh={syncFromDb}
                users={users}
                companies={companies}
                onSwitchToDesktop={() => setShowMobilePreview(false)}
                chats={chats}
                onAddChatMessage={handleAddChatMessage}
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
              />
            ) : (
              <MobileFrame
                reports={reports}
                currentUserId={currentUser.id}
                onOpenReportForm={() => setIsFormOpen(true)}
                onDeleteReport={handleDeleteReportTrigger}
                onEditReport={handleEditReportTrigger}
                offlineMode={offlineMode}
                currentUser={currentUser}
                onUpdateReport={handleUpdateReport}
                mobileUIConfig={mobileUIConfig}
                onUpdateMobileUIConfig={setMobileUIConfig}
                onLogout={() => setCurrentUser(null)}
                branches={branches}
                onManualRefresh={syncFromDb}
                users={users}
                companies={companies}
                onSwitchToDesktop={() => setShowMobilePreview(false)}
                chats={chats}
                onAddChatMessage={handleAddChatMessage}
              />
            )}
          </div>
        </div>
      )}

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
