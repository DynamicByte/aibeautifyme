'use client';

import { useEffect, useState } from 'react';
import { RoutineLog, UserStats } from '@/lib/db/userTypes';

export default function ProgressPage() {
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [todayStr, setTodayStr] = useState('');

  // Initialize date on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentMonth(new Date());
    setTodayStr(new Date().toISOString().split('T')[0]);
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/account/progress');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getLogForDate = (dateStr: string) => {
    return logs.find(l => l.date === dateStr);
  };

  const getDateStatus = (dateStr: string) => {
    const log = getLogForDate(dateStr);
    if (!log) return 'none';
    const amCompleted = log.completed_steps.filter(s => s.time_of_day === 'AM').length;
    const pmCompleted = log.completed_steps.filter(s => s.time_of_day === 'PM').length;
    if (amCompleted >= 5 && pmCompleted >= 5) return 'complete';
    if (amCompleted > 0 || pmCompleted > 0) return 'partial';
    return 'none';
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      if (!prev) return new Date();
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  if (isLoading || !currentMonth) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-1">Progress Tracker</h1>
        <p className="text-text-3">Track your skincare consistency</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-400">{stats?.current_streak || 0}</p>
          <p className="text-sm text-text-3">Current Streak</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{stats?.longest_streak || 0}</p>
          <p className="text-sm text-text-3">Longest Streak</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{stats?.am_completion_rate || 0}%</p>
          <p className="text-sm text-text-3">AM Completion</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-indigo-400">{stats?.pm_completion_rate || 0}%</p>
          <p className="text-sm text-text-3">PM Completion</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-surface-1 border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-surface-2 rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="font-semibold text-text-1">{monthName}</h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-surface-2 rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs text-text-3 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for starting day offset */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = getDateStatus(dateStr);
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm transition ${
                    status === 'complete'
                      ? 'bg-green-500/20 text-green-400'
                      : status === 'partial'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-surface-2 text-text-3'
                  } ${isToday ? 'ring-2 ring-purple-500' : ''}`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20"></div>
              <span className="text-xs text-text-3">Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20"></div>
              <span className="text-xs text-text-3">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-surface-2"></div>
              <span className="text-xs text-text-3">Missed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
