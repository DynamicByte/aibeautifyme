import { NextRequest, NextResponse } from 'next/server';
import { store, ShippingStatus } from '@/lib/db';

// GET shipment for a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const shipping = await store.getShipping(orderId);

    if (!shipping) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const order = await store.getOrder(orderId);

    return NextResponse.json({
      success: true,
      data: {
        ...shipping,
        order_number: order?.order_number,
        customer_name: order?.customer_name,
        shipping_address: order?.shipping_address,
      },
    });
  } catch (error) {
    console.error('Shipping GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}

// Update shipment status / add tracking event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const shipping = await store.getShipping(orderId);

    if (!shipping) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, location, description, tracking_number, courier } = body;

    const updates: Partial<typeof shipping> = {};
    
    // Update basic fields
    if (tracking_number) updates.tracking_number = tracking_number;
    if (courier) updates.courier = courier;

    // Update status and add tracking event
    if (status) {
      const previousStatus = shipping.status;
      updates.status = status as ShippingStatus;

      // Add tracking event
      const newHistory = [...(shipping.tracking_history || []), {
        timestamp: new Date(),
        status,
        location: location || '',
        description: description || `Status updated to ${status}`,
      }];
      updates.tracking_history = newHistory;

      // Update timestamps based on status
      if (status === 'picked_up' || status === 'in_transit') {
        updates.shipped_at = shipping.shipped_at || new Date();
      }
      if (status === 'delivered') {
        updates.delivered_at = new Date();

        // Update order status
        await store.updateOrder(orderId, { 
          status: 'delivered', 
          payment_status: 'paid' 
        });
      }

      // Create notification for significant status changes
      if (status !== previousStatus) {
        const order = await store.getOrder(orderId);
        await store.createNotification({
          type: 'shipping',
          title: 'Shipping Status Updated',
          message: `Order ${order?.order_number || orderId} shipping status: ${status}`,
          reference_id: orderId,
          is_read: false,
        });
      }
    }

    const updatedShipping = await store.updateShipping(orderId, updates);

    return NextResponse.json({ success: true, data: updatedShipping });
  } catch (error) {
    console.error('Shipping PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}

// Delete shipment (cancel shipping)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const shipping = await store.getShipping(orderId);

    if (!shipping) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Only allow canceling if not yet delivered
    if (shipping.status === 'delivered') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel delivered shipment' },
        { status: 400 }
      );
    }

    await store.deleteShipping(orderId);

    // Update order status back to processing
    await store.updateOrder(orderId, { status: 'processing' });

    return NextResponse.json({ success: true, message: 'Shipment cancelled' });
  } catch (error) {
    console.error('Shipping DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel shipment' },
      { status: 500 }
    );
  }
}
