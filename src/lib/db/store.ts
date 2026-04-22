// Supabase data store
// Provides async methods for database operations

import { supabaseAdmin } from './supabase';
import {
  Customer,
  Order,
  OrderItem,
  Shipping,
  Notification,
  Settings,
  Reseller,
  TrackingEvent,
  RSProgramSignup,
} from './types';

// Generate unique IDs (fallback, Supabase uses UUID)
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = 'YR';
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${dateStr}${random}`;
}

// Supabase Store with async methods
class SupabaseStore {
  // Helper functions
  generateId = generateId;
  generateOrderNumber = generateOrderNumber;

  // ============ CUSTOMERS ============
  async getCustomer(id: string): Promise<Customer | null> {
    const { data } = await supabaseAdmin.from('customers').select('*').eq('id', id).single();
    return data;
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const { data } = await supabaseAdmin.from('customers').select('*').eq('email', email).single();
    return data;
  }

  async getAllCustomers(): Promise<Customer[]> {
    const { data } = await supabaseAdmin.from('customers').select('*').order('created_at', { ascending: false });
    return data || [];
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
    const { data } = await supabaseAdmin.from('customers').insert(customer).select().single();
    return data;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const { data } = await supabaseAdmin
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return data;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('customers').delete().eq('id', id);
    return !error;
  }

  // ============ ORDERS ============
  async getOrder(id: string): Promise<Order | null> {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();
    return data;
  }

  async getAllOrders(filters?: { status?: string; limit?: number }): Promise<Order[]> {
    let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    const { data } = await query;
    return data || [];
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order | null> {
    const { data } = await supabaseAdmin.from('orders').insert(order).select().single();
    return data;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const { data } = await supabaseAdmin
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return data;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('orders').delete().eq('id', id);
    return !error;
  }

  // ============ ORDER ITEMS ============
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data } = await supabaseAdmin.from('order_items').select('*').eq('order_id', orderId);
    return data || [];
  }

  async createOrderItems(items: Omit<OrderItem, 'id'>[]): Promise<OrderItem[]> {
    const { data } = await supabaseAdmin.from('order_items').insert(items).select();
    return data || [];
  }

  async deleteOrderItems(orderId: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
    return !error;
  }

  // ============ SHIPPING ============
  async getShipping(orderId: string): Promise<Shipping | null> {
    const { data } = await supabaseAdmin.from('shipping').select('*').eq('order_id', orderId).single();
    if (data) {
      data.tracking_history = data.tracking_history || [];
    }
    return data;
  }

  async getShippingByTracking(trackingNumber: string): Promise<Shipping | null> {
    const { data } = await supabaseAdmin.from('shipping').select('*').eq('tracking_number', trackingNumber).single();
    if (data) {
      data.tracking_history = data.tracking_history || [];
    }
    return data;
  }

  async getAllShipping(filters?: { status?: string; courier?: string }): Promise<Shipping[]> {
    let query = supabaseAdmin.from('shipping').select('*').order('updated_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.courier) query = query.ilike('courier', filters.courier);
    const { data } = await query;
    return (data || []).map((s) => ({ ...s, tracking_history: s.tracking_history || [] }));
  }

  async createShipping(shipping: Omit<Shipping, 'id' | 'created_at' | 'updated_at'>): Promise<Shipping | null> {
    const { data } = await supabaseAdmin
      .from('shipping')
      .insert({
        ...shipping,
        tracking_history: JSON.stringify(shipping.tracking_history || []),
      })
      .select()
      .single();
    if (data) {
      data.tracking_history = data.tracking_history || [];
    }
    return data;
  }

  async updateShipping(orderId: string, updates: Partial<Shipping>): Promise<Shipping | null> {
    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    if (updates.tracking_history) {
      updateData.tracking_history = updates.tracking_history;
    }
    const { data } = await supabaseAdmin
      .from('shipping')
      .update(updateData)
      .eq('order_id', orderId)
      .select()
      .single();
    if (data) {
      data.tracking_history = data.tracking_history || [];
    }
    return data;
  }

  async addTrackingEvent(orderId: string, event: TrackingEvent): Promise<Shipping | null> {
    const shipping = await this.getShipping(orderId);
    if (!shipping) return null;
    
    const history = [...(shipping.tracking_history || []), event];
    return this.updateShipping(orderId, { tracking_history: history });
  }

  async deleteShipping(orderId: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('shipping').delete().eq('order_id', orderId);
    return !error;
  }

  // ============ NOTIFICATIONS ============
  async getNotification(id: string): Promise<Notification | null> {
    const { data } = await supabaseAdmin.from('notifications').select('*').eq('id', id).single();
    return data;
  }

  async getAllNotifications(unreadOnly?: boolean): Promise<Notification[]> {
    let query = supabaseAdmin.from('notifications').select('*').order('created_at', { ascending: false });
    if (unreadOnly) query = query.eq('is_read', false);
    const { data } = await query;
    return data || [];
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification | null> {
    const { data } = await supabaseAdmin.from('notifications').insert(notification).select().single();
    return data;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', id);
    return !error;
  }

  async markAllNotificationsRead(): Promise<boolean> {
    const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).eq('is_read', false);
    return !error;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('notifications').delete().eq('id', id);
    return !error;
  }

  // ============ SETTINGS ============
  async getSetting(key: string): Promise<Settings | null> {
    const { data } = await supabaseAdmin.from('settings').select('*').eq('key', key).single();
    return data;
  }

  async getAllSettings(): Promise<Settings[]> {
    const { data } = await supabaseAdmin.from('settings').select('*');
    return data || [];
  }

  async upsertSetting(key: string, value: string, category: Settings['category']): Promise<Settings | null> {
    const { data } = await supabaseAdmin
      .from('settings')
      .upsert({ key, value, category, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();
    return data;
  }

  // ============ RESELLERS ============
  async getReseller(id: string): Promise<Reseller | null> {
    const { data } = await supabaseAdmin.from('resellers').select('*').eq('id', id).single();
    return data;
  }

  async getResellerByCode(code: string): Promise<Reseller | null> {
    const { data } = await supabaseAdmin.from('resellers').select('*').eq('referral_code', code).single();
    return data;
  }

  async getAllResellers(): Promise<Reseller[]> {
    const { data } = await supabaseAdmin.from('resellers').select('*').order('created_at', { ascending: false });
    return data || [];
  }

  async createReseller(reseller: Omit<Reseller, 'id' | 'created_at' | 'updated_at'>): Promise<Reseller | null> {
    const { data } = await supabaseAdmin.from('resellers').insert(reseller).select().single();
    return data;
  }

  async updateReseller(id: string, updates: Partial<Reseller>): Promise<Reseller | null> {
    const { data } = await supabaseAdmin
      .from('resellers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return data;
  }

  async deleteReseller(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('resellers').delete().eq('id', id);
    return !error;
  }

  // ============ DASHBOARD STATS ============
  async getDashboardStats() {
    const [orders, customers] = await Promise.all([
      this.getAllOrders(),
      this.getAllCustomers(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = orders.filter((o) => new Date(o.created_at) >= today);
    const pendingOrders = orders.filter((o) => o.status === 'pending');

    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    return {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      total_customers: customers.length,
      pending_orders: pendingOrders.length,
      orders_today: ordersToday.length,
      revenue_today: ordersToday.reduce((sum, o) => sum + Number(o.total_amount), 0),
      recent_orders: orders.slice(0, 10),
      orders_by_status: ordersByStatus,
    };
  }

  // ============ RS PROGRAM SIGNUPS ============
  async getAllRSProgramSignups(): Promise<RSProgramSignup[]> {
    const { data } = await supabaseAdmin
      .from('rs_program_signups')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  }

  async getRSProgramSignup(id: string): Promise<RSProgramSignup | null> {
    const { data } = await supabaseAdmin
      .from('rs_program_signups')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }

  async createRSProgramSignup(signup: Omit<RSProgramSignup, 'id' | 'created_at' | 'updated_at'>): Promise<RSProgramSignup> {
    const { data, error } = await supabaseAdmin
      .from('rs_program_signups')
      .insert(signup)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateRSProgramSignup(id: string, updates: Partial<RSProgramSignup>): Promise<RSProgramSignup | null> {
    const { data, error } = await supabaseAdmin
      .from('rs_program_signups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteRSProgramSignup(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('rs_program_signups')
      .delete()
      .eq('id', id);
    return !error;
  }
}

// Singleton instance
export const store = new SupabaseStore();
