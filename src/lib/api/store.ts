import { apiGet, apiPost } from '../apiClient';

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  price_currency: 'httn_points' | 'httn_tokens' | 'espees';
  image_url: string | null;
  stock: number;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  items: { id: string; name: string; price: number; priceType: string }[];
  total_amount: number;
  payment_type: string;
  status: string;
  created_at: string;
};

/** List all store products */
export const getStoreProducts = async () => {
  return apiGet<Product[] | { data: Product[] }>('/store/products/');
};

/** Checkout / place an order */
export const storeCheckout = async (payload: {
  items: { product_id: string; quantity?: number }[];
  payment_type?: string;
}) => {
  return apiPost<Order>('/store/checkout/', { body: payload });
};

/** Get current user's orders */
export const getMyOrders = async () => {
  return apiGet<Order[] | { data: Order[] }>('/store/orders/me/');
};
