import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, province, postal_code, package_name, package_price } = body;

    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { success: false, error: 'Name, email, phone, and address are required' },
        { status: 400 }
      );
    }

    // Generate order number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderNumber = `RSP${dateStr}${random}`;

    // Create signup record
    const signup = await store.createRSProgramSignup({
      name,
      email,
      phone,
      address,
      city: city || '',
      province: province || '',
      postal_code: postal_code || '',
      package_name: package_name || 'Reseller Starter Package',
      package_price: package_price || 499,
      payment_method: 'COD',
      payment_status: 'pending',
      status: 'pending',
      notes: `Order Number: ${orderNumber}`,
    });

    // Create notification for admin
    await store.createNotification({
      type: 'customer',
      title: 'New Reseller Program Signup',
      message: `${name} signed up for ${package_name || 'Reseller Starter Package'} - ₱${package_price || 499}`,
      reference_id: signup.id,
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      signup_id: signup.id,
    });
  } catch (error) {
    console.error('RS Program checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
