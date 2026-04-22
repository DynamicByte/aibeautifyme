import { NextRequest, NextResponse } from 'next/server';
import { philexApi } from '@/lib/philex';

// Get waybill PDF URL for printing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('tracking_number');

    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    const response = await philexApi.getWaybill(trackingNumber);

    return NextResponse.json({
      success: true,
      data: {
        tracking_number: trackingNumber,
        waybill_url: response.url,
      },
    });
  } catch (error) {
    console.error('PhilEx waybill error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get waybill' },
      { status: 500 }
    );
  }
}
