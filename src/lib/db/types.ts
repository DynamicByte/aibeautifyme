// Database types - designed for PostgreSQL/Supabase compatibility

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ShippingStatus = 'preparing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
export type NotificationType = 'order' | 'shipping' | 'customer' | 'system';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  referrer_id?: string;
  referrer_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Shipping {
  id: string;
  order_id: string;
  courier: string;
  tracking_number: string;
  status: ShippingStatus;
  estimated_delivery?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  tracking_history: TrackingEvent[];
  created_at: Date;
  updated_at: Date;
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  is_read: boolean;
  created_at: Date;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  category: 'general' | 'shipping' | 'payment' | 'notification';
  updated_at: Date;
}

export interface Reseller {
  id: string;
  name: string;
  referral_code: string;
  total_referrals: number;
  total_revenue: number;
  created_at: Date;
  updated_at: Date;
}

export interface RSProgramSignup {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  package_name: string;
  package_price: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  pending_orders: number;
  orders_today: number;
  revenue_today: number;
  recent_orders: Order[];
  orders_by_status: Record<OrderStatus, number>;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
