import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db';

// GET all shipments with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const courier = searchParams.get('courier') || undefined;

    const shipments = await store.getAllShipping({ status, courier });

    // Enrich with order data
    const enrichedShipments = await Promise.all(
      shipments.map(async (s) => {
        const order = await store.getOrder(s.order_id);
        return {
          ...s,
          order_number: order?.order_number,
          customer_name: order?.customer_name,
          shipping_address: order?.shipping_address,
        };
      })
    );

    // Sort by updated_at descending
    enrichedShipments.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return NextResponse.json({ success: true, data: enrichedShipments });
  } catch (error) {
    console.error('Shipping GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

// Create shipment for an order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, courier, tracking_number, estimated_delivery } = body;

    if (!order_id || !courier || !tracking_number) {
      return NextResponse.json(
        { success: false, error: 'Order ID, courier, and tracking number are required' },
        { status: 400 }
      );
    }

    const order = await store.getOrder(order_id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if shipment already exists
    const existingShipping = await store.getShipping(order_id);
    if (existingShipping) {
      return NextResponse.json(
        { success: false, error: 'Shipment already exists for this order' },
        { status: 400 }
      );
    }

    const shipping = await store.createShipping({
      order_id,
      courier,
      tracking_number,
      status: 'preparing',
      estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : undefined,
      shipped_at: new Date(),
      tracking_history: [
        {
          timestamp: new Date(),
          status: 'preparing',
          location: 'Warehouse',
          description: 'Order is being prepared for shipping',
        },
      ],
    });

    // Update order status to shipped
    await store.updateOrder(order_id, { status: 'shipped' });

    // Create notification
    await store.createNotification({
      type: 'shipping',
      title: 'Order Shipped',
      message: `Order ${order.order_number} has been shipped via ${courier}. Tracking: ${tracking_number}`,
      reference_id: order_id,
      is_read: false,
    });

    return NextResponse.json({ success: true, data: shipping });
  } catch (error) {
    console.error('Shipping POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
