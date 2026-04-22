import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET() {
  try {
    const signups = await store.getAllRSProgramSignups();
    return NextResponse.json({ success: true, data: signups });
  } catch (error) {
    console.error('Get RS Program signups error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get signups' },
      { status: 500 }
    );
  }
}
