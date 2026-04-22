import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db';
import {
  philexApi,
  PhilExBookingRequest,
  PhilExAddress,
} from '@/lib/philex';

function parseAddress(address: string): { street: string; barangay: string; municipality: string; province: string } {
  const parts = address.split(',').map((p) => p.trim());
  return {
    street: parts[0] || '',
    barangay: parts[1] || '',
    municipality: parts[2] || '',
    province: parts[3] || '',
  };
}

// Create PhilEx booking for an order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      delivery_type = 'regular',
      package_type = 'pouch',
      weight = 1,
      declared_value = 0,
      description,
      pickup_address,
      cod_payment = 0,
    } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
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

    // Parse delivery address from order
    const deliveryParsed = parseAddress(order.shipping_address);
    const customerNames = order.customer_name.split(' ');

    const deliveryAddress: PhilExAddress = {
      type: 'delivery',
      firstname: customerNames[0] || order.customer_name,
      lastname: customerNames.slice(1).join(' ') || '',
      mobile_number: order.customer_phone,
      complete_address: order.shipping_address,
      region: 'luzon',
      province: deliveryParsed.province,
      municipality: deliveryParsed.municipality,
      barangay: deliveryParsed.barangay,
      notes: order.notes,
    };

    // Use provided pickup address or default store address
    const pickupAddr: PhilExAddress = pickup_address || {
      type: 'pickup',
      firstname: 'AI BeautifyMe',
      lastname: 'Store',
      mobile_number: process.env.STORE_PHONE || '09123456789',
      complete_address: process.env.STORE_ADDRESS || 'Store Address, Barangay, City, Province',
      pickup_time: '9:00AM - 12:00PM',
      region: 'luzon',
      province: process.env.STORE_PROVINCE || 'Metro Manila',
      municipality: process.env.STORE_MUNICIPALITY || 'Makati',
      barangay: process.env.STORE_BARANGAY || 'Poblacion',
      notes: 'Store pickup',
    };

    const bookingRequest: PhilExBookingRequest = {
      company_id: order.order_number,
      delivery_type: delivery_type as 'regular' | 'cod',
      type: package_type as 'pouch' | 'box' | 'own package',
      weight,
      description: description || `Order ${order.order_number} - ${order.customer_name}`,
      declared_value: declared_value || Math.round(order.total_amount),
      cod_payment: delivery_type === 'cod' ? (cod_payment || order.total_amount) : 0,
      pickup_address: pickupAddr,
      delivery_address: deliveryAddress,
    };

    const response = await philexApi.createBooking([bookingRequest]);
    const booking = response.results.bookings[0];

    // Create local shipping record
    const trackingNumber = booking.tracking_number || `PHILEX-${booking.id}`;
    const shipping = await store.createShipping({
      order_id,
      courier: 'PhilEx',
      tracking_number: trackingNumber,
      status: 'preparing',
      shipped_at: new Date(),
      tracking_history: booking.booking_logs.map((log) => ({
        timestamp: new Date(log.created_at),
        status: log.status,
        location: '',
        description: log.message,
      })),
    });

    // Update order status
    await store.updateOrder(order_id, { status: 'shipped' });

    // Create notification
    await store.createNotification({
      type: 'shipping',
      title: 'PhilEx Booking Created',
      message: `Order ${order.order_number} booked with PhilEx. Tracking: ${trackingNumber}`,
      reference_id: order_id,
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        shipping,
        philex_response: response.results,
      },
    });
  } catch (error) {
    console.error('PhilEx booking error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create PhilEx booking' },
      { status: 500 }
    );
  }
}
