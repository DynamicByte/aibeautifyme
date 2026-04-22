import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import { userStore } from '@/lib/db/userStore';
import { Order, OrderItem, Customer } from '@/lib/db/types';
import { RoutineStep } from '@/lib/types';

interface CheckoutItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
}

interface CheckoutRequest {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    province?: string;
    postal_code?: string;
    payment_method: string;
  };
  items: CheckoutItem[];
  routine: RoutineStep[];
  referrer_code?: string;
  shipping_fee?: number;
  bundle_discount?: number;
}

function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { customer, items, routine, referrer_code, shipping_fee, bundle_discount } = body;

    if (!customer.name || !customer.email || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and items are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const shippingFee = shipping_fee ?? 150; // Use provided shipping fee or fallback to 150
    const discount = bundle_discount ?? 0; // Apply bundle discount if provided
    const totalAmount = subtotal - discount + shippingFee;

    // Check if customer exists
    let existingCustomer = await store.getCustomerByEmail(customer.email);

    // Create or update customer
    if (!existingCustomer) {
      existingCustomer = await store.createCustomer({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        province: customer.province || '',
        postal_code: customer.postal_code || '',
        total_orders: 0,
        total_spent: 0,
      });
    }

    // Create order
    const shippingAddress = [
      customer.address,
      customer.city,
      customer.province,
      customer.postal_code,
    ].filter(Boolean).join(', ');

    // Look up reseller by referral code
    let referrerId: string | undefined;
    let referrerName: string | undefined;
    if (referrer_code) {
      const reseller = await store.getResellerByCode(referrer_code);
      if (reseller) {
        referrerId = reseller.id;
        referrerName = reseller.name;
      }
    }

    const order = await store.createOrder({
      order_number: store.generateOrderNumber(),
      customer_id: existingCustomer!.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || '',
      shipping_address: shippingAddress,
      status: 'pending',
      subtotal,
      shipping_fee: shippingFee,
      discount,
      total_amount: totalAmount,
      payment_method: customer.payment_method || 'COD',
      payment_status: 'pending',
      referrer_id: referrerId,
      referrer_name: referrerName,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Update reseller stats if referral was used
    if (referrerId) {
      const reseller = await store.getReseller(referrerId);
      if (reseller) {
        await store.updateReseller(referrerId, {
          total_referrals: reseller.total_referrals + 1,
          total_revenue: reseller.total_revenue + totalAmount,
        });
      }
    }

    // Create order items
    const orderItemsData = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }));
    await store.createOrderItems(orderItemsData);

    // Update customer stats
    await store.updateCustomer(existingCustomer!.id, {
      total_orders: existingCustomer!.total_orders + 1,
      total_spent: existingCustomer!.total_spent + totalAmount,
    });

    // Create notification
    await store.createNotification({
      type: 'order',
      title: 'New Order Received',
      message: `Order ${order.order_number} from ${customer.name} - ₱${totalAmount.toLocaleString()}`,
      reference_id: order.id,
      is_read: false,
    });

    // Check if user account exists, if not create one
    let accountCreated = false;
    let accountPassword = '';
    
    const existingUser = await userStore.getUserByEmail(customer.email);

    if (!existingUser) {
      // Create new user account
      accountPassword = generatePassword();
      const newUser = await userStore.createUser({
        email: customer.email,
        password_hash: accountPassword,
        name: customer.name,
        customer_id: existingCustomer!.id,
        skin_profile: {},
      });

      // Save routine to user account if provided
      if (routine && routine.length > 0) {
        await userStore.updateRoutine(newUser.id, routine);
      }

      accountCreated = true;
    } else {
      // Update existing user's routine if provided
      if (routine && routine.length > 0) {
        await userStore.updateRoutine(existingUser.id, routine);
      }
    }

    return NextResponse.json({
      success: true,
      order_number: order.order_number,
      order_id: order.id,
      total: totalAmount,
      account_created: accountCreated,
      account_password: accountCreated ? accountPassword : undefined,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
