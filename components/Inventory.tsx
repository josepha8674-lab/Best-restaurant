import React, { useState } from 'react';
import { Ingredient } from '../types';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

interface InventoryProps {
  ingredients: Ingredient[];
  onAddIngredient: (ing: Ingredient) => void;
  onUpdateIngredient: (id: string, data: Partial<Ingredient>) => void;
  onDeleteIngredient: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ ingredients, onAddIngredient, onUpdateIngredient, onDeleteIngredient }) => {
  const [newIng, setNewIng] = useState<Partial<Ingredient>>({ name: '', unit: 'kg', pricePerUnit: 0 });
  
  // State for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

  const handleAdd = () => {
    if (!newIng.name || !newIng.pricePerUnit) return;
    const id = Date.now().toString(); // Temporary ID, could be handled by DB
    onAddIngredient({ ...newIng, id } as Ingredient);
    setNewIng({ name: '', unit: 'kg', pricePerUnit: 0 });
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบวัตถุดิบนี้ใช่หรือไม่? หากลบแล้ว สูตรอาหารที่ใช้วัตถุดิบนี้อาจมีผลกระทบ')) {
      onDeleteIngredient(id);
    }
  };

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditForm({ ...ing });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId || !editForm.name || editForm.pricePerUnit === undefined) return;
    onUpdateIngredient(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">จัดการวัตถุดิบ (Inventory)</h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวัตถุดิบ</label>
          <input
            type="text"
            value={newIng.name}
            onChange={(e) => setNewIng({ ...newIng, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="เช่น เนื้อวัว, ไข่ไก่"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย (Unit)</label>
          <select
            value={newIng.unit}
            onChange={(e) => setNewIng({ ...newIng, unit: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="kg">กิโลกรัม (kg)</option>
            <option value="g">กรัม (g)</option>
            <option value="l">ลิตร (L)</option>
            <option value="ml">มิลลิลิตร (ml)</option>
            <option value="pcs">ชิ้น/ฟอง (pcs)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหน่วย (บาท)</label>
          <input
            type="number"
            value={newIng.pricePerUnit || ''}
            onChange={(e) => setNewIng({ ...newIng, pricePerUnit: parseFloat(e.target.value) })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="0.00"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <Plus size={18} /> เพิ่มวัตถุดิบ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600 w-1/3">ชื่อวัตถุดิบ</th>
              <th className="p-4 font-semibold text-gray-600 w-1/6">หน่วย</th>
              <th className="p-4 font-semibold text-gray-600 w-1/4">ราคา/หน่วย</th>
              <th className="p-4 font-semibold text-gray-600 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  ยังไม่มีวัตถุดิบ เริ่มต้นด้วยการเพิ่มรายการด้านบน
                </td>
              </tr>
            ) : (
              ingredients.map((ing) => (
                <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {editingId === ing.id ? (
                    // Edit Mode
                    <>
                      <td className="p-3">
                        <input 
                          type="text" 
                          className="w-full p-1 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editForm.name}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                        />
                      </td>
                      <td className="p-3">
                        <select
                          className="w-full p-1 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editForm.unit}
                          onChange={e => setEditForm({...editForm, unit: e.target.value})}
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">L</option>
                          <option value="ml">ml</option>
                          <option value="pcs">pcs</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          className="w-full p-1 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editForm.pricePerUnit}
                          onChange={e => setEditForm({...editForm, pricePerUnit: parseFloat(e.target.value)})}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={saveEdit} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded" title="บันทึก">
                            <Check size={18} />
                          </button>
                          <button onClick={cancelEdit} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded" title="ยกเลิก">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <td className="p-4 font-medium text-gray-800">{ing.name}</td>
                      <td className="p-4 text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{ing.unit}</span>
                      </td>
                      <td className="p-4 text-gray-600 font-medium">{ing.pricePerUnit.toLocaleString()} บาท</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(ing)}
                            className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50 transition-colors"
                            title="แก้ไข"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(ing.id)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;