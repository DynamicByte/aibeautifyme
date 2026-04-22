'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RoutineStep } from '@/lib/types';
import { UserStats, RoutineLog } from '@/lib/db/userTypes';

interface DashboardData {
  routine: { steps: RoutineStep[] } | null;
  stats: UserStats | null;
  todayLog: RoutineLog | null;
}

export default function AccountDashboard() {
  const [data, setData] = useState<DashboardData>({ routine: null, stats: null, todayLog: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routineRes, progressRes] = await Promise.all([
          fetch('/api/account/routine'),
          fetch('/api/account/progress'),
        ]);
        
        const routineData = await routineRes.json();
        const progressData = await progressRes.json();
        
        const today = new Date().toISOString().split('T')[0];
        const todayLog = progressData.data?.logs?.find((l: RoutineLog) => l.date === today) || null;
        
        setData({
          routine: routineData.data,
          stats: progressData.data?.stats,
          todayLog,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCompletionStatus = (timeOfDay: 'AM' | 'PM') => {
    if (!data.routine || !data.todayLog) return { completed: 0, total: 0 };
    const steps = data.routine.steps.filter(s => s.timeOfDay === timeOfDay);
    const completed = data.todayLog.completed_steps.filter(s => s.time_of_day === timeOfDay).length;
    return { completed, total: steps.length };
  };

  const amStatus = getCompletionStatus('AM');
  const pmStatus = getCompletionStatus('PM');

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-1">Welcome Back!</h1>
        <p className="text-text-3">Track your skincare journey and stay consistent</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/20 text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-1">{data.stats?.current_streak || 0}</p>
              <p className="text-sm text-text-3">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-1">{amStatus.completed}/{amStatus.total}</p>
              <p className="text-sm text-text-3">AM Routine</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-1">{pmStatus.completed}/{pmStatus.total}</p>
              <p className="text-sm text-text-3">PM Routine</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-1">{data.stats?.total_days_logged || 0}</p>
              <p className="text-sm text-text-3">Days Logged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Routine */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-1">Today&apos;s Routine</h2>
            <Link href="/account/routine" className="text-sm text-purple-400 hover:text-purple-300">
              View Full Routine
            </Link>
          </div>
          <div className="p-4">
            {/* AM Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-1">Morning Routine</span>
                <span className="text-sm text-text-3">{amStatus.completed}/{amStatus.total} steps</span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${amStatus.total ? (amStatus.completed / amStatus.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* PM Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-1">Evening Routine</span>
                <span className="text-sm text-text-3">{pmStatus.completed}/{pmStatus.total} steps</span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${pmStatus.total ? (pmStatus.completed / pmStatus.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <Link
              href="/account/routine"
              className="block w-full py-2 text-center bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition"
            >
              Log Today&apos;s Routine
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-1">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-3">
            <Link
              href="/account/routine/assistant"
              className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg hover:bg-surface-3 transition"
            >
              <div className="p-2 bg-purple-700/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-text-1 text-sm">Ask Routine Assistant</p>
                <p className="text-xs text-text-3">Get help with your routine</p>
              </div>
            </Link>

            <Link
              href="/account/progress"
              className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg hover:bg-surface-3 transition"
            >
              <div className="p-2 bg-green-700/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-text-1 text-sm">View Progress</p>
                <p className="text-xs text-text-3">Check your consistency</p>
              </div>
            </Link>

            <Link
              href="/account/orders"
              className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg hover:bg-surface-3 transition"
            >
              <div className="p-2 bg-blue-700/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-text-1 text-sm">My Orders</p>
                <p className="text-xs text-text-3">Track your purchases</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
