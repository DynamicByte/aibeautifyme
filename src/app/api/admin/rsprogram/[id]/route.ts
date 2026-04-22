import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const signup = await store.getRSProgramSignup(id);

    if (!signup) {
      return NextResponse.json(
        { success: false, error: 'Signup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: signup });
  } catch (error) {
    console.error('Get RS Program signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get signup' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const signup = await store.updateRSProgramSignup(id, updates);

    if (!signup) {
      return NextResponse.json(
        { success: false, error: 'Signup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: signup });
  } catch (error) {
    console.error('Update RS Program signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update signup' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await store.deleteRSProgramSignup(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete signup' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete RS Program signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete signup' },
      { status: 500 }
    );
  }
}
