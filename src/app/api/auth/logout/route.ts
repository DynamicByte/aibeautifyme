import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/db/userStore';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    
    if (token) {
      await userStore.deleteSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session_token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
