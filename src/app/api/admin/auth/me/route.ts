import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/db/adminStore';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await adminStore.getSessionByToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    const admin = await adminStore.getAdminById(session.admin_id);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json(
      { success: false, error: 'Auth check failed' },
      { status: 500 }
    );
  }
}
