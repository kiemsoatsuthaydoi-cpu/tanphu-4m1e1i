import { TrialTrackingItem, QualityReport } from "../types";

export const DEFAULT_RETENTION_DAYS = 30;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Safely parse various date string formats (dd/mm/yy, dd/mm/yy HH:mm, HH:mm:ss dd/mm/yy, ISO string, or number)
 */
export function parseTimestampSafe(dateInput: string | number | undefined | null): number {
  if (!dateInput) return 0;
  if (typeof dateInput === "number") return dateInput;

  const str = String(dateInput).trim();
  if (!str) return 0;

  // Try ISO date
  const isoTime = Date.parse(str);
  if (!isNaN(isoTime) && str.includes("-")) {
    return isoTime;
  }

  // Format: "dd/mm/yy HH:mm" or "dd/mm/yyyy HH:mm"
  const matchDateTime = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (matchDateTime) {
    const [_, d, m, y, hrs = "0", mins = "0", secs = "0"] = matchDateTime;
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
    return new Date(
      year,
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(hrs, 10),
      parseInt(mins, 10),
      parseInt(secs, 10)
    ).getTime();
  }

  // Format: "HH:mm:ss dd/mm/yy" or "HH:mm:ss dd/mm/yyyy"
  const matchTimeDate = str.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (matchTimeDate) {
    const [_, hrs, mins, secs, d, m, y] = matchTimeDate;
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
    return new Date(
      year,
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(hrs, 10),
      parseInt(mins, 10),
      parseInt(secs, 10)
    ).getTime();
  }

  return 0;
}

/**
 * Filter trial tracking items to only keep those within the retention window (default 30 days)
 * Exception: Always retain IN_PROGRESS trials to prevent active workflows from being purged.
 */
export function filterTrialItemsWithin30Days(
  items: TrialTrackingItem[],
  retentionDays = DEFAULT_RETENTION_DAYS
): TrialTrackingItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const now = Date.now();
  const cutoffTime = now - retentionDays * MS_PER_DAY;

  const filtered = items.filter((item) => {
    // 1. Never purge active in-progress trials
    if (item.overallStatus === "IN_PROGRESS") {
      return true;
    }

    // 2. Check item timestamp
    const itemTime =
      item.createdTimestamp ||
      parseTimestampSafe(item.updatedAt) ||
      parseTimestampSafe(item.createdAt);

    if (itemTime > 0) {
      return itemTime >= cutoffTime;
    }

    // Fallback: If no valid timestamp could be extracted, keep it safely
    return true;
  });

  // Safety baseline: If filtering reduced the array too much, retain at least top 15 most recent items
  if (filtered.length < Math.min(items.length, 10)) {
    return items.slice(-15);
  }

  return filtered;
}

/**
 * Filter quality reports to keep within the 30-day retention window
 */
export function filterReportsWithin30Days(
  reports: QualityReport[],
  retentionDays = DEFAULT_RETENTION_DAYS
): QualityReport[] {
  if (!Array.isArray(reports) || reports.length === 0) return [];

  const now = Date.now();
  const cutoffTime = now - retentionDays * MS_PER_DAY;

  const filtered = reports.filter((r) => {
    const reportTime = parseTimestampSafe(r.timestamp) || parseTimestampSafe(r.updatedAt);
    if (reportTime > 0) {
      return reportTime >= cutoffTime;
    }
    return true;
  });

  // Safety baseline: Retain at least 20 most recent reports
  if (filtered.length < Math.min(reports.length, 15)) {
    return reports.slice(-20);
  }

  return filtered;
}

/**
 * Auto-clean localStorage caches:
 * 1. Prunes trial tracking items older than 30 days from local cache (Cloud still has full records).
 * 2. Prunes old temporary printing keys and orphan temp data.
 * 3. Never touches credentials, session configs, user profiles or offline queue.
 */
export function cleanStaleLocalStorage(retentionDays = DEFAULT_RETENTION_DAYS): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    const now = Date.now();
    const lastCleanupKey = "tanphu_last_storage_cleanup_time";
    const lastCleanup = Number(localStorage.getItem(lastCleanupKey) || 0);

    // Throttle cleanup to run at most once every 6 hours
    if (now - lastCleanup < 6 * 60 * 60 * 1000) {
      return;
    }

    let cleanedKeysCount = 0;

    // 1. Clean Trial Trackings in localStorage
    const savedTrialsStr = localStorage.getItem("tanphu_trial_trackings_v1");
    if (savedTrialsStr) {
      try {
        const parsedTrials: TrialTrackingItem[] = JSON.parse(savedTrialsStr);
        if (Array.isArray(parsedTrials) && parsedTrials.length > 0) {
          const cleanedTrials = filterTrialItemsWithin30Days(parsedTrials, retentionDays);
          if (cleanedTrials.length < parsedTrials.length) {
            localStorage.setItem("tanphu_trial_trackings_v1", JSON.stringify(cleanedTrials));
            console.log(
              `[StorageCleaner] Dọn dẹp Bản tin Thử nghiệm: Giữ lại ${cleanedTrials.length}/${parsedTrials.length} bản ghi trong vòng ${retentionDays} ngày.`
            );
          }
        }
      } catch (e) {
        console.warn("[StorageCleaner] Lỗi xử lý cache thử nghiệm:", e);
      }
    }

    // 2. Clean temporary keys
    const tempKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (
          key.startsWith("temp_") ||
          key.startsWith("capa_print_snapshot_") ||
          key.startsWith("capa_print_target_") ||
          key.startsWith("trial_print_")
        ) {
          tempKeysToRemove.push(key);
        }
      }
    }

    tempKeysToRemove.forEach((k) => {
      localStorage.removeItem(k);
      cleanedKeysCount++;
    });

    localStorage.setItem(lastCleanupKey, String(now));
    if (cleanedKeysCount > 0) {
      console.log(`[StorageCleaner] Đã dọn dẹp ${cleanedKeysCount} mục bộ nhớ đệm tạm.`);
    }
  } catch (error) {
    console.warn("[StorageCleaner] Không thể thực hiện dọn dẹp bộ nhớ đệm:", error);
  }
}
