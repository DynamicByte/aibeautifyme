import { NextRequest, NextResponse } from 'next/server'
import {
  calculateShippingRate,
  createBooking,
  createCODBookingFromOrder,
  trackBooking,
  getWaybill,
  PhilexPriceRequest,
} from '@/lib/philex'

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case 'calculate-shipping': {
        const { type, weight, declaredValue, senderProvince, senderMunicipality, senderBarangay, recipientProvince, recipientMunicipality, recipientBarangay } = data

        const priceRequest: PhilexPriceRequest = {
          type: type || 'pouch',
          weight: weight || 1,
          declared_value: declaredValue,
          sender_province: senderProvince || process.env.NANUCELL_PROVINCE || 'Metro Manila',
          sender_municipality: senderMunicipality || process.env.NANUCELL_MUNICIPALITY || 'Makati',
          sender_barangay: senderBarangay || process.env.NANUCELL_BARANGAY || 'Poblacion',
          recipient_province: recipientProvince,
          recipient_municipality: recipientMunicipality,
          recipient_barangay: recipientBarangay,
        }

        const result = await calculateShippingRate(priceRequest)
        return NextResponse.json({
          success: true,
          shippingFee: result.results.fees.total_rate,
          pickupCharge: result.results.fees.pickup_charge,
          prices: result.results.prices,
        })
      }

      case 'create-booking': {
        const { orderId, orderNumber, customerName, phone, address, city, province, barangay, region, total, items, notes } = data

        const bookingRequest = createCODBookingFromOrder({
          orderId,
          orderNumber,
          customerName,
          phone,
          address,
          city,
          province,
          barangay,
          region,
          total,
          items,
          notes,
        })

        const result = await createBooking(bookingRequest)
        
        const booking = result.results.bookings[0]
        return NextResponse.json({
          success: true,
          bookingId: result.results.id,
          trackingNumber: booking?.tracking_number,
          status: booking?.booking_logs[0]?.status || 'Pending',
          message: result.message,
        })
      }

      case 'track': {
        const { trackingNumber } = data

        if (!trackingNumber) {
          return NextResponse.json(
            { error: 'Tracking number is required' },
            { status: 400 }
          )
        }

        const result = await trackBooking(trackingNumber)
        return NextResponse.json({
          success: true,
          tracking: result.result,
        })
      }

      case 'waybill': {
        const { trackingNumbers } = data

        if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
          return NextResponse.json(
            { error: 'Tracking numbers array is required' },
            { status: 400 }
          )
        }

        const pdfBuffer = await getWaybill(trackingNumbers)
        
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="waybill-${trackingNumbers.join('-')}.pdf"`,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('PhilEx API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PhilEx API error' },
      { status: 500 }
    )
  }
}
