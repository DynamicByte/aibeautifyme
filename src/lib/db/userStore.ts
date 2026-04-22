// User/Member data store - Supabase implementation

import { supabaseAdmin } from './supabase';
import { UserAccount, UserRoutine, RoutineLog, UserStats, UserSession } from './userTypes';
import { RoutineStep } from '../types';

function generateToken(): string {
  return `${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}${Date.now().toString(36)}`;
}

class UserStore {
  // Auth methods
  async authenticate(email: string, password: string): Promise<UserAccount | null> {
    const { data, error } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password)
      .single();
    
    if (error || !data) return null;
    return this.mapUserAccount(data);
  }

  async createSession(userId: string): Promise<UserSession> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user_id: data.user_id,
      token: data.token,
      created_at: new Date(data.created_at),
      expires_at: new Date(data.expires_at),
    };
  }

  async getSessionByToken(token: string): Promise<UserSession | null> {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      user_id: data.user_id,
      token: data.token,
      created_at: new Date(data.created_at),
      expires_at: new Date(data.expires_at),
    };
  }

  // Synchronous version for middleware (checks cache or makes sync call)
  getSessionByTokenSync(token: string): UserSession | null {
    // For now, return null - middleware should use async version
    // This is a limitation we'll need to handle in the API routes
    return null;
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    const { data, error } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapUserAccount(data);
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const { data, error } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return null;
    return this.mapUserAccount(data);
  }

  async createUser(user: Omit<UserAccount, 'id' | 'created_at' | 'updated_at'>): Promise<UserAccount> {
    const { data, error } = await supabaseAdmin
      .from('user_accounts')
      .insert({
        email: user.email.toLowerCase(),
        password_hash: user.password_hash,
        name: user.name,
        customer_id: user.customer_id,
        skin_profile: user.skin_profile || {},
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapUserAccount(data);
  }

  async deleteSession(token: string): Promise<void> {
    await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('token', token);
  }

  // Routine methods
  async getRoutine(userId: string): Promise<UserRoutine | null> {
    const { data, error } = await supabaseAdmin
      .from('user_routines')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      user_id: data.user_id,
      steps: data.steps || [],
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  async updateRoutine(userId: string, steps: RoutineStep[]): Promise<UserRoutine> {
    const { data, error } = await supabaseAdmin
      .from('user_routines')
      .upsert({
        user_id: userId,
        steps,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user_id: data.user_id,
      steps: data.steps || [],
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  // Progress methods
  async getRoutineLogs(userId: string, startDate?: string, endDate?: string): Promise<RoutineLog[]> {
    let query = supabaseAdmin
      .from('routine_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map(log => ({
      id: log.id,
      user_id: log.user_id,
      date: log.date,
      completed_steps: log.completed_steps || [],
      created_at: new Date(log.created_at),
    }));
  }

  async logRoutineStep(userId: string, date: string, stepId: string, timeOfDay: 'AM' | 'PM'): Promise<RoutineLog> {
    // Get existing log for this date
    const { data: existing } = await supabaseAdmin
      .from('routine_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    const completedSteps = existing?.completed_steps || [];
    
    // Check if step already logged
    const alreadyLogged = completedSteps.find(
      (s: { step_id: string; time_of_day: string }) => s.step_id === stepId && s.time_of_day === timeOfDay
    );

    if (!alreadyLogged) {
      completedSteps.push({
        step_id: stepId,
        time_of_day: timeOfDay,
        completed_at: new Date().toISOString(),
      });
    }

    const { data, error } = await supabaseAdmin
      .from('routine_logs')
      .upsert({
        user_id: userId,
        date,
        completed_steps: completedSteps,
      }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;

    await this.updateStats(userId);

    return {
      id: data.id,
      user_id: data.user_id,
      date: data.date,
      completed_steps: data.completed_steps || [],
      created_at: new Date(data.created_at),
    };
  }

  async unlogRoutineStep(userId: string, date: string, stepId: string, timeOfDay: 'AM' | 'PM'): Promise<RoutineLog | null> {
    const { data: existing } = await supabaseAdmin
      .from('routine_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (!existing) return null;

    const completedSteps = (existing.completed_steps || []).filter(
      (s: { step_id: string; time_of_day: string }) => !(s.step_id === stepId && s.time_of_day === timeOfDay)
    );

    const { data, error } = await supabaseAdmin
      .from('routine_logs')
      .update({ completed_steps: completedSteps })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    await this.updateStats(userId);

    return {
      id: data.id,
      user_id: data.user_id,
      date: data.date,
      completed_steps: data.completed_steps || [],
      created_at: new Date(data.created_at),
    };
  }

  private async updateStats(userId: string): Promise<void> {
    const logs = await this.getRoutineLogs(userId);
    const routine = await this.getRoutine(userId);
    if (!routine) return;

    const amSteps = routine.steps.filter(s => s.timeOfDay === 'AM').length;
    const pmSteps = routine.steps.filter(s => s.timeOfDay === 'PM').length;

    if (amSteps === 0 && pmSteps === 0) return;

    // Sort logs by date descending
    const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

    // Calculate streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = today;

    for (const log of sortedLogs) {
      if (log.date === checkDate || log.date === this.getPreviousDate(checkDate)) {
        const amCompleted = log.completed_steps.filter(s => s.time_of_day === 'AM').length;
        const pmCompleted = log.completed_steps.filter(s => s.time_of_day === 'PM').length;

        if (amCompleted >= amSteps && pmCompleted >= pmSteps) {
          streak++;
          checkDate = this.getPreviousDate(log.date);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Calculate completion rates
    let totalAmCompleted = 0;
    let totalPmCompleted = 0;
    logs.forEach(log => {
      totalAmCompleted += log.completed_steps.filter(s => s.time_of_day === 'AM').length;
      totalPmCompleted += log.completed_steps.filter(s => s.time_of_day === 'PM').length;
    });

    const totalDays = logs.length || 1;
    const existingStats = await this.getStats(userId);

    const stats = {
      user_id: userId,
      current_streak: streak,
      longest_streak: Math.max(streak, existingStats?.longest_streak || 0),
      total_days_logged: logs.length,
      am_completion_rate: Math.round((totalAmCompleted / (amSteps * totalDays)) * 100),
      pm_completion_rate: Math.round((totalPmCompleted / (pmSteps * totalDays)) * 100),
      last_log_date: sortedLogs[0]?.date || null,
    };

    await supabaseAdmin
      .from('user_stats')
      .upsert(stats, { onConflict: 'user_id' });
  }

  private getPreviousDate(dateStr: string): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  async getStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return {
      user_id: data.user_id,
      current_streak: data.current_streak,
      longest_streak: data.longest_streak,
      total_days_logged: data.total_days_logged,
      am_completion_rate: data.am_completion_rate,
      pm_completion_rate: data.pm_completion_rate,
      last_log_date: data.last_log_date,
    };
  }

  // Profile methods
  async updateProfile(userId: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email.toLowerCase();
    if (updates.skin_profile) updateData.skin_profile = updates.skin_profile;

    const { data, error } = await supabaseAdmin
      .from('user_accounts')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapUserAccount(data);
  }

  private mapUserAccount(data: Record<string, unknown>): UserAccount {
    return {
      id: data.id as string,
      email: data.email as string,
      password_hash: data.password_hash as string,
      name: data.name as string,
      customer_id: data.customer_id as string | undefined,
      skin_profile: (data.skin_profile || {}) as UserAccount['skin_profile'],
      created_at: new Date(data.created_at as string),
      updated_at: new Date(data.updated_at as string),
    };
  }
}

export const userStore = new UserStore();
