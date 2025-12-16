import React, { useState, useEffect } from 'react';
import { Ingredient, MenuItem, RecipeItem } from '../types';
import { Plus, Trash2, Calculator, Sparkles, BrainCircuit, Wand2 } from 'lucide-react';
import { generateMenuDescription, analyzeProfitability, generateRecipe } from '../services/geminiService';

interface MenuEngineerProps {
  ingredients: Ingredient[];
  menuItems: MenuItem[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (id: string, item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onAddIngredient: (ing: Ingredient) => void;
}

const MenuEngineer: React.FC<MenuEngineerProps> = ({ 
    ingredients, 
    menuItems, 
    onAddMenuItem, 
    onUpdateMenuItem, 
    onDeleteMenuItem,
    onAddIngredient
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: 'main',
    description: '',
    recipe: [],
    totalCost: 0
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Recalculate cost whenever recipe changes
  useEffect(() => {
    if (!currentMenu.recipe) return;
    const cost = currentMenu.recipe.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return total;
      return total + (ing.pricePerUnit * item.quantity);
    }, 0);
    setCurrentMenu(prev => ({ ...prev, totalCost: cost }));
  }, [currentMenu.recipe, ingredients]);

  const addIngredientToRecipe = (ingId: string) => {
    const existing = currentMenu.recipe?.find(r => r.ingredientId === ingId);
    if (existing) return;

    const newRecipe = [...(currentMenu.recipe || []), { ingredientId: ingId, quantity: 1 }];
    setCurrentMenu({ ...currentMenu, recipe: newRecipe });
  };

  const updateQuantity = (ingId: string, qty: number) => {
    const newRecipe = currentMenu.recipe?.map(r =>
      r.ingredientId === ingId ? { ...r, quantity: qty } : r
    );
    setCurrentMenu({ ...currentMenu, recipe: newRecipe });
  };

  const removeIngredient = (ingId: string) => {
    const newRecipe = currentMenu.recipe?.filter(r => r.ingredientId !== ingId);
    setCurrentMenu({ ...currentMenu, recipe: newRecipe });
  };

  const handleSave = () => {
    if (!currentMenu.name || !currentMenu.price) return;
    
    const newItem = {
      ...currentMenu,
      id: currentMenu.id || Date.now().toString(),
    } as MenuItem;

    if (currentMenu.id) {
        onUpdateMenuItem(currentMenu.id, newItem);
    } else {
        onAddMenuItem(newItem);
    }
    
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setCurrentMenu({ name: '', price: 0, category: 'main', description: '', recipe: [], totalCost: 0 });
    setAiAnalysis(null);
  };

  const handleGenerateDescription = async () => {
    if (!currentMenu.name) return;
    setAiLoading(true);
    const ingNames = currentMenu.recipe?.map(r => ingredients.find(i => i.id === r.ingredientId)?.name || '') || [];
    const desc = await generateMenuDescription(currentMenu.name, ingNames);
    setCurrentMenu(prev => ({ ...prev, description: desc }));
    setAiLoading(false);
  };

  const handleGenerateRecipe = async () => {
      if (!currentMenu.name) {
          alert("กรุณาใส่ชื่อเมนูก่อน");
          return;
      }
      setAiLoading(true);
      const result = await generateRecipe(currentMenu.name);
      
      if (result) {
          // 1. Set Description
          const newDescription = result.description;
          
          // 2. Process Ingredients
          const newRecipeItems: RecipeItem[] = [];
          
          result.ingredients.forEach(aiIng => {
              // Try to find existing ingredient (fuzzy match by name)
              let match = ingredients.find(i => i.name.toLowerCase().includes(aiIng.name.toLowerCase()) || aiIng.name.toLowerCase().includes(i.name.toLowerCase()));
              
              if (match) {
                  // Use existing
                  newRecipeItems.push({
                      ingredientId: match.id,
                      quantity: aiIng.quantityForDish
                  });
              } else {
                  // Create new ingredient and save to DB immediately
                  const newIng: Ingredient = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                      name: aiIng.name,
                      unit: aiIng.unit,
                      pricePerUnit: aiIng.marketPricePerUnit
                  };
                  onAddIngredient(newIng); // Save to DB
                  
                  newRecipeItems.push({
                      ingredientId: newIng.id,
                      quantity: aiIng.quantityForDish
                  });
              }
          });

          // Update Form State
          setCurrentMenu(prev => ({
              ...prev,
              description: newDescription,
              recipe: newRecipeItems
          }));
      } else {
          alert("ไม่สามารถสร้างสูตรได้ กรุณาลองใหม่");
      }
      setAiLoading(false);
  };

  const handleAnalyze = async () => {
      if(!currentMenu.price || !currentMenu.totalCost) return;
      setAiLoading(true);
      const analysis = await analyzeProfitability(currentMenu as MenuItem);
      setAiAnalysis(analysis);
      setAiLoading(false);
  }

  const handleDeleteMenu = (id: string) => {
      if(confirm('ยืนยันการลบเมนู?')) {
          onDeleteMenuItem(id);
      }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">ออกแบบเมนู & คำนวณต้นทุน</h2>
        {!isEditing && (
          <button
            onClick={() => { setIsEditing(true); resetForm(); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus size={20} /> สร้างเมนูใหม่
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-lg text-gray-700">รายละเอียดเมนู</h3>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">ยกเลิก</button>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเมนู</label>
                <div className="flex gap-2">
                    <input
                    type="text"
                    value={currentMenu.name}
                    onChange={e => setCurrentMenu({ ...currentMenu, name: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="เช่น ผัดกะเพราหมูสับ"
                    />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท)</label>
                  <input
                    type="number"
                    value={currentMenu.price || ''}
                    onChange={e => setCurrentMenu({ ...currentMenu, price: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                  <select
                    value={currentMenu.category}
                    onChange={e => setCurrentMenu({ ...currentMenu, category: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="main">จานหลัก</option>
                    <option value="appetizer">ของว่าง</option>
                    <option value="drink">เครื่องดื่ม</option>
                    <option value="dessert">ของหวาน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>คำอธิบาย</span>
                    <button 
                        onClick={handleGenerateDescription}
                        disabled={aiLoading || !currentMenu.name}
                        className="text-xs text-purple-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                        <Sparkles size={12}/> AI ช่วยเขียน
                    </button>
                </label>
                <textarea
                  value={currentMenu.description}
                  onChange={e => setCurrentMenu({ ...currentMenu, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                  placeholder="รายละเอียดเมนู..."
                />
              </div>
            </div>

            {/* Right: Recipe & Cost */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      สูตรอาหาร (วัตถุดิบ)
                      <button 
                        onClick={handleGenerateRecipe}
                        disabled={aiLoading || !currentMenu.name}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                          <Wand2 size={12} /> AI คิดสูตรให้
                      </button>
                  </h4>
                  <div className="text-sm">
                      <select 
                        className="p-1 border rounded text-gray-600 text-sm max-w-[150px]"
                        onChange={(e) => {
                            if(e.target.value) {
                                addIngredientToRecipe(e.target.value);
                                e.target.value = "";
                            }
                        }}
                      >
                          <option value="">+ เพิ่มวัตถุดิบ</option>
                          {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                          ))}
                      </select>
                  </div>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-[300px] overflow-y-auto">
                 {currentMenu.recipe?.length === 0 ? (
                     <div className="text-center py-8">
                         <p className="text-gray-400 text-sm">ยังไม่มีวัตถุดิบในสูตร</p>
                         <button 
                            onClick={handleGenerateRecipe}
                            disabled={aiLoading || !currentMenu.name}
                            className="mt-2 text-purple-600 text-xs hover:underline disabled:opacity-50"
                         >
                             ลองให้ AI ช่วยคิดสูตรสิ
                         </button>
                     </div>
                 ) : (
                     currentMenu.recipe?.map((item, idx) => {
                         const ing = ingredients.find(i => i.id === item.ingredientId);
                         if (!ing) return null;
                         const cost = item.quantity * ing.pricePerUnit;
                         return (
                             <div key={idx} className="flex justify-between items-center mb-3 bg-white p-2 rounded shadow-sm">
                                 <div className="flex-1">
                                     <div className="text-sm font-medium">{ing.name}</div>
                                     <div className="text-xs text-gray-500">{ing.pricePerUnit} บ./{ing.unit}</div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <input 
                                        type="number" 
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.ingredientId, parseFloat(e.target.value))}
                                        className="w-16 p-1 text-sm border rounded text-center"
                                     />
                                     <span className="text-xs text-gray-500 w-8">{ing.unit}</span>
                                     <span className="text-sm font-semibold w-16 text-right text-gray-700">{cost.toFixed(2)}</span>
                                     <button onClick={() => removeIngredient(item.ingredientId)} className="text-red-400 hover:text-red-600">
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             </div>
                         )
                     })
                 )}
              </div>

              {/* Cost Summary */}
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 space-y-2">
                 <div className="flex justify-between text-sm">
                     <span className="text-gray-600">ต้นทุนวัตถุดิบรวม:</span>
                     <span className="font-semibold text-gray-800">{currentMenu.totalCost?.toFixed(2)} บาท</span>
                 </div>
                 <div className="flex justify-between text-sm">
                     <span className="text-gray-600">ราคาขาย:</span>
                     <span className="font-semibold text-gray-800">{currentMenu.price?.toFixed(2)} บาท</span>
                 </div>
                 <div className="h-px bg-emerald-200 my-2"></div>
                 <div className="flex justify-between items-center">
                     <span className="text-emerald-800 font-medium">กำไรขั้นต้น (Margin):</span>
                     <div className="text-right">
                         <span className={`text-lg font-bold ${
                             ((currentMenu.price || 0) - (currentMenu.totalCost || 0)) > 0 ? 'text-emerald-600' : 'text-red-500'
                         }`}>
                             {((currentMenu.price || 0) - (currentMenu.totalCost || 0)).toFixed(2)} บาท
                         </span>
                         <div className="text-xs text-gray-500">
                             {currentMenu.price ? (((currentMenu.price - (currentMenu.totalCost || 0)) / currentMenu.price) * 100).toFixed(1) : 0}%
                         </div>
                     </div>
                 </div>
                 
                 <div className="pt-2 flex justify-end">
                    <button 
                        onClick={handleAnalyze}
                        disabled={aiLoading || !currentMenu.price}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200 disabled:opacity-50"
                    >
                        <BrainCircuit size={14} /> วิเคราะห์ความคุ้มค่า
                    </button>
                 </div>
                 {aiAnalysis && (
                     <div className="mt-2 text-xs bg-white p-2 rounded border border-purple-100 text-purple-800 italic animate-fade-in">
                         <span className="font-bold">AI Advisor:</span> {aiAnalysis}
                     </div>
                 )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">ยกเลิก</button>
              <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-sm font-medium">บันทึกเมนู</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => {
              const profit = item.price - item.totalCost;
              const margin = item.price ? (profit / item.price) * 100 : 0;
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{item.category}</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{item.description || 'ไม่มีคำอธิบาย'}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg mb-4">
                            <div>
                                <span className="block text-gray-500 text-xs">ราคาขาย</span>
                                <span className="font-semibold text-gray-800">{item.price} บ.</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs">ต้นทุน</span>
                                <span className="font-semibold text-red-500">{item.totalCost.toFixed(1)} บ.</span>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-gray-500 text-xs">Margin</span>
                                <span className={`font-bold ${margin > 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {margin.toFixed(1)}% ({profit.toFixed(1)} บ.)
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => { setCurrentMenu(item); setIsEditing(true); }}
                                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded text-sm hover:bg-blue-100 font-medium"
                            >
                                แก้ไข
                            </button>
                            <button 
                                onClick={() => handleDeleteMenu(item.id)}
                                className="bg-red-50 text-red-500 px-3 py-2 rounded hover:bg-red-100"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuEngineer;