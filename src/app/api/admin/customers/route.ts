import { NextRequest, NextResponse } from 'next/server';
import { store, Customer, PaginatedResponse } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search')?.toLowerCase();

    let customers = await store.getAllCustomers();

    // Search by name, email, or phone
    if (search) {
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.includes(search)
      );
    }

    // Sort by created_at descending
    customers.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Paginate
    const total = customers.length;
    const total_pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedCustomers = customers.slice(start, start + limit);

    const response: PaginatedResponse<Customer> = {
      data: paginatedCustomers,
      total,
      page,
      limit,
      total_pages,
    };

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, province, postal_code, notes } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingCustomer = await store.getCustomerByEmail(email);
    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer with this email already exists' },
        { status: 400 }
      );
    }

    const customer = await store.createCustomer({
      name,
      email,
      phone: phone || '',
      address: address || '',
      city: city || '',
      province: province || '',
      postal_code: postal_code || '',
      notes,
      total_orders: 0,
      total_spent: 0,
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Customers POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
