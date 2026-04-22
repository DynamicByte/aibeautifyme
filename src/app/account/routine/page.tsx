'use client';

import { useEffect, useState } from 'react';
import { RoutineStep } from '@/lib/types';
import { RoutineLog } from '@/lib/db/userTypes';

export default function RoutinePage() {
  const [routine, setRoutine] = useState<{ steps: RoutineStep[] } | null>(null);
  const [todayLog, setTodayLog] = useState<RoutineLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (today) fetchData();
  }, [today]);

  const fetchData = async () => {
    try {
      const [routineRes, progressRes] = await Promise.all([
        fetch('/api/account/routine'),
        fetch('/api/account/progress'),
      ]);
      
      const routineData = await routineRes.json();
      const progressData = await progressRes.json();
      
      setRoutine(routineData.data);
      const log = progressData.data?.logs?.find((l: RoutineLog) => l.date === today) || null;
      setTodayLog(log);
    } catch (error) {
      console.error('Failed to fetch routine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStep = async (stepId: string, timeOfDay: 'AM' | 'PM') => {
    const isCompleted = todayLog?.completed_steps.some(
      s => s.step_id === stepId && s.time_of_day === timeOfDay
    );

    setIsUpdating(stepId);

    try {
      const res = await fetch('/api/account/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          step_id: stepId,
          time_of_day: timeOfDay,
          action: isCompleted ? 'unlog' : 'log',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTodayLog(data.data.log);
      }
    } catch (error) {
      console.error('Failed to toggle step:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const isStepCompleted = (stepId: string, timeOfDay: 'AM' | 'PM') => {
    return todayLog?.completed_steps.some(
      s => s.step_id === stepId && s.time_of_day === timeOfDay
    ) || false;
  };

  const getStepsByTime = (timeOfDay: 'AM' | 'PM') => {
    return routine?.steps.filter(s => s.timeOfDay === timeOfDay).sort((a, b) => a.order - b.order) || [];
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const amSteps = getStepsByTime('AM');
  const pmSteps = getStepsByTime('PM');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-1">My Routine</h1>
        <p className="text-text-3">Check off each step as you complete it</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AM Routine */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-text-1">Morning Routine</h2>
              <p className="text-xs text-text-3">{amSteps.filter(s => isStepCompleted(s.id, 'AM')).length}/{amSteps.length} completed</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {amSteps.map((step, idx) => {
              const completed = isStepCompleted(step.id, 'AM');
              return (
                <div
                  key={step.id}
                  className={`p-4 flex items-center gap-4 transition ${completed ? 'bg-green-500/5' : ''}`}
                >
                  <button
                    onClick={() => toggleStep(step.id, 'AM')}
                    disabled={isUpdating === step.id}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-border hover:border-purple-500'
                    } ${isUpdating === step.id ? 'opacity-50' : ''}`}
                  >
                    {completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm text-text-3 w-6">{idx + 1}.</span>
                  {step.product && (
                    <div className="w-12 h-12 bg-surface-2 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={step.product.imageUrl}
                        alt={step.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${completed ? 'text-text-3 line-through' : 'text-text-1'}`}>
                      {step.stepName}
                    </p>
                    {step.product && (
                      <p className="text-xs text-text-3 truncate">{step.product.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PM Routine */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-text-1">Evening Routine</h2>
              <p className="text-xs text-text-3">{pmSteps.filter(s => isStepCompleted(s.id, 'PM')).length}/{pmSteps.length} completed</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {pmSteps.map((step, idx) => {
              const completed = isStepCompleted(step.id, 'PM');
              return (
                <div
                  key={step.id}
                  className={`p-4 flex items-center gap-4 transition ${completed ? 'bg-green-500/5' : ''}`}
                >
                  <button
                    onClick={() => toggleStep(step.id, 'PM')}
                    disabled={isUpdating === step.id}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-border hover:border-purple-500'
                    } ${isUpdating === step.id ? 'opacity-50' : ''}`}
                  >
                    {completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm text-text-3 w-6">{idx + 1}.</span>
                  {step.product && (
                    <div className="w-12 h-12 bg-surface-2 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={step.product.imageUrl}
                        alt={step.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${completed ? 'text-text-3 line-through' : 'text-text-1'}`}>
                      {step.stepName}
                    </p>
                    {step.product && (
                      <p className="text-xs text-text-3 truncate">{step.product.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
