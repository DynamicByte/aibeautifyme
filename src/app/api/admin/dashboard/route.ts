import { NextResponse } from 'next/server';
import { store } from '@/lib/db';

export async function GET() {
  try {
    const stats = await store.getDashboardStats();

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
