import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/db/adminStore';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;

    if (token) {
      await adminStore.deleteSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin_session');

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
