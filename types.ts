export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  recipe: RecipeItem[];
  totalCost: number; // Calculated field
}

export interface CartItem extends MenuItem {
  cartId: string;
  qty: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  totalAmount: number;
  totalCost: number;
  paymentMethod: 'cash' | 'qrcode';
}

export type ViewState = 'dashboard' | 'pos' | 'menu' | 'inventory';

export interface SalesSummary {
  revenue: number;
  cost: number;
  profit: number;
  count: number;
}