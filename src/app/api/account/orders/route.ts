import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/db/userStore';
import { store } from '@/lib/db/store';

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

    const user = await userStore.getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Find orders by email
    const allOrders = await store.getAllOrders();
    const orders = allOrders
      .filter(o => o.customer_email.toLowerCase() === user.email.toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Attach items to each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        items: await store.getOrderItems(order.id),
        shipping: await store.getShipping(order.id),
      }))
    );

    return NextResponse.json({ success: true, data: ordersWithItems });
  } catch (error) {
    console.error('Get member orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get orders' }, { status: 500 });
  }
}
