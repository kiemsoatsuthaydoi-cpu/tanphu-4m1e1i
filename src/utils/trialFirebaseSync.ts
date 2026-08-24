import { db, storage } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { TrialTrackingItem } from "../types";
import { initialTrialTrackings } from "../data/trialTrackings";
import { filterTrialItemsWithin30Days } from "./storageCleaner";

export const TRIAL_COLLECTION = "trial_trackings";

/**
 * Clean undefined and unsupported values recursively to prevent Firestore write crashes
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
 * Compress an image data URL or Blob to an ultra-lightweight WebP/JPEG format (80KB - 120KB)
 */
export async function compressImageToWebP(
  dataUrlOrBase64: string,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.70
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
 * Process a File upload and compress to 80KB-120KB Base64
 */
export async function processTrialImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const raw = e.target?.result as string;
          if (!raw) {
            resolve("");
            return;
          }
          const compressed = await compressImageToWebP(raw, 900, 900, 0.70);
          resolve(compressed);
        } catch (err) {
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    } catch (err) {
      resolve("");
    }
  });
}

/**
 * Upload an attachment or image for a trial to Firebase Storage or compress WebP
 */
export async function uploadTrialAttachment(
  dataUrlOrBase64: string,
  trialId: string,
  slotName: string
): Promise<string> {
  if (!dataUrlOrBase64) return "";

  if (dataUrlOrBase64.startsWith("http://") || dataUrlOrBase64.startsWith("https://")) {
    return dataUrlOrBase64;
  }

  const compressed = await compressImageToWebP(dataUrlOrBase64, 900, 900, 0.75);

  if (!storage) {
    return compressed;
  }

  try {
    const cleanTrialId = trialId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `trial_${cleanTrialId}_${slotName}_${Date.now()}.webp`;
    const storageRef = ref(storage, `trial_attachments/${cleanTrialId}/${filename}`);

    await uploadString(storageRef, compressed, "data_url");
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`[Firebase Storage] Uploaded trial attachment ${filename}:`, downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.warn(`[Firebase Storage] Direct upload failed, retaining compressed image:`, error);
    return compressed;
  }
}

/**
 * Save / Update a Trial Tracking document in Firestore
 */
export async function saveTrialToCloud(item: TrialTrackingItem): Promise<boolean> {
  if (!item || !item.id) return false;

  const sanitized = sanitizeForFirestore({
    ...item,
    updatedAt: item.updatedAt || new Date().toISOString()
  });

  if (!db) {
    return false;
  }

  try {
    const docRef = doc(db, TRIAL_COLLECTION, item.id);
    await setDoc(docRef, sanitized, { merge: true });
    console.log(`[Firestore] Trial Tracking item ${item.id} (${item.code}) saved to Cloud.`);
    return true;
  } catch (error: any) {
    const isPerm = error?.code === "permission-denied" || error?.message?.toLowerCase().includes("permission");
    if (isPerm) {
      console.log(`[Firestore] Trial ${item.id} saved locally (Cloud write restricted or offline).`);
    } else {
      console.warn(`[Firestore] Error saving trial ${item.id} to Cloud:`, error);
    }
    return false;
  }
}

/**
 * Delete a Trial Tracking document from Firestore (Mark soft delete and then remove doc)
 */
export async function deleteTrialFromCloud(id: string): Promise<boolean> {
  if (!db || !id) return false;

  try {
    const docRef = doc(db, TRIAL_COLLECTION, id);
    // 1. Mark isDeleted flag first so all listeners and local caches filter it out immediately
    try {
      await setDoc(docRef, { isDeleted: true, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {}
    // 2. Also try deleteDoc
    await deleteDoc(docRef);
    console.log(`[Firestore] Trial Tracking item ${id} deleted from Cloud.`);
    return true;
  } catch (error: any) {
    console.warn(`[Firestore] Error deleting trial ${id} from Cloud:`, error);
    return false;
  }
}

/**
 * Fetch all Trial Tracking documents from Firestore
 */
export async function fetchTrialsFromCloud(deletedTrialIds: string[] = []): Promise<TrialTrackingItem[]> {
  if (!db) return [];

  try {
    const snap = await getDocs(collection(db, TRIAL_COLLECTION));
    const items: TrialTrackingItem[] = [];

    snap.forEach((d) => {
      const data = d.data() as TrialTrackingItem;
      const itemId = d.id || data?.id;
      if (data && !data.isDeleted && !deletedTrialIds.includes(itemId)) {
        items.push({
          ...data,
          id: itemId
        });
      }
    });

    // Sort descending by createdTimestamp or createdAt
    items.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
    return items;
  } catch (error: any) {
    console.warn(`[Firestore] Error fetching trial trackings from Cloud:`, error);
    return [];
  }
}

/**
 * Real-time subscription to Trial Tracking collection in Firestore
 */
export function subscribeTrialsFromCloud(
  onUpdate: (items: TrialTrackingItem[]) => void,
  getDeletedIds?: () => string[]
): () => void {
  if (!db) {
    return () => {};
  }

  try {
    const collRef = collection(db, TRIAL_COLLECTION);
    const unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const deletedIds = getDeletedIds ? getDeletedIds() : [];
        const items: TrialTrackingItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as TrialTrackingItem;
          const itemId = d.id || data?.id;
          if (data && !data.isDeleted && !deletedIds.includes(itemId)) {
            items.push({
              ...data,
              id: itemId
            });
          }
        });

        // Sort descending by createdTimestamp
        items.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));

        // Always trigger update so when all are deleted or filtered, list updates cleanly
        onUpdate(items);
      },
      (error) => {
        console.warn(`[Firestore] Snapshot listener error on ${TRIAL_COLLECTION}:`, error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn(`[Firestore] Could not subscribe to ${TRIAL_COLLECTION}:`, error);
    return () => {};
  }
}

/**
 * Non-destructive Auto-migration / seeding from local data to Firestore
 */
export async function autoMigrateLocalTrialsToCloud(
  localItems: TrialTrackingItem[],
  deletedTrialIds: string[] = []
): Promise<boolean> {
  if (!db) return false;

  try {
    const cloudItems = await fetchTrialsFromCloud(deletedTrialIds);

    // Filter out any deleted IDs
    const itemsToSeed = (localItems && localItems.length > 0 ? localItems : initialTrialTrackings)
      .filter(item => !deletedTrialIds.includes(item.id) && !item.isDeleted);

    if (cloudItems.length === 0) {
      if (itemsToSeed.length > 0) {
        console.log(`[Auto Migration] Seeding ${itemsToSeed.length} initial trial trackings to Firestore...`);
        for (const item of itemsToSeed) {
          await saveTrialToCloud(item);
        }
      }
      return true;
    } else {
      // Check if any local item does not exist on Cloud and not in deleted list
      const cloudIdSet = new Set(cloudItems.map((c) => c.id));
      for (const localItem of itemsToSeed) {
        if (!cloudIdSet.has(localItem.id) && !deletedTrialIds.includes(localItem.id)) {
          console.log(`[Auto Migration] Syncing local trial ${localItem.id} to Firestore...`);
          await saveTrialToCloud(localItem);
        }
      }
      return true;
    }
  } catch (error) {
    console.warn(`[Auto Migration] Error in autoMigrateLocalTrialsToCloud:`, error);
    return false;
  }
}
