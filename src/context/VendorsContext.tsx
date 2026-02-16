"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getFirebaseFirestore } from "@/lib/firebase";
import { type Vendor } from "@/lib/vendorTypes";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";

const COLLECTION = "vendors";

interface VendorsContextType {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  addVendor: (vendor: Vendor) => void;
  editVendor: (vendor: Vendor) => void;
  deleteVendor: (vendorId: string) => void;
}

const VendorsContext = createContext<VendorsContextType>({
  vendors: [],
  loading: true,
  error: null,
  addVendor: () => {},
  editVendor: () => {},
  deleteVendor: () => {},
});

export function VendorsProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      const db = getFirebaseFirestore();
      if (!db) {
        setError(
          "Firestore not initialized. Check that your NEXT_PUBLIC_FIREBASE_* environment variables are set correctly."
        );
        setLoading(false);
        return;
      }

      try {
        const col = collection(db, COLLECTION);
        unsubscribe = onSnapshot(
          col,
          (snapshot) => {
            const data = snapshot.docs.map((d) => d.data() as Vendor);
            setVendors(data);
            setLoading(false);
            setError(null);
          },
          (err) => {
            setError(
              `Firestore listener error: ${err.code} — ${err.message}`
            );
            setLoading(false);
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize vendors: ${message}`);
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addVendor = useCallback(async (vendor: Vendor) => {
    const db = getFirebaseFirestore();
    if (!db) {
      setError("Firestore not available — cannot add vendor.");
      return;
    }
    try {
      await setDoc(doc(db, COLLECTION, vendor.id), vendor);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to add vendor: ${message}`);
    }
  }, []);

  const editVendor = useCallback(async (updatedVendor: Vendor) => {
    const db = getFirebaseFirestore();
    if (!db) {
      setError("Firestore not available — cannot edit vendor.");
      return;
    }
    try {
      await setDoc(doc(db, COLLECTION, updatedVendor.id), updatedVendor);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to update vendor: ${message}`);
    }
  }, []);

  const deleteVendor = useCallback(async (vendorId: string) => {
    const db = getFirebaseFirestore();
    if (!db) {
      setError("Firestore not available — cannot delete vendor.");
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION, vendorId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete vendor: ${message}`);
    }
  }, []);

  return (
    <VendorsContext.Provider
      value={{ vendors, loading, error, addVendor, editVendor, deleteVendor }}
    >
      {children}
    </VendorsContext.Provider>
  );
}

export const useVendors = () => useContext(VendorsContext);
