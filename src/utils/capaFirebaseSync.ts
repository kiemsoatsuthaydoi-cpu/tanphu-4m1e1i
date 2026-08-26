import { db, storage } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { CapaData, CapaVersion, CapaDocument } from "../types";

export const CAPA_COLLECTION = "capa_documents";

/**
 * Clean undefined values recursively to avoid Firestore write errors
 */
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item));
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Compress an image data URL or Blob to an ultra-lightweight WebP format (< 80KB)
 */
export async function compressImageToWebP(
  dataUrlOrBase64: string,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.75
): Promise<string> {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== "string") {
    return dataUrlOrBase64 || "";
  }
  
  // If already an HTTP/HTTPS URL from Cloud Storage, keep as is
  if (dataUrlOrBase64.startsWith("http://") || dataUrlOrBase64.startsWith("https://")) {
    return dataUrlOrBase64;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrlOrBase64);
            return;
          }

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first with quality fallback to JPEG
          let compressed = canvas.toDataURL("image/webp", quality);
          if (!compressed.startsWith("data:image/webp")) {
            compressed = canvas.toDataURL("image/jpeg", quality);
          }
          resolve(compressed);
        } catch (e) {
          resolve(dataUrlOrBase64);
        }
      };
      img.onerror = () => resolve(dataUrlOrBase64);
      img.src = dataUrlOrBase64;
    } catch (e) {
      resolve(dataUrlOrBase64);
    }
  });
}

/**
 * Upload an image to Firebase Storage if active, or fall back to compressed WebP Base64
 */
export async function uploadCapaImage(
  dataUrlOrBase64: string,
  reportId: string,
  slotName: string
): Promise<string> {
  if (!dataUrlOrBase64) return "";
  
  // If already a remote Cloud URL, no need to re-upload
  if (dataUrlOrBase64.startsWith("http://") || dataUrlOrBase64.startsWith("https://")) {
    return dataUrlOrBase64;
  }

  // Compress image first to keep storage & transfer minimal
  const compressed = await compressImageToWebP(dataUrlOrBase64, 900, 900, 0.75);

  if (!storage) {
    return compressed;
  }

  try {
    const cleanReportId = reportId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `capa_${cleanReportId}_${slotName}_${Date.now()}.webp`;
    const storageRef = ref(storage, `capa_evidences/${cleanReportId}/${filename}`);

    const base64Data = compressed.includes(",") ? compressed.split(",")[1] : compressed;
    const format = compressed.includes("image/jpeg") ? "data_url" : "data_url";

    await uploadString(storageRef, compressed, format);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`[Firebase Storage] Uploaded image ${filename} successfully:`, downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.warn(`[Firebase Storage] Direct upload failed, retaining compressed image safely:`, error);
    return compressed;
  }
}

/**
 * Save full CAPA document (form + all version histories) to Firestore
 */
export async function saveCapaToCloud(
  reportId: string,
  form: CapaData,
  versions: CapaVersion[],
  activeVersionTag?: string,
  alternateId?: string
): Promise<boolean> {
  if (!reportId) return false;
  
  const payload: CapaDocument = {
    id: reportId,
    reportId: reportId,
    activeFormData: form,
    versions: versions,
    activeVersionTag: activeVersionTag || form.rev || "v1.0",
    updatedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString()
  };

  const sanitized = sanitizeForFirestore(payload);

  // If db is not available or offline, return false so caller knows it is local-only
  if (!db) {
    return false;
  }

  try {
    const docRef = doc(db, CAPA_COLLECTION, reportId);
    await setDoc(docRef, sanitized, { merge: true });

    // Also mirror to alternate ID (e.g. reportCode B0000001 <-> R-1) if present
    if (alternateId && alternateId !== reportId) {
      const altPayload = { ...sanitized, id: alternateId, reportId: alternateId };
      const altRef = doc(db, CAPA_COLLECTION, alternateId);
      await setDoc(altRef, altPayload, { merge: true });
    }

    console.log(`[Firestore] CAPA Document for report ${reportId} saved successfully to Cloud.`);
    return true;
  } catch (error: any) {
    console.warn(`[Firestore] Error saving CAPA document ${reportId} to Cloud:`, error);
    return false;
  }
}

/**
 * Fetch CAPA document from Firestore
 */
export async function fetchCapaFromCloud(
  reportId: string,
  alternateId?: string
): Promise<{
  form: CapaData | null;
  versions: CapaVersion[] | null;
  activeVersionTag?: string;
  updatedAt?: string;
} | null> {
  if (!db || !reportId) return null;

  try {
    const docRef = doc(db, CAPA_COLLECTION, reportId);
    let snap = await getDoc(docRef);

    if ((!snap.exists() || !snap.data()?.versions || snap.data()?.versions.length === 0) && alternateId && alternateId !== reportId) {
      const altRef = doc(db, CAPA_COLLECTION, alternateId);
      const altSnap = await getDoc(altRef);
      if (altSnap.exists()) {
        snap = altSnap;
      }
    }

    if (snap.exists()) {
      const data = snap.data() as CapaDocument;
      return {
        form: data.activeFormData || null,
        versions: data.versions || null,
        activeVersionTag: data.activeVersionTag,
        updatedAt: data.updatedAt
      };
    }
    return null;
  } catch (error: any) {
    console.warn(`[Firestore] Error fetching CAPA doc ${reportId} from Cloud:`, error);
    return null;
  }
}

/**
 * Subscribe to real-time updates for a CAPA document
 */
export function subscribeCapaFromCloud(
  reportId: string,
  onUpdate: (data: {
    form: CapaData | null;
    versions: CapaVersion[] | null;
    activeVersionTag?: string;
    updatedAt?: string;
  }) => void
): () => void {
  if (!db || !reportId) {
    return () => {};
  }

  try {
    const docRef = doc(db, CAPA_COLLECTION, reportId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CapaDocument;
          onUpdate({
            form: data.activeFormData || null,
            versions: data.versions || null,
            activeVersionTag: data.activeVersionTag,
            updatedAt: data.updatedAt
          });
        }
      },
      (error) => {
        console.warn(`[Firestore] Snapshot error on CAPA doc ${reportId}:`, error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn(`[Firestore] Could not subscribe to CAPA doc ${reportId}:`, error);
    return () => {};
  }
}

/**
 * Non-destructive Auto-migration from LocalStorage to Cloud
 */
export async function autoMigrateLocalCapaToCloud(
  reportId: string,
  localForm: CapaData,
  localVersions: CapaVersion[],
  activeVersionTag?: string
): Promise<boolean> {
  if (!db || !reportId) return false;

  try {
    const cloudData = await fetchCapaFromCloud(reportId);
    // If cloud doesn't exist or is empty, upload local data seamlessly
    if (!cloudData || !cloudData.form || (!cloudData.versions || cloudData.versions.length === 0)) {
      console.log(`[Auto Migration] Migrating local CAPA for report ${reportId} to Firestore...`);
      return await saveCapaToCloud(reportId, localForm, localVersions, activeVersionTag);
    }
    return true;
  } catch (error) {
    console.warn(`[Auto Migration] Error checking/migrating CAPA ${reportId}:`, error);
    return false;
  }
}

/**
 * In-memory global registry for quick CAPA status checks (0ms latency, zero main-thread blocking)
 */
export const globalCapaMetaMap: Record<string, {
  hasCapa: boolean;
  isApproved: boolean;
  activeVersion?: string;
  versions: CapaVersion[];
  formData?: CapaData;
}> = {};

/**
 * Subscribe to all CAPA documents in Firestore for instant system-wide sync across all clients
 */
export function subscribeAllCapaDocuments(
  onUpdate?: () => void
): () => void {
  if (!db) {
    return () => {};
  }

  try {
    const collRef = collection(db, CAPA_COLLECTION);
    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CapaDocument;
          const docId = docSnap.id;
          const reportKey = data.reportId || docId;
          const keys = Array.from(new Set([docId, reportKey])).filter(Boolean);

          const hasVersions = Array.isArray(data.versions) && data.versions.length > 0;
          const validVersions = hasVersions ? data.versions.filter((v: any) => v && v.data) : [];
          const isApproved = validVersions.length > 0;
          const latestVer = isApproved ? validVersions[validVersions.length - 1].version : undefined;

          const meta = {
            hasCapa: isApproved || !!data.activeFormData,
            isApproved,
            activeVersion: data.activeVersionTag || latestVer,
            versions: validVersions,
            formData: data.activeFormData
          };

          keys.forEach((k) => {
            globalCapaMetaMap[k] = meta;
          });
        });

        // Trigger custom event for reactive UI update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("capa-cloud-synced"));
        }

        if (onUpdate) {
          onUpdate();
        }
      },
      (error) => {
        console.warn("[Firestore] Error subscribing to all CAPA documents:", error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn("[Firestore] Could not subscribe to CAPA documents collection:", error);
    return () => {};
  }
}

