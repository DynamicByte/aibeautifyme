import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/db/adminStore';

async function getAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  
  const session = await adminStore.getSessionByToken(token);
  if (!session) return null;
  
  return adminStore.getAdminById(session.admin_id);
}

// Get all admin users
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only super_admin can view all admins
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const admins = await adminStore.getAllAdmins();
    
    // Remove password hashes from response
    const safeAdmins = admins.map(a => ({
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      is_active: a.is_active,
      last_login: a.last_login,
      created_at: a.created_at,
    }));

    return NextResponse.json({ success: true, data: safeAdmins });
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get admins' },
      { status: 500 }
    );
  }
}

// Create new admin user
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only super_admin can create admins
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const newAdmin = await adminStore.createAdmin({
      email,
      password,
      name,
      role: role || 'admin',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        is_active: newAdmin.is_active,
        created_at: newAdmin.created_at,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    const message = error instanceof Error && error.message.includes('duplicate') 
      ? 'Email already exists' 
      : 'Failed to create admin';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
