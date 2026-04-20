import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with forceLongPolling to resolve connection issues in restricted environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

export async function testConnection() {
  try {
    // Attempt to read a dummy document with a timeout
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase connection established.");
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn("Firestore is temporarily unavailable. The app will work in offline mode and sync later.");
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Connection failed. Please check your internet or firewall settings.");
    }
    // Permission denied or Not found are acceptable connection signs
  }
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid || 'anonymous',
      email: user?.email || '',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || true,
      providerInfo: user?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || '',
      })) || [],
    }
  };
  
  throw new Error(JSON.stringify(errorInfo));
}
