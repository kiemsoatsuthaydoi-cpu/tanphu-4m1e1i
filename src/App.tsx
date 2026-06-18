import React, { useState, useEffect } from "react";
import { AlertCircle, LogIn, Heart, ShieldCheck, Wifi, WifiOff, RefreshCw, Smartphone, Monitor } from "lucide-react";
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

export default function App() {
  // Firebase configurations & connection indicators
  const [dbLoading, setDbLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState("Đang kết nối Firestore...");
  const [dbConnected, setDbConnected] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);

  // Persistence state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("4m1e1i_users");
    const loadedUsers = saved ? JSON.parse(saved) : initialUsers;
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
      
      if (suffix && deptName) {
        const cleanDeptName = deptName.replace(/\s\([A-Z0-9-]+\)$/, "").trim();
        const standardizedClean = cleanDeptName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");
        return {
          ...u,
          department: `${standardizedClean}${suffix}`
        };
      }
      return {
        ...u,
        department: deptName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng")
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
    return saved ? JSON.parse(saved) : initialCompanies;
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem("4m1e1i_branches");
    if (saved) {
      const parsed = JSON.parse(saved).map((b: any) => ({
        ...b,
        name: b.name
          .replace(" (CNBN)", "")
          .replace(" (CNLA)", "")
          .replace(" (NM314)", ""),
        isScoring: b.id === "TPP-CTY" ? true : b.isScoring
      }));
      if (parsed.length >= 4 && parsed.some((b: any) => b.id === "TPP-314")) {
        return parsed;
      }
    }
    return initialBranches;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem("4m1e1i_departments");
    if (saved) {
      const parsed = JSON.parse(saved);
      const formatted = parsed.map((d: any) => {
        let cleanName = d.name || "";
        cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý");
        cleanName = cleanName.replace(/quản\s+lí/gi, "Quản Lý");
        cleanName = cleanName.replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng");
        cleanName = cleanName.replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

        const suffix = ` (${d.branchId})`;
        if (cleanName.endsWith(suffix)) {
          cleanName = cleanName.substring(0, cleanName.length - suffix.length);
        }
        cleanName = cleanName.replace(/\s\([A-Z0-9-]+\)$/, "").trim();
        return {
          ...d,
          name: `${cleanName}${suffix}`
        };
      });
      if (formatted.length >= 10 && formatted.some((d: any) => d.branchId === "TPP-314")) {
        return formatted;
      }
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
  const [regDepartment, setRegDepartment] = useState(STANDARDIZED_QC_DEPT);
  const [regBranch, setRegBranch] = useState("Chi Nhánh Bắc Ninh (TPP-BNI)");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.STAFF);
  const [regPassword, setRegPassword] = useState("");

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

  // Synchronize with Firestore upon startup
  useEffect(() => {
    async function syncFromDb() {
      if (!db) {
        setDbLoading(false);
        setDbStatus("Chế độ Offline/Local (VITE_FIREBASE_CONF chưa được khai báo)");
        return;
      }
      try {
        setDbStatus("Đang đồng bộ dữ liệu với Firestore...");
        // 1. Seed default data if users collection is empty
        await seedFirestoreIfNeeded();

        // 2. Load and SMART MERGE collections to prevent data loss or staleness
        const fUsers = await fetchCollection<User>(COLLECTIONS.USERS);
        if (fUsers.length > 0) {
          setUsers((prev) => {
            const merged = [...fUsers];
            prev.forEach((u) => {
              if (!merged.some((mu) => mu.id === u.id)) {
                merged.push(u);
              }
            });
            return merged;
          });
        }

        const fReports = await fetchCollection<QualityReport>(COLLECTIONS.REPORTS);
        if (fReports.length > 0) {
          setReports((prev) => {
            const merged = [...fReports];
            prev.forEach((r) => {
              if (!merged.some((mr) => mr.id === r.id)) {
                merged.push(r);
              }
            });
            return merged;
          });
        }

        const fCompanies = await fetchCollection<Company>(COLLECTIONS.COMPANIES);
        if (fCompanies.length > 0) {
          setCompanies((prev) => {
            const merged = [...fCompanies];
            prev.forEach((c) => {
              if (!merged.some((mc) => mc.id === c.id)) {
                merged.push(c);
              }
            });
            return merged;
          });
        }

        const fBranches = await fetchCollection<Branch>(COLLECTIONS.BRANCHES);
        if (fBranches.length > 0) {
          setBranches((prev) => {
            const merged = [...fBranches];
            prev.forEach((b) => {
              if (!merged.some((mb) => mb.id === b.id)) {
                merged.push(b);
              }
            });
            return merged;
          });
        }

        const fDepts = await fetchCollection<Department>(COLLECTIONS.DEPARTMENTS);
        if (fDepts.length > 0) {
          setDepartments((prev) => {
            const merged = [...fDepts];
            prev.forEach((d) => {
              if (!merged.some((md) => md.id === d.id)) {
                merged.push(d);
              }
            });
            return merged;
          });
        }

        const fBroadcasts = await fetchCollection<BroadcastNotice>(COLLECTIONS.BROADCASTS);
        if (fBroadcasts.length > 0) {
          setBroadcasts((prev) => {
            const merged = [...fBroadcasts];
            prev.forEach((b) => {
              if (!merged.some((mb) => mb.id === b.id)) {
                merged.push(b);
              }
            });
            return merged;
          });
        }

        const fChats = await fetchCollection<ChatMessage>(COLLECTIONS.CHATS);
        if (fChats.length > 0) {
          setChats((prev) => {
            const merged = [...fChats];
            prev.forEach((c) => {
              if (!merged.some((mc) => mc.id === c.id)) {
                merged.push(c);
              }
            });
            return merged;
          });
        }

        const fProdRequests = await fetchCollection<ProductionRequest>(COLLECTIONS.PRODUCTION_REQUESTS);
        if (fProdRequests.length > 0) {
          setProductionRequests((prev) => {
            const merged = [...fProdRequests];
            prev.forEach((pr) => {
              if (!merged.some((mpr) => mpr.id === pr.id)) {
                merged.push(pr);
              }
            });
            return merged;
          });
        }

        const fRequestItems = await fetchCollection<{ prId: string; items: any[] }>(COLLECTIONS.PRODUCTION_REQUEST_ITEMS);
        if (fRequestItems.length > 0) {
          const itemsMap: Record<string, any[]> = {};
          fRequestItems.forEach((x) => {
            if (x.prId) itemsMap[x.prId] = x.items || [];
          });
          setProductionRequestItemsMap((prev) => {
            return {
              ...prev,
              ...itemsMap
            };
          });
        }

        const fOrderImpls = await fetchCollection<OrderImplementation>(COLLECTIONS.ORDER_IMPLEMENTATIONS);
        if (fOrderImpls.length > 0) {
          setOrderImplementations((prev) => {
            const merged = [...fOrderImpls];
            prev.forEach((oi) => {
              if (!merged.some((moi) => moi.id === oi.id)) {
                merged.push(oi);
              }
            });
            return merged;
          });
        }

        const fProducts = await fetchCollection<CatalogProduct>(COLLECTIONS.PRODUCTS_CATALOG);
        if (fProducts.length > 0) {
          setProductsCatalog((prev) => {
            const merged = [...fProducts];
            prev.forEach((p) => {
              if (!merged.some((mp) => mp.code === p.code)) {
                merged.push(p);
              }
            });
            return merged;
          });
        }

        const fMolds = await fetchCollection<CatalogMold>(COLLECTIONS.MOLDS_CATALOG);
        if (fMolds.length > 0) {
          setMoldsCatalog((prev) => {
            const merged = [...fMolds];
            prev.forEach((m) => {
              if (!merged.some((mm) => mm.code === m.code)) {
                merged.push(m);
              }
            });
            return merged;
          });
        }

        setDbConnected(true);
        setSyncCompleted(true);
        setDbStatus("Đồng bộ liên kết với server thành công!");
      } catch (error) {
        console.error("Firestore loading error:", error);
        setDbStatus("Đồng bộ thất bại, chuyển chế độ ngoại tuyến");
      } finally {
        setDbLoading(false);
      }
    }
    syncFromDb();
  }, []);

  // Save changes to localStorage on any state modification + back up to Firestore
  useEffect(() => {
    localStorage.setItem("4m1e1i_users", JSON.stringify(users));
    if (syncCompleted && dbConnected && !dbLoading) {
      users.forEach((u) => saveDocument(COLLECTIONS.USERS, u.id, u));
    }
  }, [users, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_reports", JSON.stringify(reports));
    if (syncCompleted && dbConnected && !dbLoading) {
      reports.forEach((r) => saveDocument(COLLECTIONS.REPORTS, r.id, r));
    }
  }, [reports, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_companies", JSON.stringify(companies));
    if (syncCompleted && dbConnected && !dbLoading) {
      companies.forEach((c) => saveDocument(COLLECTIONS.COMPANIES, c.id, c));
    }
  }, [companies, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_branches", JSON.stringify(branches));
    if (syncCompleted && dbConnected && !dbLoading) {
      branches.forEach((b) => saveDocument(COLLECTIONS.BRANCHES, b.id, b));
    }
  }, [branches, dbConnected, dbLoading, syncCompleted]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_departments", JSON.stringify(departments));
    if (syncCompleted && dbConnected && !dbLoading) {
      departments.forEach((d) => saveDocument(COLLECTIONS.DEPARTMENTS, d.id, d));
    }
  }, [departments, dbConnected, dbLoading, syncCompleted]);

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

  // Synchronize registration form branch and department choices dynamically
  useEffect(() => {
    if (branches.length > 0) {
      const defaultB = branches.find(b => b.name === regBranch) || branches.find(b => b.id === "TPP-BNI") || branches[0];
      if (regBranch !== defaultB.name) {
        setRegBranch(defaultB.name);
      }
    }
  }, [branches]);

  useEffect(() => {
    if (regBranch) {
      const selectedB = branches.find(b => b.name === regBranch);
      if (selectedB) {
        const branchDepts = departments.filter(d => d.branchId === selectedB.id);
        if (branchDepts.length > 0) {
          const hasCurrent = branchDepts.some(d => d.name === regDepartment);
          if (!hasCurrent) {
            setRegDepartment(branchDepts[0].name);
          }
        } else {
          setRegDepartment("");
        }
      }
    }
  }, [regBranch, branches, departments, regDepartment]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_offline_queue", JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem("4m1e1i_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

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
      alert("✅ Khôi phục kết nối mạng thành công! Toàn bộ tệp hàng đợi offline đã được đồng bộ đồng nhất lên máy chủ.");
    }
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setRegisterSuccessMsg("");

    // Validate inputs
    if (!loginId || !loginPhone || !loginPassword) {
      setAuthError("Vui lòng điền đầy đủ Mã nhân sự, Điện thoại và Mật khẩu.");
      return;
    }

    // Lookup user
    const found = users.find(
      (u) =>
        u.id.trim() === loginId.trim() &&
        u.phone.replace(/\s+/g, "") === loginPhone.replace(/\s+/g, "") &&
        u.password === loginPassword
    );

    if (!found) {
      setAuthError("Thông tin đăng nhập không chính xác. Quý khách vui lòng kiểm tra lại dữ liệu.");
      return;
    }

    if (found.status === UserStatus.PENDING) {
      setAuthError("Tài khoản của bạn đang chờ phê duyệt. Vui lòng liên hệ Admin Lê Nhật Trường (0907767304) để được kích hoạt.");
      return;
    }

    if (found.status === UserStatus.LOCKED) {
      setAuthError("Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Bộ phận CNTT để mở lại.");
      return;
    }

    // Logged in successfully
    setCurrentUser(found);
  };

  // Sign up handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setRegisterSuccessMsg("");

    if (!regFullName.trim() || !regId.trim() || !regPhone.trim() || !regPassword.trim()) {
      setAuthError("Tất cả các trường đánh dấu (*) đều bắt buộc hoàn thiện.");
      return;
    }

    // Verify personnel ID formatting e.g., 2018.00281 (4 digits, dot, 5 digits)
    const idRegex = /^\d{4}\.\d{5}$/;
    if (!idRegex.test(regId.trim())) {
      setAuthError("Định dạng Mã nhân sự sai quy chuẩn. Định dạng mẫu đúng: YYYY.XXXXX (ví dụ: 2018.00281)");
      return;
    }

    // Verify phone digit count
    const cleanPhone = regPhone.replace(/\s+/g, "");
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith("0")) {
      setAuthError("Vui lòng nhập đúng SĐT cá nhân gồm 10 chữ số (bắt đầu bằng số 0)");
      return;
    }

    // Check pre-existing indices
    const preExistingId = users.find((u) => u.id === regId);
    if (preExistingId) {
      setAuthError("Mã nhân sự này đã tồn tại trên hệ thống!");
      return;
    }

    const preExistingPhone = users.find((u) => u.phone.replace(/\s+/g, "") === cleanPhone);
    if (preExistingPhone) {
      setAuthError("Số điện thoại này đã tồn tại trên hệ thống!");
      return;
    }

    // Register user with PENDING state
    const newUser: User = {
      id: regId.trim(),
      fullName: regFullName.trim(),
      phone: cleanPhone,
      department: regDepartment,
      branch: regBranch,
      role: regRole,
      status: UserStatus.PENDING,
      password: regPassword
    };

    setUsers((prev) => [...prev, newUser]);
    setRegisterSuccessMsg("ĐĂNG KÝ THÀNH CÔNG! Tài khoản hiện đang ở trạng thái chờ phê duyệt. Vui lòng đợi quản trị viên duyệt trước khi có thể đăng nhập.");
    
    // Clear registration fields
    setRegFullName("");
    setRegId("");
    setRegPhone("");
    setRegPassword("");
    setAuthScreen("LOGIN");
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

  // Code list lookup managers
  const handleAddCompany = (c: Company) => {
    setCompanies((prev) => [...prev, c]);
  };

  const handleAddBranch = (b: Branch) => {
    setBranches((prev) => [...prev, b]);
  };

  const handleAddDepartment = (d: Department) => {
    let cleanName = d.name.trim();
    // Auto-correct spelling issues:
    cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý");
    cleanName = cleanName.replace(/quản\s+lí/gi, "Quản Lý");
    cleanName = cleanName.replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng");
    cleanName = cleanName.replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

    const suffix = ` (${d.branchId})`;
    if (!cleanName.endsWith(suffix)) {
      cleanName = cleanName.replace(/\s\([A-Z0-9-]+\)$/, "").trim();
    } else {
      cleanName = cleanName.substring(0, cleanName.length - suffix.length).trim();
    }
    
    // Reinforce spelling check
    cleanName = cleanName.replace(/Quản\s+lí/gi, "Quản Lý").replace(/quản\s+lí/gi, "Quản Lý").replace(/Lí\s+Chất\s+Lượng/gi, "Lý Chất Lượng").replace(/lí\s+chất\s+lượng/gi, "Lý Chất Lượng");

    d = {
      ...d,
      name: `${cleanName}${suffix}`
    };
    setDepartments((prev) => [...prev, d]);
  };

  const handleDeleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.BRANCHES, id);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (dbConnected) {
      deleteDocument(COLLECTIONS.DEPARTMENTS, id);
    }
  };

  // Broadcaster Notice
  const handleAddBroadcast = (notice: string, type: string) => {
    const newNotice: BroadcastNotice = {
      id: `NOTICE-${Date.now()}`,
      type,
      content: notice,
      sender: currentUser?.fullName || "Hệ thống",
      timestamp: new Date().toLocaleDateString("vi-VN")
    };
    setBroadcasts((prev) => [newNotice, ...prev]);
  };

  // Forum message
  const handleAddChatMessage = (msg: string) => {
    if (!currentUser) return;
    const newChat: ChatMessage = {
      id: `CHAT-${Date.now()}`,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      senderPhone: currentUser.phone,
      message: msg,
      timestamp: new Date().toLocaleString("vi-VN")
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
      alert("⚠️ Đang ngắt mạng. Đã lưu báo cáo cục bộ vào hàng chờ offline thành công!");
    } else {
      if (editingReport) {
        // Edit flow
        setReports((prev) =>
          prev.map((r) => (r.id === editingReport.id ? { ...r, ...payload } : r))
        );
        alert("✅ Đã cập nhật tệp tin biến động chất lượng thành công!");
      } else {
        // New report flow
        const newReport: QualityReport = {
          ...payload,
          id: `R-${Date.now()}`,
          googleDrivePath: `My Drive > 4M1E1I Reports > AutoSync > ${payload.timestamp.replace(/[:\/]/g, "")}.pdf`
        };
        setReports((prev) => [newReport, ...prev]);
        
        // Auto alert sound simulator if abnormal
        if (payload.isAbnormal) {
          alert(`🚨 CẢNH BÁO BẤT THƯỜNG: Nhân viên ${payload.uploaderName} vừa phát hiện và đẩy báo cáo bất thường tại ${payload.factory}. Hệ thống đã gửi thông báo khẩn cho Admin!`);
        } else {
          alert("✅ Đã gửi báo cáo chất lượng 4M1E1I lên máy chủ thành công!");
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
  const handleDeleteReportTrigger = (id: string) => {
    if (confirm("Kiểm soát chất lượng: Bạn có thật sự muốn xóa hoàn toàn bản báo cáo này?")) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (dbConnected) {
        deleteDocument(COLLECTIONS.REPORTS, id);
      }
    }
  };

  // Render Authentication Section (Login / registration cards)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 relative font-sans overflow-y-auto selection:bg-blue-600 selection:text-white">
        {/* Soft elegant backdrops */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 rounded-full blur-[160px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-400 rounded-full blur-[160px] opacity-10 pointer-events-none" />

        {/* Corporate branding header */}
        <div className="text-center mb-8 select-none z-10 animate-fade-in">
          {/* Logo 4M1E1I above registration and login forms */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-serif font-black text-4xl px-8 py-3.5 rounded-2xl shadow-md inline-block tracking-widest border border-blue-500 border-opacity-25">
            <T>4M1E1I</T>
          </div>
          <h1 className="text-2xl font-bold text-slate-850 tracking-wide mt-4 uppercase">
            <T>CÔNG TY CỔ PHẦN TÂN PHÚ VIỆT NAM</T>
          </h1>
          <T className="text-xs text-slate-500 mt-1 block uppercase font-mono tracking-widest">
            HỆ THỐNG TRỰC QUAN HÓA QUẢN LÝ BIẾN ĐỘNG CHẤT LƯỢNG SẢN XUẤT
          </T>
        </div>

        {/* Action card */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-lg relative z-10 animate-scale-in text-slate-800">
          {/* Status feedback */}
          {authError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-650" />
              <span translate="no" className="notranslate font-semibold block">{authError}</span>
            </div>
          )}

          {registerSuccessMsg && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-650" />
              <span translate="no" className="notranslate font-semibold block">{registerSuccessMsg}</span>
            </div>
          )}

          {authScreen === "LOGIN" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="border-b border-slate-100 pb-3 text-center">
                <T className="text-lg font-bold text-slate-850 block uppercase">ĐĂNG NHẬP HỆ THỐNG</T>
                <T className="text-[10px] text-slate-450 block font-bold tracking-widest mt-0.5 uppercase">
                  NHÂN SỰ VÀ TRƯỞNG BP QUAN SÁT
                </T>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1.5">
                  <span translate="no" className="notranslate">MÃ NHÂN SỰ (MẬT KHẨU HÀNH CHÍNH)*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 2026.00001"
                  value={loginId}
                  onChange={(e) => setLoginId(formatEmployeeId(e.target.value, loginId))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono tracking-wide shadow-sm"
                />
                {loginId.length > 0 && !isLoginIdValid && (
                  <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1.5 font-semibold">
                    Mã nhân sự phải đúng định dạng YYYY.XXXXX (10 ký tự)
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1.5">
                  <span translate="no" className="notranslate">SỐ ĐIỆN THOẠI ĐÃ DUYỆT*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0907 767 304"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(formatPhoneNumber(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1.5">
                  <T>Mật khẩu an toàn*</T>
                </label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <T>ĐĂNG NHẬP</T>
              </button>

              <div className="pt-4 border-t border-slate-100 text-center select-none">
                <T className="text-[11px] text-slate-500 font-medium">Chưa có tài khoản trên hệ thống? </T>
                <button
                  type="button"
                  onClick={() => {
                    setAuthScreen("REGISTER");
                    setAuthError("");
                    setRegisterSuccessMsg("");
                  }}
                  className="text-blue-600 hover:text-blue-550 text-[11px] font-bold cursor-pointer"
                >
                  <T>ĐĂNG KÝ NGAY</T>
                </button>
              </div>


            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 text-center">
                <T className="text-lg font-bold text-slate-850 block uppercase">ĐĂNG KÝ TÀI KHOẢN MỚI</T>
                <T className="text-[10px] text-slate-450 block font-bold tracking-widest mt-0.5 uppercase">
                  BIỂU MẪU GHI NHẬN THÔNG TIN
                </T>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  <T>Họ tên nhân viên*</T>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bùi Thanh Dung"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-850 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <span translate="no" className="notranslate">MÃ NHÂN SỰ (ĐỊNH DẠNG YYYY.XXXXX)*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 2026.00001"
                  value={regId}
                  onChange={(e) => setRegId(formatEmployeeId(e.target.value, regId))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-mono shadow-sm"
                />
                {regId.length > 0 && !isRegIdValid && (
                  <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1.5 font-semibold">
                    Mã nhân sự phải đúng định dạng YYYY.XXXXX (10 ký tự)
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">
                  <span translate="no" className="notranslate">SỐ ĐIỆN THOẠI*</span>
                </label>
                <div className="mb-1.5">
                  <span translate="no" className="notranslate text-blue-600 text-[9px] italic block leading-snug">
                    * Lưu ý: Vui lòng nhập chính xác SĐT của anh/chị để Trưởng Bộ Phận nhận diện phê duyệt.
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: 0907 767 304"
                  value={regPhone}
                  onChange={(e) => setRegPhone(formatPhoneNumber(e.target.value))}
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs text-slate-850 font-mono shadow-sm focus:outline-none transition-colors ${
                    regPhone.length > 0 && !isRegPhoneValid
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  }`}
                />
                {regPhone.length > 0 && !isRegPhoneValid && (
                  <span translate="no" className="notranslate text-red-500 text-[10px] block mt-1.5 font-semibold">
                    Vui lòng nhập đúng SĐT cá nhân gồm 10 chữ số (bắt đầu bằng số 0)
                  </span>
                )}
              </div>

              <div className="select-none">
                <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  <T>Chi nhánh hoạt động chính*</T>
                </label>
                <select
                  value={regBranch}
                  onChange={(e) => setRegBranch(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-850 focus:outline-none shadow-sm"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="select-none">
                <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  <T>Bộ phận công tác*</T>
                </label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-850 focus:outline-none shadow-sm"
                >
                  {(() => {
                    const selectedB = branches.find((b) => b.name === regBranch);
                    const filteredDepts = selectedB
                      ? departments.filter((d) => d.branchId === selectedB.id)
                      : [];
                    if (filteredDepts.length === 0) {
                      return <option value="">Chưa có bộ phận</option>;
                    }
                    return filteredDepts.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 select-none">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                    <T>Phân quyền đề xuất*</T>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-850 shadow-sm"
                  >
                    <option value={UserRole.STAFF}>{UserRole.STAFF}</option>
                    <option value={UserRole.REVIEWER}>{UserRole.REVIEWER}</option>
                    <option value={UserRole.ADMIN}>{UserRole.ADMIN}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                    <T>Mật khẩu*</T>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-850 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isRegIdValid || !isRegPhoneValid}
                className={`w-full py-3 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer ${
                  (!isRegIdValid || !isRegPhoneValid)
                    ? "bg-slate-350 cursor-not-allowed opacity-50 select-none"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <T>ĐĂNG KÝ THÔNG TIN</T>
              </button>

              <div className="pt-3 border-t border-slate-100 text-center select-none">
                <button
                  type="button"
                  onClick={() => {
                    setAuthScreen("LOGIN");
                    setAuthError("");
                    setRegisterSuccessMsg("");
                  }}
                  className="text-slate-500 hover:text-slate-850 text-[11px] font-bold cursor-pointer"
                >
                  <T>← QUAY LẠI ĐĂNG NHẬP</T>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

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
            onAddBranch={handleAddBranch}
            onAddDepartment={handleAddDepartment}
            onDeleteCompany={() => {}} // No delete on companies
            onDeleteBranch={handleDeleteBranch}
            onDeleteDepartment={handleDeleteDepartment}
            onAddBroadcast={handleAddBroadcast}
            onAddChatMessage={handleAddChatMessage}
            onLogout={() => setCurrentUser(null)}
            onToggleMobilePreview={() => setShowMobilePreview((prev) => !prev)}

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
          />
        </div>

        {/* Floating/Docked elegant iPhone mockup frame on the right side if active */}
        {showMobilePreview && (
          <div className="hidden lg:flex w-[420px] bg-[#F7F9FC] border-l border-slate-200 p-6 flex-col items-center justify-center shrink-0 overflow-y-auto select-none shadow-inner">
            <T className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-4">
              📱 Xem trước giao diện di động (Mobile Preview)
            </T>

            {isFormOpen ? (
              <ReportForm
                currentUser={currentUser}
                editingReport={editingReport}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingReport(null);
                }}
                onSubmitReport={handleSubmitReport}
                offlineMode={offlineMode}
              />
            ) : (
              <MobileFrame
                reports={reports}
                currentUserId={currentUser.id}
                onOpenReportForm={() => setIsFormOpen(true)}
                onDeleteReport={handleDeleteReportTrigger}
                onEditReport={handleEditReportTrigger}
                offlineMode={offlineMode}
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
                editingReport={editingReport}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingReport(null);
                }}
                onSubmitReport={handleSubmitReport}
                offlineMode={offlineMode}
              />
            ) : (
              <MobileFrame
                reports={reports}
                currentUserId={currentUser.id}
                onOpenReportForm={() => setIsFormOpen(true)}
                onDeleteReport={handleDeleteReportTrigger}
                onEditReport={handleEditReportTrigger}
                offlineMode={offlineMode}
              />
            )}

            {/* floating switch back screen toggle at bottom-left corner */}
            <button
              onClick={() => setShowMobilePreview(false)}
              className="absolute bottom-20 left-4 bg-slate-950/95 text-white rounded-full p-3 shadow-2xl border border-white/15 hover:scale-105 active:scale-95 transition-transform z-30 flex items-center justify-center cursor-pointer"
              title="Quay lại giao diện máy tính"
            >
              <Monitor className="w-4.5 h-4.5 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
