import { AppData, Deposit } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  runTransaction 
} from 'firebase/firestore';

// --- CONFIGURATION REQUIRED ---
// 1. Go to console.firebase.google.com
// 2. Create a project > Add Web App
// 3. Copy the config object below
const firebaseConfig = {
  // apiKey: "AIzaSy...",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "...",
  // appId: "..."
};

// Check if config is set
const isConfigured = Object.keys(firebaseConfig).length > 0 && typeof (firebaseConfig as any).apiKey !== 'undefined';

let db: any;
if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  console.warn("Firebase not configured. App will use temporary in-memory data. Please update services/dataService.ts");
}

const COLLECTION = 'campaigns';
const DOC_ID = 'weather-relief-fund';

const INITIAL_DATA: AppData = {
  currentAmount: 0,
  goalAmount: 500000,
  donorCount: 0,
  recentDeposits: []
};

// Helper for offline/unconfigured mode
let mockMemoryData = { ...INITIAL_DATA };
let mockListeners: Function[] = [];

export const subscribeToData = (callback: (data: AppData) => void) => {
  if (!isConfigured) {
    // Fallback for when user hasn't added keys yet
    callback(mockMemoryData);
    mockListeners.push(callback);
    return () => { mockListeners = mockListeners.filter(l => l !== callback); };
  }

  const docRef = doc(db, COLLECTION, DOC_ID);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as AppData);
    } else {
      // Create initial document if it doesn't exist
      setDoc(docRef, INITIAL_DATA);
      callback(INITIAL_DATA);
    }
  }, (error) => {
    console.error("Data sync error:", error);
  });

  return unsubscribe;
};

export const addDeposit = async (amount: number, name: string): Promise<void> => {
  if (!isConfigured) {
    // Mock logic
    const newDeposit: Deposit = {
      id: Date.now(),
      amount: amount,
      name: name || 'Anonymous Donor',
      timestamp: new Date().toISOString()
    };
    mockMemoryData = {
      ...mockMemoryData,
      currentAmount: (mockMemoryData.currentAmount || 0) + amount,
      donorCount: (mockMemoryData.donorCount || 0) + 1,
      recentDeposits: [newDeposit, ...mockMemoryData.recentDeposits].slice(0, 10)
    };
    mockListeners.forEach(l => l(mockMemoryData));
    return;
  }

  const docRef = doc(db, COLLECTION, DOC_ID);

  // Use transaction to prevent race conditions (two people donating at same time)
  await runTransaction(db, async (transaction: any) => {
    const sfDoc = await transaction.get(docRef);
    if (!sfDoc.exists()) {
      transaction.set(docRef, INITIAL_DATA);
      throw new Error("Document didn't exist, created it. Please try again.");
    }

    const currentData = sfDoc.data() as AppData;
    const newTotal = (currentData.currentAmount || 0) + amount;
    const newCount = (currentData.donorCount || 0) + 1;
    
    const newDeposit: Deposit = {
      id: Date.now(),
      amount: amount,
      name: name || 'Anonymous Donor',
      timestamp: new Date().toISOString()
    };

    const updatedDeposits = [newDeposit, ...(currentData.recentDeposits || [])].slice(0, 10);

    transaction.update(docRef, {
      currentAmount: newTotal,
      donorCount: newCount,
      recentDeposits: updatedDeposits
    });
  });
};

export const updateGoal = async (newGoal: number): Promise<void> => {
  if (!isConfigured) {
    mockMemoryData = { ...mockMemoryData, goalAmount: newGoal };
    mockListeners.forEach(l => l(mockMemoryData));
    return;
  }
  const docRef = doc(db, COLLECTION, DOC_ID);
  await updateDoc(docRef, { goalAmount: newGoal });
};

export const manualOverrideTotal = async (newTotal: number): Promise<void> => {
  if (!isConfigured) {
    mockMemoryData = { ...mockMemoryData, currentAmount: newTotal };
    mockListeners.forEach(l => l(mockMemoryData));
    return;
  }
  const docRef = doc(db, COLLECTION, DOC_ID);
  await updateDoc(docRef, { currentAmount: newTotal });
};

// Mock Authentication (Keep strictly client-side for this demo)
export const mockLogin = async (pin: string): Promise<boolean> => {
  // Add a small delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 600));
  return pin === '2024';
};