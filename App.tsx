import React, { useState, useEffect } from 'react';
import { ViewState, Ingredient, MenuItem, Sale } from './types';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import MenuEngineer from './components/MenuEngineer';
import Inventory from './components/Inventory';
import { LayoutDashboard, Store, UtensilsCrossed, PackageSearch, ChefHat, Menu, X, Database, AlertTriangle, Settings, Lock } from 'lucide-react';

// Firebase Imports
import { db, isFirebaseConfigured } from './services/firebase';
import { collection, onSnapshot, addDoc, setDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Error States
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // --- Firebase Listeners (Real-time Sync) ---
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    // Error handler for snapshots
    const handleSnapshotError = (err: any) => {
      console.error("Firestore Error:", err);
      
      if (err.code === 'permission-denied') {
         setPermissionDenied(true);
         setLoading(false);
      } else if (err.code === 'resource-exhausted') {
         setError(`Quota exceeded: ${err.message}`);
         setLoading(false);
      } else {
         // For other errors, we might want to keep the old data visible but show a toast/banner
         // But for now, let's stop loading to show the UI (potentially with stale data if any)
         // or show a global error if it's critical.
         setError(`Connection error: ${err.message}`);
         setLoading(false);
      }
    };

    // 1. Ingredients
    const unsubscribeIng = onSnapshot(
      collection(db, "ingredients"), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
        setIngredients(data);
      },
      handleSnapshotError
    );

    // 2. Menu Items
    const unsubscribeMenu = onSnapshot(
      collection(db, "menuItems"), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
        setMenuItems(data);
      },
      handleSnapshotError
    );

    // 3. Sales
    const q = query(collection(db, "sales"), orderBy("timestamp", "desc"));
    const unsubscribeSales = onSnapshot(
      q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));
        setSales(data);
        setLoading(false); // Data loaded successfully
      },
      handleSnapshotError
    );

    return () => {
      unsubscribeIng();
      unsubscribeMenu();
      unsubscribeSales();
    };
  }, []);

  // --- CRUD Operations Handlers ---

  // Ingredients
  const handleAddIngredient = async (ing: Ingredient) => {
    if (!isFirebaseConfigured) return;
    try {
        if (ing.id) {
            await setDoc(doc(db, "ingredients", ing.id), ing);
        } else {
            await addDoc(collection(db, "ingredients"), ing);
        }
    } catch (e: any) {
        if (e.code === 'permission-denied') setPermissionDenied(true);
    }
  };

  const handleUpdateIngredient = async (id: string, data: Partial<Ingredient>) => {
    if (!isFirebaseConfigured) return;
    try {
        const ref = doc(db, "ingredients", id);
        await updateDoc(ref, data);
    } catch (e: any) {
        if (e.code === 'permission-denied') setPermissionDenied(true);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!isFirebaseConfigured) return;
    try {
        await deleteDoc(doc(db, "ingredients", id));
    } catch (e: any) {
        if (e.code === 'permission-denied') setPermissionDenied(true);
    }
  };

  // Menu Items
  const handleAddMenuItem = async (item: MenuItem) => {
      if (!isFirebaseConfigured) return;
      try {
          if (item.id) {
              await setDoc(doc(db, "menuItems", item.id), item);
          } else {
              await addDoc(collection(db, "menuItems"), item);
          }
      } catch (e: any) {
          if (e.code === 'permission-denied') setPermissionDenied(true);
      }
  };

  const handleUpdateMenuItem = async (id: string, item: MenuItem) => {
      if (!isFirebaseConfigured) return;
      try {
          await setDoc(doc(db, "menuItems", id), item);
      } catch (e: any) {
          if (e.code === 'permission-denied') setPermissionDenied(true);
      }
  };

  const handleDeleteMenuItem = async (id: string) => {
      if (!isFirebaseConfigured) return;
      try {
          await deleteDoc(doc(db, "menuItems", id));
      } catch (e: any) {
          if (e.code === 'permission-denied') setPermissionDenied(true);
      }
  };

  // Sales
  const handleNewSale = async (sale: Sale) => {
      if (!isFirebaseConfigured) return;
      try {
          if(sale.id) {
              await setDoc(doc(db, "sales", sale.id), sale);
          } else {
              await addDoc(collection(db, "sales"), sale);
          }
      } catch (e: any) {
          if (e.code === 'permission-denied') setPermissionDenied(true);
      }
  };

  // --- Navigation Item Component ---
  const NavItem = ({ id, label, icon: Icon }: { id: ViewState, label: string, icon: any }) => (
    <button
      onClick={() => {
        setView(id);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        view === id 
          ? 'bg-emerald-600 text-white shadow-md font-medium' 
          : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  // --- Render Configuration Alert ---
  if (!isFirebaseConfigured) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-200">
          <div className="flex items-center gap-4 mb-6 text-amber-600">
            <div className="bg-amber-100 p-3 rounded-full">
               <Settings size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">กรุณาตั้งค่า Firebase ก่อนใช้งาน</h1>
          </div>
          
          <div className="space-y-4 text-gray-600">
            <p className="text-lg">ระบบต้องการการเชื่อมต่อฐานข้อมูลเพื่อทำงาน ท่านต้องระบุค่า Config ในไฟล์ <code>services/firebase.ts</code></p>
            {/* Steps omitted for brevity as they are same as before */}
          </div>
        </div>
      </div>
    );
  }

  // --- Render Permission Denied Error ---
  if (permissionDenied) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-200 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">สิทธิ์การเข้าถึงถูกปฏิเสธ (Permission Denied)</h1>
          <p className="text-gray-600 mb-6">
            แอปพลิเคชันเชื่อมต่อกับ Firebase ได้แล้ว แต่ถูกบล็อกโดย Security Rules
          </p>
          
          <div className="bg-gray-50 text-left p-6 rounded-lg border border-gray-200 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">วิธีแก้ไข (สำหรับ Development Mode):</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
              <li>ไปที่ <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">Firebase Console</a> &gt; Firestore Database &gt; <strong>Rules</strong></li>
              <li>เปลี่ยนโค้ด Rules เป็น:
                <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 overflow-x-auto text-xs font-mono">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
              </li>
              <li>กดปุ่ม <strong>Publish</strong></li>
            </ol>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} />
              คำเตือน: การตั้งค่านี้จะทำให้ทุกคนสามารถแก้ไขข้อมูลได้ ควรใช้สำหรับการทดสอบเท่านั้น
            </p>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            ตั้งค่าเสร็จแล้ว (Refresh)
          </button>
        </div>
      </div>
    );
  }

  // --- Render General Error State ---
  if (error) {
     return (
        <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        </div>
     );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
                <ChefHat size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Restaurant OS</h1>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <Database size={10} /> Online Mode
                </p>
            </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem id="dashboard" label="ภาพรวม (Dashboard)" icon={LayoutDashboard} />
          <NavItem id="pos" label="ขายหน้าร้าน (POS)" icon={Store} />
          <NavItem id="menu" label="จัดการเมนู & ต้นทุน" icon={UtensilsCrossed} />
          <NavItem id="inventory" label="คลังวัตถุดิบ" icon={PackageSearch} />
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white">
                <p className="text-xs opacity-70 mb-1">Powered by</p>
                <div className="font-semibold flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                   Gemini AI
                </div>
            </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col animate-slide-in-left" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-600 p-2 rounded-lg text-white">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Restaurant OS</h1>
                    </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <NavItem id="dashboard" label="ภาพรวม (Dashboard)" icon={LayoutDashboard} />
              <NavItem id="pos" label="ขายหน้าร้าน (POS)" icon={Store} />
              <NavItem id="menu" label="จัดการเมนู & ต้นทุน" icon={UtensilsCrossed} />
              <NavItem id="inventory" label="คลังวัตถุดิบ" icon={PackageSearch} />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
          {/* Mobile Header */}
          <header className="md:hidden bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10 relative">
              <div className="flex items-center gap-2">
                  <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
                        <ChefHat size={20} />
                    </div>
                  <span className="font-bold text-gray-800">Restaurant OS</span>
              </div>
              <button 
                className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                  <Menu size={24} />
              </button>
          </header>

          <div className="flex-1 overflow-auto bg-gray-50/50">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>กำลังเชื่อมต่อฐานข้อมูล...</p>
                </div>
            ) : (
                <>
                    {view === 'dashboard' && <Dashboard sales={sales} />}
                    {view === 'pos' && <POS menuItems={menuItems} onCheckout={handleNewSale} />}
                    {view === 'menu' && (
                        <MenuEngineer 
                            ingredients={ingredients} 
                            menuItems={menuItems} 
                            onAddMenuItem={handleAddMenuItem}
                            onUpdateMenuItem={handleUpdateMenuItem}
                            onDeleteMenuItem={handleDeleteMenuItem}
                            onAddIngredient={handleAddIngredient}
                        />
                    )}
                    {view === 'inventory' && (
                        <Inventory 
                            ingredients={ingredients} 
                            onAddIngredient={handleAddIngredient}
                            onUpdateIngredient={handleUpdateIngredient}
                            onDeleteIngredient={handleDeleteIngredient}
                        />
                    )}
                </>
            )}
          </div>
      </main>
    </div>
  );
};

export default App;