import { User, UserRole } from "../types";

/**
 * Checks if a user belongs to Executive Leadership (Ban TGĐ, Chủ tịch, Phó TGĐ, Ban Giám Đốc, etc.).
 */
export function isLeadershipUser(user: User | any): boolean {
  if (!user) return false;
  const pos = (user.position || "").toUpperCase();
  const dept = (user.department || "").toUpperCase();
  const branch = (user.branch || "").toUpperCase();
  const role = (user.role || "").toString().toUpperCase();
  const name = (user.fullName || "").toUpperCase();

  const leadershipKeywords = [
    "CHỦ TỊCH",
    "BAN TỔNG GIÁM ĐỐC",
    "BAN TGĐ",
    "TỔNG GIÁM ĐỐC",
    "PHÓ TỔNG GIÁM ĐỐC",
    "PHÓ TGĐ",
    "PTGĐ",
    "BAN GIÁM ĐỐC",
    "BGĐ",
    "TỔNG GIÁM ĐỐC/CHỦ TỊCH",
    "GIÁM ĐỐC ĐIỀU HÀNH",
    "BAN ĐIỀU HÀNH",
    "BĐH"
  ];

  return leadershipKeywords.some(
    (kw) =>
      pos.includes(kw) ||
      dept.includes(kw) ||
      branch.includes(kw) ||
      role.includes(kw) ||
      name.includes(kw)
  );
}

/**
 * Checks if a user is authorized to tag Executive Leadership.
 * Allowed: Admin role, Executive Leadership themselves, or Managerial positions (Trưởng phòng, Phó phòng trở lên hoặc tương đương).
 */
export function canUserTagLeadership(currentUser: User | any): boolean {
  if (!currentUser) return false;

  const roleUpper = (currentUser.role || "").toString().toUpperCase();

  // 1. Admin or Special privilege
  if (
    roleUpper === "CHỦ ADMIN" ||
    roleUpper === "ADMIN" ||
    roleUpper.includes("ADMIN") ||
    currentUser.role === UserRole.ADMIN ||
    currentUser.canSpeciallyEditDelete
  ) {
    return true;
  }

  // 2. Executive Leadership themselves can tag other leaders
  if (isLeadershipUser(currentUser)) {
    return true;
  }

  // 3. Managerial positions: Trưởng phòng, Phó phòng, Giám đốc, Phó Giám đốc, Trưởng ban, Phó ban, Trưởng bộ phận, Quản lý, Quản đốc...
  const pos = (currentUser.position || "").toUpperCase();
  const dept = (currentUser.department || "").toUpperCase();

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
    "DUYỆT VIÊN",
    "CHUYÊN VIÊN CAO CẤP"
  ];

  return managerKeywords.some(
    (kw) => pos.includes(kw) || dept.includes(kw) || roleUpper.includes(kw)
  );
}
