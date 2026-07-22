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

export const canUserManageDirective = (
  currentUser: any,
  reportFactory: string | undefined
): boolean => {
  if (!currentUser) return false;

  // 1. Admin / Group Level Authority (Chủ tịch / Ban Tổng Giám đốc / Admin / Group HQ)
  if (currentUser.role === "admin") return true;

  const branchClean = (currentUser.branch || "").toUpperCase();
  const deptClean = (currentUser.department || "").toUpperCase();
  const posClean = (currentUser.position || "").toUpperCase();

  // Ban TGĐ, Văn phòng Tập đoàn/Công ty (TPP-CTY), Chủ Tịch, HQ QC, Admin
  const isHQ =
    branchClean.includes("TPP-CTY") ||
    branchClean.includes("VĂN PHÒNG CÔNG TY") ||
    branchClean.includes("VĂN PHÒNG TẬP ĐOÀN") ||
    branchClean.includes("CHỦ TỊCH") ||
    branchClean.includes("BAN TGĐ") ||
    deptClean.includes("BAN TỔNG GIÁM ĐỐC") ||
    deptClean.includes("BAN TGĐ") ||
    deptClean.includes("PHÒNG QUẢN LÝ CHẤT LƯỢNG (TPP-CTY)") ||
    posClean.includes("CHỦ TỊCH") ||
    posClean.includes("TỔNG GIÁM ĐỐC") ||
    posClean.includes("BAN TGĐ");

  if (isHQ) return true;

  // 2. Local Branch Manager / Reviewer
  const isLeaderOrReviewer =
    currentUser.role === "approver" ||
    currentUser.role === "reviewer" ||
    currentUser.canSpeciallyEditDelete ||
    posClean.includes("GIÁM ĐỐC") ||
    posClean.includes("TRƯỞNG PHÒNG") ||
    posClean.includes("QUẢN LÝ") ||
    posClean.includes("QUẢN ĐỐC");

  if (!isLeaderOrReviewer) return false;

  // Compare currentUser.branch with reportFactory using isSameBranchOrFactory
  return isSameBranchOrFactory(currentUser.branch, reportFactory);
};

export const formatNameCapitalized = (str: string | undefined | null): string => {
  if (!str) return "";
  
  const isEntirelyUppercase = str === str.toUpperCase();
  const commonAbbreviations = new Set([
    "TGĐ", "BGĐ", "BĐH", "CEO", "QC", "QA", "KPH", "5S", "BBM", "BBC", "TPP", "DNP", "BNI", 
    "LAN", "CTY", "KCS", "ISO", "DSA", "HSSE", "PCCC", "NS", "HR", "IT", "PE", "IE", "CBNV"
  ]);

  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      
      const cleanWord = word.replace(/[().,;[\]{}]/g, "").toUpperCase();
      
      // If word is in parentheses or bracketed, keep uppercase
      if (word.startsWith("(") || word.endsWith(")")) {
        return word.toUpperCase();
      }
      
      // If the word is a known abbreviation, keep it uppercase
      if (commonAbbreviations.has(cleanWord)) {
        return word.toUpperCase();
      }
      
      // If the word is originally all uppercase and <= 4 chars, and the ENTIRE string is NOT uppercase,
      // it is likely an abbreviation (like "TGĐ" in "Ban TGĐ"). Keep it.
      if (!isEntirelyUppercase && word === word.toUpperCase() && word.length <= 4) {
        return word;
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};


