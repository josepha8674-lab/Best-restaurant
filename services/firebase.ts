import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: 1. ไปที่ Firebase Console (https://console.firebase.google.com/)
// TODO: 2. สร้างโปรเจกต์ใหม่ หรือเลือกโปรเจกต์เดิม
// TODO: 3. ไปที่ Project Settings > General > Your apps > Web app
// TODO: 4. Copy config object มาแทนที่ค่าด้านล่างนี้
const firebaseConfig = {
  
    
apiKey: "AIzaSyD_QU48J67BHBanimIwhcBm7Bm14TI6bTU",
  authDomain: "best-restaurant-81c48.firebaseapp.com",
  projectId: "best-restaurant-81c48",
  storageBucket: "best-restaurant-81c48.firebasestorage.app",
  messagingSenderId: "829586612018",
  appId: "1:829586612018:web:504a4cb04f8bff6cc5412b",
  measurementId: "G-NEH0LTR8XQ"

  
};

// ตรวจสอบว่าได้ตั้งค่า Config หรือยัง
export const isFirebaseConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);