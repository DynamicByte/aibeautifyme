import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/db/userStore';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  const session = await userStore.getSessionByToken(token);
  return session?.user_id || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

    const logs = await userStore.getRoutineLogs(userId, startDate, endDate);
    const stats = await userStore.getStats(userId);

    return NextResponse.json({ success: true, data: { logs, stats } });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { date, step_id, time_of_day, action } = await request.json();
    
    if (!date || !step_id || !time_of_day) {
      return NextResponse.json({ success: false, error: 'date, step_id, and time_of_day are required' }, { status: 400 });
    }

    let log;
    if (action === 'unlog') {
      log = await userStore.unlogRoutineStep(userId, date, step_id, time_of_day);
    } else {
      log = await userStore.logRoutineStep(userId, date, step_id, time_of_day);
    }

    const stats = await userStore.getStats(userId);

    return NextResponse.json({ success: true, data: { log, stats } });
  } catch (error) {
    console.error('Log progress error:', error);
    return NextResponse.json({ success: false, error: 'Failed to log progress' }, { status: 500 });
  }
}
