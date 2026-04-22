import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db';
import { philexApi } from '@/lib/philex';

// Track shipment via PhilEx API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('tracking_number');
    const orderId = searchParams.get('order_id');

    if (!trackingNumber && !orderId) {
      return NextResponse.json(
        { success: false, error: 'Tracking number or order ID is required' },
        { status: 400 }
      );
    }

    let trackingNum = trackingNumber;

    // If order_id provided, get tracking number from local storage
    if (orderId && !trackingNumber) {
      const shipping = await store.getShipping(orderId);
      if (!shipping) {
        return NextResponse.json(
          { success: false, error: 'Shipment not found for this order' },
          { status: 404 }
        );
      }
      trackingNum = shipping.tracking_number;
    }

    if (!trackingNum) {
      return NextResponse.json(
        { success: false, error: 'Tracking number not found' },
        { status: 404 }
      );
    }

    // Fetch from PhilEx API
    const response = await philexApi.trackShipment(trackingNum);
    const result = response.result;

    // Map PhilEx status to our status
    const statusMap: Record<string, string> = {
      'Pending': 'preparing',
      'For Pickup': 'preparing',
      'In Transit (to Sender Hub)': 'picked_up',
      'In Transit (in Sender Hub)': 'in_transit',
      'In Transit': 'in_transit',
      'Out for Delivery': 'out_for_delivery',
      'Delivered': 'delivered',
      'Failed': 'failed',
    };

    const latestStatus = result.booking_logs[0]?.status || 'preparing';
    const mappedStatus = statusMap[latestStatus] || 'in_transit';

    // Update local shipping record if order_id provided
    if (orderId) {
      const shipping = await store.getShipping(orderId);
      if (shipping) {
        const updates: Parameters<typeof store.updateShipping>[1] = {
          status: mappedStatus as 'preparing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed',
          tracking_history: result.booking_logs.map((log) => ({
            timestamp: new Date(log.created_at),
            status: log.status,
            location: '',
            description: log.message,
          })),
        };

        if (mappedStatus === 'delivered') {
          updates.delivered_at = new Date(result.booking_logs[0]?.created_at || new Date());

          // Update order status
          await store.updateOrder(orderId, { 
            status: 'delivered', 
            payment_status: 'paid' 
          });
        }

        await store.updateShipping(orderId, updates);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tracking_number: result.tracking_number,
        delivery_type: result.delivery_type,
        cod_payment: result.cod_payment,
        status: mappedStatus,
        parcel: result.parcel,
        pickup_address: result.pickup_address,
        delivery_address: result.delivery_address,
        tracking_history: result.booking_logs.map((log) => ({
          timestamp: log.created_at,
          status: log.status,
          description: log.message,
        })),
        proof_of_delivery: result.proof_of_delivery,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
    });
  } catch (error) {
    console.error('PhilEx tracking error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to track shipment' },
      { status: 500 }
    );
  }
}
