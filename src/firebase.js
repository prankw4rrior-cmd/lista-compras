import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBKXPQhj1umJJ0H4welHGsnFYAmFXaukE",
  authDomain: "lista-compras-d952c.firebaseapp.com",
  projectId: "lista-compras-d952c",
  storageBucket: "lista-compras-d952c.firebasestorage.app",
  messagingSenderId: "508247762053",
  appId: "1:508247762053:web:55951ffd6256919d8bb5ec",
  measurementId: "G-4F2WKFBFCN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const COLLECTION = "app_data";

export async function fbGet(key) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, key));
    return snap.exists() ? snap.data().value : null;
  } catch { return null; }
}

export async function fbSet(key, value) {
  try {
    await setDoc(doc(db, COLLECTION, key), { value, updatedAt: Date.now() });
  } catch (e) { console.error("fbSet error", e); }
}

export function fbListen(key, callback) {
  return onSnapshot(doc(db, COLLECTION, key), (snap) => {
    if (snap.exists()) callback(snap.data().value);
  });
}
