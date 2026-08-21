import { User, UserRole, QualityReport, Branch, KnowledgeDoc, ForumTopic, ForumReply } from "../types";

export type CompanyScope = "ALL" | "TPP" | "DNP";

/**
 * Determine company ("TPP" | "DNP") for a User
 */
export function getUserCompany(user?: Partial<User> | null, branches?: Branch[]): "TPP" | "DNP" {
  if (!user) return "TPP";

  if (user.company === "DNP" || user.company === "TPP") {
    return user.company;
  }

  const br = (user.branch || "").toUpperCase();
  const dept = (user.department || "").toUpperCase();

  if (
    br.includes("DNP") || 
    br.includes("BBM") || 
    br.includes("BBC") || 
    br.includes("ĐỒNG NAI") || 
    br.includes("DONG NAI") || 
    br.includes("BAO BÌ MỀM") || 
    br.includes("BAO BI MEM") || 
    br.includes("BAO BÌ CỨNG") || 
    br.includes("BAO BI CUNG") ||
    dept.includes("(DNP-") || 
    dept.includes("BBM") || 
    dept.includes("BBC")
  ) {
    return "DNP";
  }

  if (
    br.includes("TPP") || 
    br.includes("LAN") || 
    br.includes("BNI") || 
    br.includes("314") || 
    br.includes("CTY") || 
    br.includes("BẮC NINH") || 
    br.includes("BAC NINH") || 
    br.includes("LONG AN") || 
    br.includes("TÂN PHÚ") || 
    br.includes("TAN PHU") || 
    dept.includes("(TPP-")
  ) {
    return "TPP";
  }

  if (branches && branches.length > 0 && user.branch) {
    const matched = branches.find(
      (b) => b.id === user.branch || b.name.toLowerCase() === user.branch?.toLowerCase() || user.branch?.toLowerCase().includes(b.id.toLowerCase())
    );
    if (matched && (matched.companyId === "DNP" || matched.companyId === "TPP")) {
      return matched.companyId;
    }
  }

  return "TPP";
}

/**
 * Determine company ("TPP" | "DNP") for a QualityReport
 */
export function getReportCompany(report?: Partial<QualityReport> | null, branches?: Branch[]): "TPP" | "DNP" {
  if (!report) return "TPP";

  if (report.targetCompany === "DNP" || report.targetCompany === "TPP") {
    return report.targetCompany;
  }
  if (report.assignedCompany === "DNP" || report.assignedCompany === "TPP") {
    return report.assignedCompany;
  }

  const fac = (report.factory || "").toUpperCase();
  const dept = (report.uploaderDepartment || "").toUpperCase();

  if (
    fac.includes("DNP") || 
    fac.includes("BBM") || 
    fac.includes("BBC") || 
    fac.includes("ĐỒNG NAI") || 
    fac.includes("DONG NAI") || 
    fac.includes("BAO BÌ MỀM") || 
    fac.includes("BAO BI MEM") || 
    fac.includes("BAO BÌ CỨNG") || 
    fac.includes("BAO BI CUNG") ||
    dept.includes("(DNP-") || 
    dept.includes("BBM") || 
    dept.includes("BBC")
  ) {
    return "DNP";
  }

  if (
    fac.includes("TPP") || 
    fac.includes("LAN") || 
    fac.includes("BNI") || 
    fac.includes("314") || 
    fac.includes("CTY") || 
    fac.includes("BẮC NINH") || 
    fac.includes("BAC NINH") || 
    fac.includes("LONG AN") || 
    fac.includes("TÂN PHÚ") || 
    fac.includes("TAN PHU") || 
    dept.includes("(TPP-")
  ) {
    return "TPP";
  }

  if (branches && branches.length > 0 && report.factory) {
    const matched = branches.find(
      (b) => b.id === report.factory || b.name.toLowerCase() === report.factory?.toLowerCase() || report.factory?.toLowerCase().includes(b.id.toLowerCase())
    );
    if (matched && (matched.companyId === "DNP" || matched.companyId === "TPP")) {
      return matched.companyId;
    }
  }

  return "TPP";
}

/**
 * Determine company ("TPP" | "DNP") for a Branch or Branch name
 */
export function getBranchCompany(branch?: Partial<Branch> | string | null): "TPP" | "DNP" {
  if (!branch) return "TPP";
  if (typeof branch === "object") {
    if (branch.companyId === "DNP" || branch.companyId === "TPP") {
      return branch.companyId;
    }
    const idStr = (branch.id || "").toUpperCase();
    const nameStr = (branch.name || "").toUpperCase();
    if (
      idStr.includes("DNP") || 
      idStr.includes("BBM") || 
      idStr.includes("BBC") || 
      idStr.includes("ĐỒNG NAI") || 
      idStr.includes("DONG NAI") ||
      nameStr.includes("DNP") || 
      nameStr.includes("BBM") || 
      nameStr.includes("BBC") ||
      nameStr.includes("ĐỒNG NAI") || 
      nameStr.includes("DONG NAI") ||
      nameStr.includes("BAO BÌ MỀM") ||
      nameStr.includes("BAO BÌ CỨNG")
    ) {
      return "DNP";
    }
    return "TPP";
  }

  const str = String(branch).toUpperCase();
  if (
    str.includes("DNP") || 
    str.includes("BBM") || 
    str.includes("BBC") || 
    str.includes("ĐỒNG NAI") || 
    str.includes("DONG NAI") ||
    str.includes("BAO BÌ MỀM") || 
    str.includes("BAO BI MEM") || 
    str.includes("BAO BÌ CỨNG") || 
    str.includes("BAO BI CUNG")
  ) {
    return "DNP";
  }
  return "TPP";
}

/**
 * Check if a report is within the specified CompanyScope
 */
export function isReportInScope(report: QualityReport, scope: CompanyScope, branches?: Branch[]): boolean {
  if (scope === "ALL") return true;
  // If report has targetCompany === "ALL", it is shared to all
  if (report.targetCompany === "ALL" || report.assignedCompany === "ALL") return true;
  return getReportCompany(report, branches) === scope;
}

/**
 * Check if a user is within the specified CompanyScope
 */
export function isUserInScope(user: User, scope: CompanyScope, branches?: Branch[]): boolean {
  if (scope === "ALL") return true;
  return getUserCompany(user, branches) === scope;
}

/**
 * Check if a branch is within the specified CompanyScope
 */
export function isBranchInScope(branch: Branch | string, scope: CompanyScope): boolean {
  if (scope === "ALL") return true;
  return getBranchCompany(branch) === scope;
}

/**
 * Check if a knowledge doc is within the specified CompanyScope
 */
export function isKnowledgeDocInScope(doc: KnowledgeDoc, scope: CompanyScope): boolean {
  if (scope === "ALL") return true;
  if (!doc.branchId || doc.branchId === "ALL") return true;
  return isBranchInScope(doc.branchId, scope);
}

/**
 * Check if a trial item is within the specified CompanyScope
 */
export function isTrialInScope(item: { targetCompany?: string; factory?: string }, scope: CompanyScope, branches?: Branch[]): boolean {
  if (scope === "ALL") return true;
  if (item.targetCompany === "ALL") return true;
  if (item.targetCompany === "DNP" || item.targetCompany === "TPP") {
    return item.targetCompany === scope;
  }
  if (item.factory) {
    return isBranchInScope(item.factory, scope);
  }
  return true;
}

/**
 * Check if a forum topic is within the specified CompanyScope
 */
export function isTopicInScope(topic: ForumTopic, scope: CompanyScope, branches?: Branch[]): boolean {
  if (scope === "ALL") return true;
  if (topic.targetCompany === "ALL") return true;
  if (topic.targetCompany === "DNP" || topic.targetCompany === "TPP") {
    return topic.targetCompany === scope;
  }
  if (topic.factory) {
    return isBranchInScope(topic.factory, scope);
  }
  return true;
}

/**
  * Calculate effective scope for the current session
  */
export function getEffectiveCompanyScope(
  currentUser?: User | null,
  adminScopePreference: CompanyScope = "ALL",
  branches?: Branch[]
): CompanyScope {
  if (!currentUser) return "ALL";
  const roleStr = (currentUser.role || "").toString().toUpperCase();
  const isAdmin = roleStr === "CHỦ ADMIN" || roleStr === "ADMIN" || roleStr === "SUPER_ADMIN" || currentUser.role === UserRole.ADMIN;
  if (isAdmin) {
    return adminScopePreference;
  }
  return getUserCompany(currentUser, branches);
}

/**
 * Check if the user is authorized/related/in the group to see this topic.
 * Rules:
 * 1. Admin / Super Admin (Chỉ Quản trị viên mới xem toàn bộ chủ đề).
 * 2. Topic Creator (Người tạo chủ đề).
 * 3. Directly invited user (Có trong danh sách mời topic.invitedUserIds).
 * 4. Participated in discussion (Đã từng đăng tin nhắn phản hồi trong chủ đề).
 * 5. Assigned a Task / Directive in this topic (Được giao việc/chỉ đạo).
 * 6. Linked KPH Report uploader / responsible staff (Người lập hoặc xử lý phiếu KPH liên quan).
 * 7. Any user @mentioned in the topic description or replies (Được nhắc tên @).
 */
export function isUserAllowedToViewTopic(
  topic: ForumTopic,
  user?: User | null,
  replies?: ForumReply[],
  reports?: QualityReport[]
): boolean {
  if (!user) return false;

  // 1. Only Admins have blanket supervisory visibility
  const roleStr = (user.role || "").toString().toUpperCase();
  const isAdmin =
    roleStr === "ADMIN" ||
    roleStr === "CHỦ ADMIN" ||
    roleStr === "SUPER_ADMIN" ||
    user.role === UserRole.ADMIN;
  if (isAdmin) return true;

  const userFullNameClean = (user.fullName || "").trim().toLowerCase();
  const userPhoneClean = (user.phone || "").trim();
  const userIdClean = (user.id || "").trim();

  // 2. Topic Creator
  const creatorNameClean = (topic.creatorName || "").trim().toLowerCase();
  const creatorPhoneClean = (topic.creatorPhone || "").trim();
  if (
    (userFullNameClean && creatorNameClean && userFullNameClean === creatorNameClean) ||
    (userPhoneClean && creatorPhoneClean && userPhoneClean === creatorPhoneClean) ||
    (userIdClean && creatorPhoneClean && userIdClean === creatorPhoneClean) ||
    (userIdClean && topic.id && topic.id.includes(userIdClean))
  ) {
    return true;
  }

  // 3. Directly invited user in invitedUserIds
  const invitedList = topic.invitedUserIds || [];
  if (Array.isArray(invitedList) && invitedList.length > 0) {
    const isInvited = invitedList.some((invId) => {
      if (!invId) return false;
      const cleanInv = invId.trim().toLowerCase();
      return (
        cleanInv === userIdClean.toLowerCase() ||
        cleanInv === userPhoneClean.toLowerCase() ||
        (userFullNameClean && cleanInv === userFullNameClean)
      );
    });
    if (isInvited) return true;
  }

  // 4. User has participated (posted a reply) in this topic
  if (Array.isArray(replies) && replies.length > 0) {
    const hasReplied = replies.some((r) => {
      if (r.topicId !== topic.id || r.isDeleted) return false;
      const rSenderName = (r.senderName || "").trim().toLowerCase();
      const rSenderPhone = (r.senderPhone || "").trim();
      return (
        (userFullNameClean && rSenderName && userFullNameClean === rSenderName) ||
        (userPhoneClean && rSenderPhone && userPhoneClean === rSenderPhone) ||
        (userIdClean && rSenderPhone && userIdClean === rSenderPhone)
      );
    });
    if (hasReplied) return true;

    // 5. Assigned a task/directive in this topic
    const hasAssignedAction = replies.some((r) => {
      if (r.topicId !== topic.id || r.isDeleted || !r.actionData) return false;
      const aName = (r.actionData.assignedToName || "").trim().toLowerCase();
      const aId = (r.actionData.assignedToId || "").trim();
      return (
        (userFullNameClean && aName && userFullNameClean === aName) ||
        (userIdClean && aId && userIdClean === aId) ||
        (userPhoneClean && aId && userPhoneClean === aId)
      );
    });
    if (hasAssignedAction) return true;
  }

  // 6. Linked KPH Report author or assigned
  if (topic.reportId && Array.isArray(reports) && reports.length > 0) {
    const rep = reports.find(
      (r) => r.id === topic.reportId || (r.reportCode && r.reportCode === topic.reportId)
    );
    if (rep) {
      const uploaderNameClean = (rep.uploaderName || "").trim().toLowerCase();
      const uploaderPhoneClean = (rep.uploaderPhone || "").trim();
      const repAssignedName = (rep.assignedPersonName || "").trim().toLowerCase();
      const repAssignedId = (rep.assignedPersonId || "").trim();
      if (
        (userFullNameClean && uploaderNameClean && userFullNameClean === uploaderNameClean) ||
        (userPhoneClean && uploaderPhoneClean && userPhoneClean === uploaderPhoneClean) ||
        (userIdClean && rep.uploaderId && userIdClean === rep.uploaderId) ||
        (userFullNameClean && repAssignedName && userFullNameClean === repAssignedName) ||
        (userIdClean && repAssignedId && userIdClean === repAssignedId)
      ) {
        return true;
      }
    }
  }

  // 7. Mentioned in topic description, title, or replies
  if (userFullNameClean || userPhoneClean || userIdClean) {
    const descLower = (topic.description || "").toLowerCase();
    const titleLower = (topic.title || "").toLowerCase();
    const words = userFullNameClean.split(/\s+/);
    const lastName = words.length > 0 ? words[words.length - 1] : "";

    const isMentionedInText = (text: string) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      if (userFullNameClean && lower.includes(`@${userFullNameClean}`)) return true;
      if (userPhoneClean && lower.includes(`@${userPhoneClean}`)) return true;
      if (userIdClean && lower.includes(`@${userIdClean.toLowerCase()}`)) return true;
      if (lastName && lastName.length >= 2) {
        const regex = new RegExp(`@${lastName}(?:\\s|$|[.,!?])`, "i");
        if (regex.test(lower)) return true;
      }
      return false;
    };

    if (isMentionedInText(descLower) || isMentionedInText(titleLower)) {
      return true;
    }

    if (Array.isArray(replies) && replies.length > 0) {
      const isMentionedInReply = replies.some(
        (r) => r.topicId === topic.id && !r.isDeleted && isMentionedInText(r.message || "")
      );
      if (isMentionedInReply) return true;
    }
  }

  return false;
}

