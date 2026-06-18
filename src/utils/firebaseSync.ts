import { db } from "./firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { 
  initialUsers, 
  initialReports, 
  initialCompanies, 
  initialBranches, 
  initialDepartments, 
  initialBroadcastNotice, 
  initialChatMessages, 
  initialProductsCatalog, 
  initialMoldsCatalog, 
  initialProductionRequests, 
  initialProductionRequestItemsMap, 
  initialOrderImplementations 
} from "../data";

// Collections list
export const COLLECTIONS = {
  USERS: "users",
  REPORTS: "reports",
  COMPANIES: "companies",
  BRANCHES: "branches",
  DEPARTMENTS: "departments",
  BROADCASTS: "broadcasts",
  CHATS: "chats",
  PRODUCTION_REQUESTS: "productionRequests",
  PRODUCTION_REQUEST_ITEMS: "productionRequestItems",
  ORDER_IMPLEMENTATIONS: "orderImplementations",
  PRODUCTS_CATALOG: "productsCatalog",
  MOLDS_CATALOG: "moldsCatalog"
};

/**
 * Checks if a collection is empty, and if so, seeds it with initial data.
 */
export async function seedFirestoreIfNeeded(): Promise<boolean> {
  if (!db) {
    console.warn("Firestore not initialized, skipping seed.");
    return false;
  }

  try {
    const userSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    if (userSnap.empty) {
      console.log("Firestore users collection is empty. Seeding initial data...");
      
      const batch = writeBatch(db);
      
      // Seed users
      initialUsers.forEach((u) => {
        const docRef = doc(db, COLLECTIONS.USERS, u.id);
        batch.set(docRef, u);
      });

      // Seed companies
      initialCompanies.forEach((c) => {
        const docRef = doc(db, COLLECTIONS.COMPANIES, c.id);
        batch.set(docRef, c);
      });

      // Seed branches
      initialBranches.forEach((b) => {
        const docRef = doc(db, COLLECTIONS.BRANCHES, b.id);
        batch.set(docRef, b);
      });

      // Seed departments
      initialDepartments.forEach((d) => {
        const docRef = doc(db, COLLECTIONS.DEPARTMENTS, d.id);
        batch.set(docRef, d);
      });

      // Seed reports
      initialReports.forEach((r) => {
        const docRef = doc(db, COLLECTIONS.REPORTS, r.id);
        batch.set(docRef, r);
      });

      // Seed broadcasts
      initialBroadcastNotice.forEach((b) => {
        const docRef = doc(db, COLLECTIONS.BROADCASTS, b.id);
        batch.set(docRef, b);
      });

      // Seed chats
      initialChatMessages.forEach((c) => {
        const docRef = doc(db, COLLECTIONS.CHATS, c.id);
        batch.set(docRef, c);
      });

      // Seed products catalog
      initialProductsCatalog.forEach((p) => {
        const docRef = doc(db, COLLECTIONS.PRODUCTS_CATALOG, p.code);
        batch.set(docRef, p);
      });

      // Seed molds catalog
      initialMoldsCatalog.forEach((m) => {
        const docRef = doc(db, COLLECTIONS.MOLDS_CATALOG, m.code);
        batch.set(docRef, m);
      });

      // Seed production requests
      initialProductionRequests.forEach((pr) => {
        const docRef = doc(db, COLLECTIONS.PRODUCTION_REQUESTS, pr.id);
        batch.set(docRef, pr);
      });

      // Seed production request items (by key as id)
      Object.entries(initialProductionRequestItemsMap).forEach(([prId, items]) => {
        const docRef = doc(db, COLLECTIONS.PRODUCTION_REQUEST_ITEMS, prId);
        batch.set(docRef, { prId, items });
      });

      // Seed order implementations
      initialOrderImplementations.forEach((oi) => {
        const docRef = doc(db, COLLECTIONS.ORDER_IMPLEMENTATIONS, oi.id);
        batch.set(docRef, oi);
      });

      await batch.commit();
      console.log("All collections seeded successfully into Firestore!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error seeding Firestore:", error);
    return false;
  }
}

/**
 * Fetches all documents from a Firestore collection.
 */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    snap.forEach((doc) => {
      items.push({ ...doc.data() } as T);
    });
    return items;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Saves a document to a Firestore collection.
 */
export async function saveDocument(collectionName: string, id: string, data: any): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving doc ${id} to ${collectionName}:`, error);
    return false;
  }
}

/**
 * Deletes a document from a Firestore collection.
 */
export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting doc ${id} from ${collectionName}:`, error);
    return false;
  }
}
