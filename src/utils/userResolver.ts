import { User } from "../types";

/**
 * Finds a user from the users list by matching ID, Phone, or Full Name.
 * This is highly robust for dynamic real-time profile lookup.
 */
export function findUser(
  users: User[] | undefined,
  id?: string,
  phone?: string,
  fullName?: string
): User | undefined {
  if (!users || !Array.isArray(users)) return undefined;
  
  // 1. Try to find by ID (exact match)
  if (id) {
    const cleanId = id.trim();
    if (cleanId) {
      const found = users.find(u => u.id && u.id.trim().toLowerCase() === cleanId.toLowerCase());
      if (found) return found;
    }
  }
  
  // 2. Try to find by phone (if provided and valid)
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone && cleanPhone.length >= 9) {
      const found = users.find(u => {
        if (!u.phone) return false;
        const uClean = u.phone.replace(/[^0-9]/g, "");
        return uClean === cleanPhone;
      });
      if (found) return found;
    }
  }
  
  // 3. Try to find by full name (case-insensitive, normalized)
  if (fullName) {
    const cleanSearchName = fullName.trim().toLowerCase().normalize("NFC");
    if (cleanSearchName) {
      const found = users.find(u => 
        u.fullName && u.fullName.trim().toLowerCase().normalize("NFC") === cleanSearchName
      );
      if (found) return found;
    }
  }
  
  return undefined;
}

/**
 * Dynamically resolves uploader info for a quality report.
 */
export function resolveUploaderInfo(
  users: User[] | undefined,
  report: { uploaderId?: string; uploaderPhone?: string; uploaderName: string; uploaderDepartment?: string }
) {
  const user = findUser(users, report.uploaderId, report.uploaderPhone, report.uploaderName);
  return {
    fullName: user ? user.fullName : report.uploaderName,
    id: user ? user.id : (report.uploaderId || ""),
    phone: report.uploaderPhone || (user ? user.phone : ""),
    department: report.uploaderDepartment || (user ? user.department : ""),
    position: user ? user.position : "Nhân Viên",
    role: user ? user.role : "USER",
    branch: user ? user.branch : "",
    company: user ? user.company : "",
    avatar: user ? user.avatar : undefined
  };
}

/**
 * Dynamically resolves details for a badge giver.
 */
export function resolveBadgeGiverInfo(
  users: User[] | undefined,
  badge: { giverId: string; giverName: string; giverRole: string; giverPosition?: string }
) {
  const user = findUser(users, badge.giverId, undefined, badge.giverName);
  return {
    fullName: user ? user.fullName : badge.giverName,
    id: user ? user.id : badge.giverId,
    role: badge.giverRole || (user ? user.role : ""),
    position: badge.giverPosition || (user ? user.position : "Nhân Viên")
  };
}

/**
 * Dynamically resolves details for a rating evaluator.
 */
export function resolveEvaluatorInfo(
  users: User[] | undefined,
  rating: { evaluatorId: string; evaluatorName: string; evaluatorRole: string }
) {
  const user = findUser(users, rating.evaluatorId, undefined, rating.evaluatorName);
  return {
    fullName: user ? user.fullName : rating.evaluatorName,
    id: user ? user.id : rating.evaluatorId,
    role: rating.evaluatorRole || (user ? user.role : "USER"),
    position: user ? user.position : "Nhân Viên"
  };
}

/**
 * Dynamically resolves sender info for a notification/notice/broadcast.
 */
export function resolveSenderInfo(
  users: User[] | undefined,
  senderPhone?: string,
  senderName?: string,
  senderRole?: string
) {
  const user = findUser(users, undefined, senderPhone, senderName);
  return {
    fullName: user ? user.fullName : (senderName || ""),
    id: user ? user.id : "",
    phone: senderPhone || (user ? user.phone : ""),
    department: user ? user.department : "",
    position: user ? user.position : "Nhân Viên",
    role: senderRole || (user ? user.role : "USER")
  };
}
