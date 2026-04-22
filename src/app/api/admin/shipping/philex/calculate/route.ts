import { NextRequest, NextResponse } from 'next/server';
import { philexApi, PhilExPriceRequest } from '@/lib/philex';

// Calculate shipping rates via PhilEx API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type = 'pouch',
      weight = 1,
      declared_value = 0,
      box_id,
      dimension,
      sender_province,
      sender_municipality,
      sender_barangay,
      recipient_province,
      recipient_municipality,
      recipient_barangay,
    } = body;

    if (!recipient_province || !recipient_municipality || !recipient_barangay) {
      return NextResponse.json(
        { success: false, error: 'Recipient address (province, municipality, barangay) is required' },
        { status: 400 }
      );
    }

    // Use store address as default sender
    const priceRequest: PhilExPriceRequest = {
      type: type as 'pouch' | 'box' | 'own package',
      weight,
      declared_value,
      sender_province: sender_province || process.env.STORE_PROVINCE || 'Metro Manila',
      sender_municipality: sender_municipality || process.env.STORE_MUNICIPALITY || 'Makati',
      sender_barangay: sender_barangay || process.env.STORE_BARANGAY || 'Poblacion',
      recipient_province,
      recipient_municipality,
      recipient_barangay,
    };

    if (type === 'box' && box_id) {
      priceRequest.box_id = box_id;
    }

    if (type === 'own package' && dimension) {
      priceRequest.dimension = dimension;
    }

    const response = await philexApi.calculateShipping([priceRequest]);

    return NextResponse.json({
      success: true,
      data: {
        pickup_charge: response.results.fees.pickup_charge,
        total_rate: response.results.fees.total_rate,
        prices: response.results.prices,
      },
    });
  } catch (error) {
    console.error('PhilEx price calculation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to calculate shipping rate' },
      { status: 500 }
    );
  }
}
