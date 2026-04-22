import { NextRequest, NextResponse } from 'next/server';
import { store, Order, OrderItem, PaginatedResponse } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let orders = await store.getAllOrders();

    // Filter by status
    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    // Search by order number, customer name, or email
    if (search) {
      orders = orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(search) ||
          o.customer_name.toLowerCase().includes(search) ||
          o.customer_email.toLowerCase().includes(search)
      );
    }

    // Sort by created_at descending
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Paginate
    const total = orders.length;
    const total_pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedOrders = orders.slice(start, start + limit);

    // Attach order items
    const ordersWithItems = await Promise.all(
      paginatedOrders.map(async (order) => ({
        ...order,
        items: await store.getOrderItems(order.id),
      }))
    );

    const response: PaginatedResponse<Order & { items: OrderItem[] }> = {
      data: ordersWithItems,
      total,
      page,
      limit,
      total_pages,
    };

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      payment_method = 'COD',
      notes,
    } = body;

    if (!customer_name || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer name and items are required' },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0
    );
    const shippingFee = subtotal >= 2000 ? 0 : 150;

    const order = await store.createOrder({
      order_number: store.generateOrderNumber(),
      customer_id: customer_id || store.generateId(),
      customer_name,
      customer_email: customer_email || '',
      customer_phone: customer_phone || '',
      shipping_address: shipping_address || '',
      status: 'pending',
      subtotal,
      shipping_fee: shippingFee,
      discount: 0,
      total_amount: subtotal + shippingFee,
      payment_method,
      payment_status: 'pending',
      notes,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItemsData = items.map(
      (item: { product_id: string; product_name: string; quantity: number; unit_price: number; product_image?: string }) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      })
    );
    const orderItems = await store.createOrderItems(orderItemsData);

    // Create notification
    await store.createNotification({
      type: 'order',
      title: 'New Order Received',
      message: `Order ${order.order_number} from ${customer_name} - ₱${order.total_amount.toLocaleString()}`,
      reference_id: order.id,
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      data: { ...order, items: orderItems },
    });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
