import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/db/adminStore';

async function getAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  
  const session = await adminStore.getSessionByToken(token);
  if (!session) return null;
  
  return adminStore.getAdminById(session.admin_id);
}

// Update admin user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only super_admin can update admins
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updates = await request.json();

    // Prevent self-deactivation
    if (id === admin.id && updates.is_active === false) {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const updatedAdmin = await adminStore.updateAdmin(id, updates);
    if (!updatedAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
        is_active: updatedAdmin.is_active,
      },
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

// Delete admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only super_admin can delete admins
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === admin.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const success = await adminStore.deleteAdmin(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
