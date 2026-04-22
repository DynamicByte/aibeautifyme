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

    const routine = await userStore.getRoutine(userId);
    return NextResponse.json({ success: true, data: routine });
  } catch (error) {
    console.error('Get routine error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get routine' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { steps } = await request.json();
    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json({ success: false, error: 'Steps array is required' }, { status: 400 });
    }

    const routine = await userStore.updateRoutine(userId, steps);
    return NextResponse.json({ success: true, data: routine });
  } catch (error) {
    console.error('Update routine error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update routine' }, { status: 500 });
  }
}
