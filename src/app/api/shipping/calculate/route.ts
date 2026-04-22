import { NextRequest, NextResponse } from 'next/server';
import { philexApi, PhilExPriceRequest } from '@/lib/philex';

// Public API for calculating shipping rates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      weight = 1,
      declared_value = 0,
      province,
      city,
      barangay = 'Poblacion',
    } = body;

    if (!province || !city) {
      return NextResponse.json(
        { success: false, error: 'Province and city are required' },
        { status: 400 }
      );
    }

    const priceRequest: PhilExPriceRequest = {
      type: 'pouch',
      weight,
      declared_value,
      sender_province: process.env.STORE_PROVINCE || 'Metro Manila',
      sender_municipality: process.env.STORE_MUNICIPALITY || 'Makati',
      sender_barangay: process.env.STORE_BARANGAY || 'Poblacion',
      recipient_province: province,
      recipient_municipality: city,
      recipient_barangay: barangay,
    };

    const response = await philexApi.calculateShipping([priceRequest]);

    return NextResponse.json({
      success: true,
      shipping_fee: response.results.fees.total_rate || 0,
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    // Return a fallback flat rate if API fails
    return NextResponse.json({
      success: true,
      shipping_fee: 150,
      fallback: true,
    });
  }
}
