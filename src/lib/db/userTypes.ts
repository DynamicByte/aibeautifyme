// User/Member database types

import { UserProfile, RoutineStep } from '../types';

export interface UserAccount {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  customer_id?: string;
  skin_profile: UserProfile;
  created_at: Date;
  updated_at: Date;
}

export interface UserRoutine {
  id: string;
  user_id: string;
  steps: RoutineStep[];
  created_at: Date;
  updated_at: Date;
}

export interface RoutineLogEntry {
  step_id: string;
  time_of_day: 'AM' | 'PM';
  completed_at: Date;
}

export interface RoutineLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed_steps: RoutineLogEntry[];
  created_at: Date;
}

export interface UserStats {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_days_logged: number;
  am_completion_rate: number;
  pm_completion_rate: number;
  last_log_date?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  created_at: Date;
  expires_at: Date;
}
