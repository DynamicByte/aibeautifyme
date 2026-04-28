import { BASE_URL, P_EMAIL, P_PASSWORD } from "@/integrations/philex/Auth"
import { convertRegion, convertProvince, removeParentheses } from "./mappings"

let cachedToken: string | null = null
let tokenExpiry: number | null = null

export type PhilexAddress = {
  type: 'pickup' | 'delivery'
  firstname: string
  lastname: string
  mobile_number: string
  complete_address: string
  region: string
  province: string
  municipality: string
  barangay: string
  notes?: string
  pickup_time?: string
}

export type PhilexBookingRequest = {
  delivery_type: 'regular' | 'cod'
  type: 'pouch' | 'box' | 'own package'
  weight: number
  declared_value: number
  cod_payment: number
  company_customer_id?: string
  affiliate_name?: string
  description: string
  pickup_address: PhilexAddress
  delivery_address: PhilexAddress
  box_price_id?: number
  dimension?: {
    length: number
    width: number
    height: number
  }
  promo_code?: string
}

export type PhilexBookingResponse = {
  message: string
  results: {
    id: number
    type: string
    attempts: number
    bookings: Array<{
      id: number
      tracking_number: string | null
      delivery_type: string
      cod_payment: number
      pickup_address: object
      delivery_address: object
      parcel: {
        weight: number
        type: string
        price: number
        declared_value: number
        description: string
      }
      booking_logs: Array<{
        message: string
        status: string
        created_at: string
      }>
      created_at: string
    }>
  }
}

export type PhilexPriceRequest = {
  type: 'pouch' | 'box' | 'own package'
  weight: number
  declared_value?: number
  sender_province: string
  sender_municipality: string
  sender_barangay: string
  recipient_province: string
  recipient_municipality: string
  recipient_barangay: string
  box_id?: number
  dimension?: {
    length: number
    width: number
    height: number
  }
}

export type PhilexPriceResponse = {
  message: string
  results: {
    fees: {
      pickup_charge: number
      total_rate: number
    }
    prices: Array<{
      sender: string
      recipient: string
      weight: number
      rate: number
      base_rate: number
      valuation_charge: number
      box_price: number
    }>
  }
}

async function getAuthToken(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const response = await fetch(`${BASE_URL}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: P_EMAIL,
      password: P_PASSWORD,
    }),
  })

  const contentType = response.headers.get('content-type') || ''
  
  if (!response.ok) {
    const text = await response.text()
    console.error(`PhilEx auth failed [${response.status}]: ${text.substring(0, 500)}`)
    throw new Error(`Failed to authenticate with PhilEx API (${response.status}): ${contentType.includes('html') ? 'API returned HTML - check URL and credentials' : text.substring(0, 200)}`)
  }

  if (!contentType.includes('application/json')) {
    const text = await response.text()
    console.error(`PhilEx auth returned non-JSON: ${text.substring(0, 500)}`)
    throw new Error(`PhilEx API returned non-JSON response (${contentType}). The API URL may be incorrect or the service is down.`)
  }

  const data = await response.json()
  cachedToken = data.results.access_token
  tokenExpiry = Date.now() + 55 * 60 * 1000 // 55 minutes (tokens typically last 1 hour)

  return cachedToken!
}

async function philexRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object
): Promise<T> {
  const token = await getAuthToken()

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `PhilEx API error: ${response.status}`)
  }

  return response.json()
}

export async function calculateShippingRate(
  params: PhilexPriceRequest | PhilexPriceRequest[]
): Promise<PhilexPriceResponse> {
  const body = Array.isArray(params) ? params : [params]
  return philexRequest<PhilexPriceResponse>('/company/prices', 'POST', body)
}

export async function createBooking(
  bookings: PhilexBookingRequest | PhilexBookingRequest[]
): Promise<PhilexBookingResponse> {
  const body = Array.isArray(bookings) ? bookings : [bookings]
  return philexRequest<PhilexBookingResponse>('/bookings', 'POST', body)
}

export async function getBooking(bookingId: number) {
  return philexRequest(`/bookings/${bookingId}`)
}

export type PhilexTrackingResponse = {
  message: string
  result: {
    id: number
    tracking_number: string
    delivery_type: string
    cod_payment: number
    proof_of_delivery: string | null
    pickup_address: {
      firstname: string
      lastname: string
      mobile_number: string
      complete_address: string | null
      province: { name: string }
      municipality: { name: string }
      barangay: { name: string }
    }
    delivery_address: {
      firstname: string
      lastname: string
      mobile_number: string
      complete_address: string | null
      province: { name: string }
      municipality: { name: string }
      barangay: { name: string }
    }
    parcel: {
      weight: number
      type: string
      price: number
      declared_value: number
      description: string
    }
    booking_logs: Array<{
      message: string
      status: string
      created_at: string
    }>
    created_at: string
    updated_at: string
  }
}

export async function trackBooking(trackingNumber: string): Promise<PhilexTrackingResponse> {
  return philexRequest<PhilexTrackingResponse>(`/booking?tracking_number=${trackingNumber}`)
}

export async function cancelBooking(bookingId: number) {
  return philexRequest(`/bookings/${bookingId}/cancel`, 'POST')
}

export async function getWaybill(trackingNumbers: string[]): Promise<ArrayBuffer> {
  const token = await getAuthToken()

  const response = await fetch(`${BASE_URL}/generate-waybill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ tracking_numbers: trackingNumbers }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `PhilEx API error: ${response.status}`)
  }

  return response.arrayBuffer()
}

// Default pickup address for Nanucell (update with your actual address)
export const STORE_PICKUP_ADDRESS: PhilexAddress = {
  type: 'pickup',
  firstname: 'Fe',
  lastname: 'Corpuz',
  mobile_number: process.env.STORE_PHONE || '09XXXXXXXXX',
  complete_address: process.env.STORE_ADDRESS || 'Your pickup address here',
  region: convertRegion(process.env.STORE_REGION ?? '') || 'luzon',
  province: convertProvince(process.env.STORE_PROVINCE ?? '') || 'Metro Manila',
  municipality: removeParentheses(process.env.TEST_STORE_MUNICIPALITY ?? '') || 'Makati',
  barangay: process.env.STORE_BARANGAY || 'Poblacion',
  pickup_time: '10:00AM',
  notes: 'AIBeautify',
}

// Helper to create a COD booking from order data
export function createCODBookingFromOrder(
  orderData: {
    orderId: string
    orderNumber: string
    customerName: string
    phone: string
    address: string
    city: string
    province?: string
    barangay?: string
    region?: string
    total: number
    items: Array<{ name: string; quantity: number }>
    notes?: string
  }
): PhilexBookingRequest {
  const nameParts = orderData.customerName.split(' ')
  const firstname = nameParts[0] || ''
  const lastname = nameParts.slice(1).join(' ') || ''

  const itemDescription = orderData.items
    .map(item => `${item.quantity}x ${item.name}`)
    .join(', ')

  return {
    delivery_type: 'cod',
    type: 'pouch',
    weight: 1,
    declared_value: orderData.total,
    cod_payment: orderData.total,
    company_customer_id: orderData.orderId,
    affiliate_name: 'AI Beautify Me',
    description: itemDescription,
    pickup_address: STORE_PICKUP_ADDRESS,
    delivery_address: {
      type: 'delivery',
      firstname,
      lastname,
      mobile_number: orderData.phone,
      complete_address: orderData.address,
      region: orderData.region || 'luzon',
      province: orderData.province || 'Manila',
      municipality: orderData.city || 'Caloocan City',
      barangay: orderData.barangay || '',
      notes: orderData.notes || `Order #${orderData.orderNumber}`,
    },
  }
}
