// PhilEx Shipping API Integration
// Documentation: https://uat-philex-docs-api-cfwej.ondigitalocean.app/

const PHILEX_BASE_URL = process.env.PHILEX_API_URL || 'https://uat-api.philex.ph';
const PHILEX_EMAIL = process.env.PHILEX_EMAIL || '';
const PHILEX_PASSWORD = process.env.PHILEX_PASSWORD || '';

interface PhilExAuthResponse {
  message: string;
  results: {
    access_token: string;
  };
}

interface PhilExAddress {
  type: 'pickup' | 'delivery';
  firstname: string;
  lastname: string;
  mobile_number: string;
  complete_address: string;
  pickup_time?: string;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  notes?: string;
}

interface PhilExBookingRequest {
  company_id?: string;
  delivery_type: 'regular' | 'cod';
  type: 'pouch' | 'box' | 'own package';
  weight: number;
  box_price_id?: number;
  dimensions?: { length: number; width: number; height: number };
  description: string;
  declared_value: number;
  cod_payment?: number;
  pickup_address: PhilExAddress;
  delivery_address: PhilExAddress;
  promo_code?: string;
}

interface PhilExBookingResponse {
  message: string;
  results: {
    id: number;
    type: string;
    attempts: number;
    bookings: Array<{
      id: number;
      tracking_number: string | null;
      delivery_type: string;
      cod_payment: number;
      pickup_address: Record<string, unknown>;
      delivery_address: Record<string, unknown>;
      parcel: {
        weight: number;
        type: string;
        price: number;
        declared_value: number;
        description: string;
      };
      booking_logs: Array<{
        message: string;
        status: string;
        created_at: string;
      }>;
      created_at: string;
      updated_at: string;
    }>;
  };
}

interface PhilExTrackingLog {
  message: string;
  status: string;
  created_at: string;
}

interface PhilExTrackingResponse {
  message: string;
  result: {
    id: number;
    tracking_number: string;
    delivery_type: string;
    cod_payment: number;
    proof_of_delivery: string | null;
    pickup_address: Record<string, unknown>;
    delivery_address: Record<string, unknown>;
    parcel: {
      weight: number;
      type: string;
      price: number;
      declared_value: number;
      description: string;
    };
    booking_logs: PhilExTrackingLog[];
    created_at: string;
    updated_at: string;
  };
}

interface PhilExPriceRequest {
  type: 'pouch' | 'box' | 'own package';
  box_id?: number;
  weight: number;
  dimension?: { length: number; width: number; height: number };
  declared_value?: number;
  sender_province: string;
  sender_municipality: string;
  sender_barangay: string;
  recipient_province: string;
  recipient_municipality: string;
  recipient_barangay: string;
}

interface PhilExPriceResponse {
  message: string;
  results: {
    fees: {
      pickup_charge: number;
      total_rate: number;
    };
    prices: Array<{
      sender: string;
      recipient: string;
      weight: number;
      rate: number;
      base_rate: number;
      valuation_charge: number;
      box_price: number;
    }>;
  };
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

class PhilExAPI {
  private async getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    const response = await fetch(`${PHILEX_BASE_URL}/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: PHILEX_EMAIL,
        password: PHILEX_PASSWORD,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'PhilEx authentication failed');
    }

    const data: PhilExAuthResponse = await response.json();
    cachedToken = data.results.access_token;
    tokenExpiry = Date.now() + 55 * 60 * 1000; // Token valid for ~1 hour, refresh at 55 min

    return cachedToken;
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${PHILEX_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `PhilEx API error: ${response.status}`);
    }

    return response.json();
  }

  async createBooking(bookings: PhilExBookingRequest[]): Promise<PhilExBookingResponse> {
    return this.makeAuthenticatedRequest<PhilExBookingResponse>('/bookings', 'POST', bookings);
  }

  async trackShipment(trackingNumber: string): Promise<PhilExTrackingResponse> {
    return this.makeAuthenticatedRequest<PhilExTrackingResponse>(
      `/booking?tracking_number=${encodeURIComponent(trackingNumber)}`,
      'GET'
    );
  }

  async calculateShipping(requests: PhilExPriceRequest[]): Promise<PhilExPriceResponse> {
    return this.makeAuthenticatedRequest<PhilExPriceResponse>('/company/prices', 'POST', requests);
  }

  async cancelBooking(trackingNumber: string): Promise<{ message: string }> {
    return this.makeAuthenticatedRequest<{ message: string }>(
      `/booking/cancel?tracking_number=${encodeURIComponent(trackingNumber)}`,
      'POST'
    );
  }

  async getWaybill(trackingNumber: string): Promise<{ url: string }> {
    return this.makeAuthenticatedRequest<{ url: string }>(
      `/booking/waybill?tracking_number=${encodeURIComponent(trackingNumber)}`,
      'GET'
    );
  }
}

export const philexApi = new PhilExAPI();

export type {
  PhilExBookingRequest,
  PhilExBookingResponse,
  PhilExTrackingResponse,
  PhilExTrackingLog,
  PhilExPriceRequest,
  PhilExPriceResponse,
  PhilExAddress,
};
