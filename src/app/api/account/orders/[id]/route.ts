import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/db/userStore';
import { store } from '@/lib/db/store';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  const session = await userStore.getSessionByToken(token);
  return session?.user_id || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await userStore.getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const order = await store.getOrder(id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Verify order belongs to this user
    if (order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const items = await store.getOrderItems(id);
    const shipping = await store.getShipping(id);

    return NextResponse.json({
      success: true,
      data: { ...order, items, shipping },
    });
  } catch (error) {
    console.error('Get member order detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get order' }, { status: 500 });
  }
}
