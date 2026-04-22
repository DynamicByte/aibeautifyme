// Admin authentication store - Supabase implementation

import { supabaseAdmin } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  token: string;
  created_at: Date;
  expires_at: Date;
}

function generateToken(): string {
  return `admin_${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}${Date.now().toString(36)}`;
}

class AdminStore {
  // Auth methods
  async authenticate(email: string, password: string): Promise<AdminUser | null> {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    // Update last login
    await supabaseAdmin
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    return this.mapAdminUser(data);
  }

  async createSession(adminId: string): Promise<AdminSession> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .insert({
        admin_id: adminId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      admin_id: data.admin_id,
      token: data.token,
      created_at: new Date(data.created_at),
      expires_at: new Date(data.expires_at),
    };
  }

  async getSessionByToken(token: string): Promise<AdminSession | null> {
    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      admin_id: data.admin_id,
      token: data.token,
      created_at: new Date(data.created_at),
      expires_at: new Date(data.expires_at),
    };
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapAdminUser(data);
  }

  async deleteSession(token: string): Promise<void> {
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('token', token);
  }

  // Admin user management
  async getAllAdmins(): Promise<AdminUser[]> {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapAdminUser);
  }

  async createAdmin(admin: { email: string; password: string; name: string; role?: 'admin' | 'super_admin' }): Promise<AdminUser> {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: admin.email.toLowerCase(),
        password_hash: admin.password,
        name: admin.name,
        role: admin.role || 'admin',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapAdminUser(data);
  }

  async updateAdmin(id: string, updates: Partial<{ email: string; name: string; role: string; is_active: boolean; password: string }>): Promise<AdminUser | null> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (updates.email) updateData.email = updates.email.toLowerCase();
    if (updates.name) updateData.name = updates.name;
    if (updates.role) updateData.role = updates.role;
    if (typeof updates.is_active === 'boolean') updateData.is_active = updates.is_active;
    if (updates.password) updateData.password_hash = updates.password;

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapAdminUser(data);
  }

  async deleteAdmin(id: string): Promise<boolean> {
    // First delete all sessions for this admin
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('admin_id', id);

    const { error } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', id);

    return !error;
  }

  private mapAdminUser(data: Record<string, unknown>): AdminUser {
    return {
      id: data.id as string,
      email: data.email as string,
      password_hash: data.password_hash as string,
      name: data.name as string,
      role: data.role as 'admin' | 'super_admin',
      is_active: data.is_active as boolean,
      last_login: data.last_login ? new Date(data.last_login as string) : undefined,
      created_at: new Date(data.created_at as string),
      updated_at: new Date(data.updated_at as string),
    };
  }
}

export const adminStore = new AdminStore();
