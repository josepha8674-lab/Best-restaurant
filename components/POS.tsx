import React, { useState } from 'react';
import { MenuItem, CartItem, Sale } from '../types';
import { ShoppingCart, Plus, Minus, CreditCard, Banknote, Trash } from 'lucide-react';

interface POSProps {
  menuItems: MenuItem[];
  onCheckout: (sale: Sale) => void;
}

const POS: React.FC<POSProps> = ({ menuItems, onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1, cartId: Date.now().toString() }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        return { ...c, qty: Math.max(1, c.qty + delta) };
      }
      return c;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const getTotal = () => cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const getTotalCost = () => cart.reduce((sum, item) => sum + (item.totalCost * item.qty), 0);

  const handlePayment = (method: 'cash' | 'qrcode') => {
    if (cart.length === 0) return;
    
    const sale: Sale = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      items: [...cart],
      totalAmount: getTotal(),
      totalCost: getTotalCost(),
      paymentMethod: method
    };

    onCheckout(sale);
    setCart([]);
    alert('บันทึกยอดขายเรียบร้อย!');
  };

  const filteredMenu = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(m => m.category === selectedCategory);

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 p-4 overflow-hidden">
      {/* Left: Menu Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Categories */}
        <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'main', 'appetizer', 'drink', 'dessert'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'ทั้งหมด' : 
               cat === 'main' ? 'อาหารจานหลัก' : 
               cat === 'appetizer' ? 'ของว่าง' :
               cat === 'drink' ? 'เครื่องดื่ม' : 'ของหวาน'}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMenu.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow text-left group flex flex-col justify-between h-32"
              >
                <div>
                  <div className="font-semibold text-gray-800 line-clamp-1">{item.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{item.category}</div>
                </div>
                <div className="mt-2 flex justify-between items-end">
                    <span className="font-bold text-emerald-600">{item.price} ฿</span>
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={16} />
                    </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <ShoppingCart size={20} /> รายการสั่งซื้อ
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-20" />
              <p>ยังไม่มีรายการ</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.price} x {item.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                       <Minus size={12} />
                   </button>
                   <span className="w-4 text-center text-sm font-medium">{item.qty}</span>
                   <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                       <Plus size={12} />
                   </button>
                   <div className="w-16 text-right font-semibold text-sm">{(item.price * item.qty).toFixed(0)}</div>
                   <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-1">
                       <Trash size={16} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-4">
          <div className="flex justify-between items-center text-xl font-bold text-gray-800">
            <span>ยอดรวม</span>
            <span>{getTotal().toFixed(2)} ฿</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handlePayment('cash')}
              disabled={cart.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Banknote size={20} />
              <span className="text-sm font-medium">เงินสด</span>
            </button>
            <button 
              onClick={() => handlePayment('qrcode')}
              disabled={cart.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <CreditCard size={20} />
              <span className="text-sm font-medium">QR / โอน</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;