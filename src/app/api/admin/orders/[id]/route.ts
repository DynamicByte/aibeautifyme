import { NextRequest, NextResponse } from 'next/server';
import { store, OrderStatus } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await store.getOrder(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const items = await store.getOrderItems(id);
    const shipping = await store.getShipping(id);

    return NextResponse.json({
      success: true,
      data: { ...order, items, shipping },
    });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
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
    const order = await store.getOrder(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, payment_status, notes, shipping_address } = body;

    const previousStatus = order.status;

    const updates: Partial<typeof order> = {};
    if (status) updates.status = status as OrderStatus;
    if (payment_status) updates.payment_status = payment_status;
    if (notes !== undefined) updates.notes = notes;
    if (shipping_address) updates.shipping_address = shipping_address;

    const updatedOrder = await store.updateOrder(id, updates);

    // Create notification for status change
    if (status && status !== previousStatus) {
      await store.createNotification({
        type: 'order',
        title: 'Order Status Updated',
        message: `Order ${order.order_number} status changed to ${status}`,
        reference_id: order.id,
        is_read: false,
      });
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
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
    const order = await store.getOrder(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow deleting cancelled orders
    if (order.status !== 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Can only delete cancelled orders' },
        { status: 400 }
      );
    }

    await store.deleteOrderItems(id);
    await store.deleteShipping(id);
    await store.deleteOrder(id);

    return NextResponse.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
