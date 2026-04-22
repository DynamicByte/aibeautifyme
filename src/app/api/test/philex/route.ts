import { NextRequest, NextResponse } from 'next/server';
import { philexApi, PhilExBookingRequest, PhilExAddress } from '@/lib/philex';

// Test endpoint for PhilEx API integration
// Access via: GET /api/test/philex?test=auth|price|booking_pouch|booking_box|booking_own|all

export async function GET(request: NextRequest) {
  const testType = request.nextUrl.searchParams.get('test') || 'auth';
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: {
      api_url: process.env.PHILEX_API_URL || 'https://uat-api.philex.ph',
      email_configured: !!process.env.PHILEX_EMAIL,
      password_configured: !!process.env.PHILEX_PASSWORD,
      store_address: {
        province: process.env.STORE_PROVINCE || 'Not set',
        municipality: process.env.STORE_MUNICIPALITY || 'Not set',
        barangay: process.env.STORE_BARANGAY || 'Not set',
      },
    },
    tests: {},
  };

  // Pickup address (your store)
  const pickupAddress: PhilExAddress = {
    type: 'pickup',
    firstname: 'AI BeautifyMe',
    lastname: 'Store',
    mobile_number: process.env.STORE_PHONE || '09171234567',
    complete_address: process.env.STORE_ADDRESS || '123 Store Street, Poblacion, Makati, Metro Manila',
    pickup_time: '9:00AM - 12:00PM',
    region: 'ncr',
    province: process.env.STORE_PROVINCE || 'Metro Manila',
    municipality: process.env.STORE_MUNICIPALITY || 'Makati',
    barangay: process.env.STORE_BARANGAY || 'Poblacion',
    notes: 'Test pickup from store',
  };

  // Test delivery address
  const deliveryAddress: PhilExAddress = {
    type: 'delivery',
    firstname: 'Test',
    lastname: 'Customer',
    mobile_number: '09181234567',
    complete_address: '456 Test Street, Bagumbayan, Quezon City, Metro Manila',
    region: 'ncr',
    province: 'Metro Manila',
    municipality: 'Quezon City',
    barangay: 'Bagumbayan',
    notes: 'Test delivery - PhilEx API Integration Test',
  };

  try {
    // Test 1: Authentication
    if (testType === 'auth' || testType === 'all') {
      console.log('[PhilEx Test] Testing authentication...');
      try {
        // Try to calculate price as a way to test auth
        const priceTest = await philexApi.calculateShipping([{
          type: 'pouch',
          weight: 1,
          declared_value: 500,
          sender_province: pickupAddress.province,
          sender_municipality: pickupAddress.municipality,
          sender_barangay: pickupAddress.barangay,
          recipient_province: deliveryAddress.province,
          recipient_municipality: deliveryAddress.municipality,
          recipient_barangay: deliveryAddress.barangay,
        }]);
        
        results.tests = {
          ...results.tests as object,
          authentication: {
            success: true,
            message: 'Authentication successful',
            sample_rate: priceTest.results?.fees?.total_rate,
          },
        };
      } catch (error) {
        results.tests = {
          ...results.tests as object,
          authentication: {
            success: false,
            error: error instanceof Error ? error.message : 'Auth failed',
          },
        };
      }
    }

    // Test 2: Price Calculation
    if (testType === 'price' || testType === 'all') {
      console.log('[PhilEx Test] Testing price calculation...');
      try {
        const priceResults = await philexApi.calculateShipping([
          {
            type: 'pouch',
            weight: 1,
            declared_value: 1000,
            sender_province: pickupAddress.province,
            sender_municipality: pickupAddress.municipality,
            sender_barangay: pickupAddress.barangay,
            recipient_province: deliveryAddress.province,
            recipient_municipality: deliveryAddress.municipality,
            recipient_barangay: deliveryAddress.barangay,
          },
          {
            type: 'pouch',
            weight: 2,
            declared_value: 2000,
            sender_province: pickupAddress.province,
            sender_municipality: pickupAddress.municipality,
            sender_barangay: pickupAddress.barangay,
            recipient_province: deliveryAddress.province,
            recipient_municipality: deliveryAddress.municipality,
            recipient_barangay: deliveryAddress.barangay,
          },
        ]);

        results.tests = {
          ...results.tests as object,
          price_calculation: {
            success: true,
            fees: priceResults.results.fees,
            prices: priceResults.results.prices,
          },
        };
      } catch (error) {
        results.tests = {
          ...results.tests as object,
          price_calculation: {
            success: false,
            error: error instanceof Error ? error.message : 'Price calculation failed',
          },
        };
      }
    }

    // Test 3: Booking - Pouch
    if (testType === 'booking_pouch' || testType === 'all') {
      console.log('[PhilEx Test] Creating test booking (pouch)...');
      try {
        const bookingRequest: PhilExBookingRequest = {
          company_id: `TEST-POUCH-${Date.now()}`,
          delivery_type: 'cod',
          type: 'pouch',
          weight: 0.5,
          description: 'Test Pouch Booking - K-Beauty Skincare Products',
          declared_value: 1500,
          cod_payment: 1500,
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress,
        };

        console.log('[PhilEx Test] Pouch booking request:', JSON.stringify(bookingRequest, null, 2));
        const response = await philexApi.createBooking([bookingRequest]);

        results.tests = {
          ...results.tests as object,
          booking_pouch: {
            success: true,
            request: bookingRequest,
            response: response.results,
            tracking_number: response.results.bookings?.[0]?.tracking_number,
          },
        };
      } catch (error) {
        results.tests = {
          ...results.tests as object,
          booking_pouch: {
            success: false,
            error: error instanceof Error ? error.message : 'Pouch booking failed',
          },
        };
      }
    }

    // Test 4: Booking - Box
    if (testType === 'booking_box' || testType === 'all') {
      console.log('[PhilEx Test] Creating test booking (box)...');
      try {
        const bookingRequest: PhilExBookingRequest = {
          company_id: `TEST-BOX-${Date.now()}`,
          delivery_type: 'cod',
          type: 'box',
          weight: 2,
          box_price_id: 1, // PhilEx standard box ID (may need adjustment)
          description: 'Test Box Booking - K-Beauty Bundle Package',
          declared_value: 3998,
          cod_payment: 3998,
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress,
        };

        console.log('[PhilEx Test] Box booking request:', JSON.stringify(bookingRequest, null, 2));
        const response = await philexApi.createBooking([bookingRequest]);

        results.tests = {
          ...results.tests as object,
          booking_box: {
            success: true,
            request: bookingRequest,
            response: response.results,
            tracking_number: response.results.bookings?.[0]?.tracking_number,
          },
        };
      } catch (error) {
        results.tests = {
          ...results.tests as object,
          booking_box: {
            success: false,
            error: error instanceof Error ? error.message : 'Box booking failed',
          },
        };
      }
    }

    // Test 5: Booking - Own Package
    if (testType === 'booking_own' || testType === 'all') {
      console.log('[PhilEx Test] Creating test booking (own package)...');
      try {
        const bookingRequest: PhilExBookingRequest = {
          company_id: `TEST-OWN-${Date.now()}`,
          delivery_type: 'regular',
          type: 'own package',
          weight: 1.5,
          dimensions: { length: 30, width: 20, height: 15 }, // in cm
          description: 'Test Own Package Booking - Custom Skincare Set',
          declared_value: 2500,
          cod_payment: 0,
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress,
        };

        console.log('[PhilEx Test] Own package booking request:', JSON.stringify(bookingRequest, null, 2));
        const response = await philexApi.createBooking([bookingRequest]);

        results.tests = {
          ...results.tests as object,
          booking_own: {
            success: true,
            request: bookingRequest,
            response: response.results,
            tracking_number: response.results.bookings?.[0]?.tracking_number,
          },
        };
      } catch (error) {
        results.tests = {
          ...results.tests as object,
          booking_own: {
            success: false,
            error: error instanceof Error ? error.message : 'Own package booking failed',
          },
        };
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[PhilEx Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      ...results,
    }, { status: 500 });
  }
}
