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

export const formatNameCapitalized = (str: string | undefined | null): string => {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      // If word is in parentheses or bracketed, keep uppercase
      if (word.startsWith("(") || word.endsWith(")")) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};
