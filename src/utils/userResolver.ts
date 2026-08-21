import { User, UserRole } from "../types";
import { formatNameCapitalized } from "./branchHelpers";

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
    fullName: formatNameCapitalized(user ? user.fullName : report.uploaderName),
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
    fullName: formatNameCapitalized(user ? user.fullName : badge.giverName),
    id: user ? user.id : badge.giverId,
    role: badge.giverRole || (user ? user.role : ""),
    position: badge.giverPosition || (user ? user.position : "Nhân Viên"),
    avatar: user ? user.avatar : undefined
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
    fullName: formatNameCapitalized(user ? user.fullName : rating.evaluatorName),
    id: user ? user.id : rating.evaluatorId,
    role: rating.evaluatorRole || (user ? user.role : "USER"),
    position: user ? user.position : "Nhân Viên",
    avatar: user ? user.avatar : undefined
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
    fullName: formatNameCapitalized(user ? user.fullName : (senderName || "")),
    id: user ? user.id : "",
    phone: senderPhone || (user ? user.phone : ""),
    department: user ? user.department : "",
    position: user ? user.position : "Nhân Viên",
    role: senderRole || (user ? user.role : "USER"),
    avatar: user ? user.avatar : undefined
  };
}

/**
 * Robustly checks if a message/reply was sent by the currently logged-in user.
 * Supports Unicode normalization (NFC/NFD), stripping branch/dept parenthesized titles,
 * digit-only phone comparisons, and ID/Admin alias matching.
 */
export function isCurrentUserSender(
  currentUser: User | null | undefined,
  senderPhone?: string | null,
  senderName?: string | null,
  senderId?: string | null,
  senderRole?: string | null
): boolean {
  if (!currentUser) return false;

  const norm = (s?: string | null) => (s ? s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ") : "");
  const digits = (s?: string | null) => (s ? s.replace(/\D/g, "") : "");
  const baseName = (s?: string | null) => norm(s).replace(/\(.*?\)/g, "").trim();

  const myPhoneDigits = digits(currentUser.phone);
  const myIdDigits = digits(currentUser.id);
  const myId = norm(currentUser.id);
  const myName = norm(currentUser.fullName);
  const myBaseName = baseName(currentUser.fullName);

  const sPhoneDigits = digits(senderPhone);
  const sPhone = norm(senderPhone);
  const sId = norm(senderId);
  const sIdDigits = digits(senderId);
  const sName = norm(senderName);
  const sBaseName = baseName(senderName);

  // 1. Direct match on ID
  if (myId && (sId === myId || sPhone === myId)) return true;
  if (myIdDigits && myIdDigits.length >= 4 && (sPhoneDigits === myIdDigits || sIdDigits === myIdDigits)) return true;

  // 2. Phone match (exact digits)
  if (myPhoneDigits && myPhoneDigits.length >= 8 && (sPhoneDigits === myPhoneDigits || sPhone.includes(myPhoneDigits))) return true;
  if (currentUser.phone && sPhone && (sPhone === norm(currentUser.phone))) return true;

  // 3. Name match with Unicode NFC and parenthesis stripping
  if (myName && sName) {
    if (sName === myName || sBaseName === myBaseName) return true;
    if (myBaseName.length >= 3 && (sName.includes(myBaseName) || myName.includes(sBaseName))) return true;
  }

  // 4. Default Administrator / Lê Nhật Trường aliases
  const isCurrentAdmin =
    currentUser.role === UserRole.ADMIN ||
    myId === "usr-admin" ||
    myId === "2018.00281" ||
    myName.includes("admin") ||
    myBaseName.includes("lê nhật trường") ||
    myBaseName.includes("le nhat truong");

  if (isCurrentAdmin) {
    if (
      sId === "usr-admin" ||
      sId === "2018.00281" ||
      sPhone === "0907767304" ||
      sPhone === "usr-admin" ||
      sName.includes("admin") ||
      sBaseName.includes("lê nhật trường") ||
      sBaseName.includes("le nhat truong")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts tagged or mentioned users from text (e.g. "@Lê Nhật Trường", "@Trần Huy Tiến", "@0901234567")
 * or assigned actions, and returns their unique user IDs or keys and full names.
 */
export function extractTaggedUserIds(
  text: string | undefined | null,
  users: User[] | undefined,
  extraAssignedUser?: { id?: string; phone?: string; fullName?: string }
): { userIds: string[]; userNames: string[] } {
  const matchedUserIds: string[] = [];
  const matchedUserNames: string[] = [];

  if (!users || !Array.isArray(users)) {
    return { userIds: matchedUserIds, userNames: matchedUserNames };
  }

  // 1. Check extra assigned user if any
  if (extraAssignedUser) {
    const matched = findUser(users, extraAssignedUser.id, extraAssignedUser.phone, extraAssignedUser.fullName);
    if (matched) {
      const uKey = matched.id || matched.phone || matched.fullName;
      if (uKey && !matchedUserIds.includes(uKey)) {
        matchedUserIds.push(uKey);
        matchedUserNames.push(matched.fullName);
      }
    }
  }

  if (!text) {
    return { userIds: matchedUserIds, userNames: matchedUserNames };
  }

  const textLower = text.toLowerCase();

  users.forEach((u) => {
    const uKey = u.id || u.phone || u.fullName;
    if (matchedUserIds.includes(uKey)) return;

    // Check @FullName
    if (u.fullName && textLower.includes(`@${u.fullName.trim().toLowerCase()}`)) {
      matchedUserIds.push(uKey);
      matchedUserNames.push(u.fullName);
      return;
    }

    // Check @Phone
    if (u.phone && textLower.includes(`@${u.phone.trim().toLowerCase()}`)) {
      matchedUserIds.push(uKey);
      matchedUserNames.push(u.fullName);
      return;
    }

    // Check @ID
    if (u.id && textLower.includes(`@${u.id.trim().toLowerCase()}`)) {
      matchedUserIds.push(uKey);
      matchedUserNames.push(u.fullName);
      return;
    }

    // Check if short name or last name is used with @ (e.g., "@Trường", "@Tiến", "@Giáp")
    const words = (u.fullName || "").trim().split(/\s+/);
    if (words.length > 0) {
      const lastName = words[words.length - 1].toLowerCase();
      if (lastName.length >= 2) {
        const regex = new RegExp(`@${lastName}(?:\\s|$|[.,!?])`, "i");
        if (regex.test(text)) {
          matchedUserIds.push(uKey);
          matchedUserNames.push(u.fullName);
        }
      }
    }
  });

  return { userIds: matchedUserIds, userNames: matchedUserNames };
}

/**
 * Automatically computes the default list of member IDs/keys to pre-select for a discussion topic
 * linked to a report (Bản tin KPH / 4M1E):
 * 1. Topic creator (currentUser)
 * 2. Report uploader / author (người đăng bản tin)
 * 3. Tagged users in report content, notes, directives, resolutions, and assigned staff.
 */
export function getDefaultMembersForReport(
  report: any | undefined | null,
  users: User[] | undefined,
  currentUser?: User | null
): { memberIds: string[]; memberNames: string[] } {
  const selectedKeys = new Set<string>();
  const selectedNames = new Set<string>();

  const addMatchedUser = (userMatch?: User | null) => {
    if (!userMatch) return;
    const uKey = userMatch.id || userMatch.phone || userMatch.fullName;
    if (uKey) {
      selectedKeys.add(uKey);
      selectedNames.add(userMatch.fullName);
    }
  };

  // 1. Topic Creator
  if (currentUser) {
    addMatchedUser(currentUser);
  }

  if (!report || !users || !Array.isArray(users)) {
    return {
      memberIds: Array.from(selectedKeys),
      memberNames: Array.from(selectedNames)
    };
  }

  // 2. Report Uploader (Người đăng bản tin)
  const uploader = findUser(users, report.uploaderId, report.uploaderPhone, report.uploaderName);
  if (uploader) {
    addMatchedUser(uploader);
  } else if (report.uploaderPhone || report.uploaderId || report.uploaderName) {
    const rawKey = report.uploaderId || report.uploaderPhone || report.uploaderName;
    selectedKeys.add(rawKey);
    selectedNames.add(report.uploaderName || rawKey);
  }

  // 3. Assigned Person (Nhân viên được phân công)
  if (report.assignedPersonId || report.assignedPersonName) {
    const assigned = findUser(users, report.assignedPersonId, undefined, report.assignedPersonName);
    if (assigned) {
      addMatchedUser(assigned);
    }
  }

  // 4. Tagged in report content, notes, directives & resolutions
  const fullReportText = [
    report.content || "",
    report.notes || "",
    ...(report.directives || []).map((d: any) => `${d.text || ""} ${d.assignedTo || ""}`),
    ...(report.resolutions || []).map((r: any) => `${r.solution || ""} ${r.resolvedBy || ""}`)
  ].join(" ");

  const tagged = extractTaggedUserIds(fullReportText, users);
  tagged.userIds.forEach((uId, idx) => {
    selectedKeys.add(uId);
    if (tagged.userNames[idx]) {
      selectedNames.add(tagged.userNames[idx]);
    }
  });

  return {
    memberIds: Array.from(selectedKeys),
    memberNames: Array.from(selectedNames)
  };
}

