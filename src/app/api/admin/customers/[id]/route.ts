import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await store.getCustomer(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get customer's orders
    const orders = await store.getOrdersByCustomer(id);

    return NextResponse.json({
      success: true,
      data: { ...customer, orders },
    });
  } catch (error) {
    console.error('Customer GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
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
    const customer = await store.getCustomer(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, city, province, postal_code, notes } = body;

    // Check for duplicate email (excluding current customer)
    if (email && email !== customer.email) {
      const existingCustomer = await store.getCustomerByEmail(email);
      if (existingCustomer && existingCustomer.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Another customer with this email already exists' },
          { status: 400 }
        );
      }
    }

    const updates: Partial<typeof customer> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (province !== undefined) updates.province = province;
    if (postal_code !== undefined) updates.postal_code = postal_code;
    if (notes !== undefined) updates.notes = notes;

    const updatedCustomer = await store.updateCustomer(id, updates);

    return NextResponse.json({ success: true, data: updatedCustomer });
  } catch (error) {
    console.error('Customer PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
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
    const customer = await store.getCustomer(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has orders
    const orders = await store.getOrdersByCustomer(id);
    if (orders.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete customer with existing orders' },
        { status: 400 }
      );
    }

    await store.deleteCustomer(id);

    return NextResponse.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
