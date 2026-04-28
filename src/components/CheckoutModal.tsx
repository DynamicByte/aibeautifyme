'use client';

import { useState, useEffect } from 'react';
import { useCart, CartItem } from './CartContext';
import { RoutineStep } from '@/lib/types';
// @ts-ignore
import { regions, provinces, cities, barangays } from 'select-philippines-address';
import { convertProvince, removeParentheses } from '@/lib/mappings';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: RoutineStep[];
}

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  region: String,
  barangay: String,
  postal_code: string;
  payment_method: string;
}

interface CheckoutResult {
  success: boolean;
  order_number?: string;
  account_created?: boolean;
  account_password?: string;
  error?: string;
}

export default function CheckoutModal({ isOpen, onClose, routine }: CheckoutModalProps) {
  const { items, getTotalFormatted, getTotal, clearCart, getBundleDiscount, hasDrChangBundle, updateQuantity, removeFromCart } = useCart();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    region: '',
    barangay: '',
    postal_code: '',
    payment_method: 'COD',
  });
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState('');
  const [referrerCode, setReferrerCode] = useState<string | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  useEffect(() => {
    const code = localStorage.getItem('referrer_code');
    if (code) {
      setReferrerCode(code);
    }
  }, []);

  // Additional functions //
  const [regionData, setRegion] = useState<any[]>([]);
  const [provinceData, setProvince] = useState<any[]>([]);
  const [cityData, setCity] = useState<any[]>([]);
  const [barangayData, setBarangay] = useState<any[]>([]);

  const [regionAddr, setRegionAddr] = useState("");
  const [provinceAddr, setProvinceAddr] = useState("");
  const [cityAddr, setCityAddr] = useState("");
  const [barangayAddr, setBarangayAddr] = useState("");

  const [shippingFee, setShippingFee] = useState<number>(110);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);

  const region = () => {
    regions().then((response: any[]) => {
      setRegion(response);

      setRegionAddr("");
      setProvinceAddr("");
      setCityAddr("");
      setBarangayAddr("");

      setForm(prev => ({
        ...prev,
        region: "",
        province: "",
        city: "",
        barangay: "",
      }));
    });
  };

  const province = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const text = e.target.selectedOptions[0].text;

    setRegionAddr(text);

    setForm(prev => ({
      ...prev,
      region: text,
    }));

    provinces(e.target.value).then((response: any[]) => {
      setProvince(response);
      setCity([]);
      setBarangay([]);

      setCityAddr("");
      setBarangayAddr("");
    });
  };

  const city = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const text = e.target.selectedOptions[0].text;

    setProvinceAddr(text);

    setForm(prev => ({
      ...prev,
      province: text,
    }));

    cities(e.target.value).then((response: any[]) => {
      setCity(response);
      setBarangayAddr("");
    });
  };

  const barangay = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const text = e.target.selectedOptions[0].text;

    setCityAddr(text);

    setForm(prev => ({
      ...prev,
      city: text,
    }));

    barangays(e.target.value).then((response: any[]) => {
      setBarangay(response);
    });
  };

  const brgy = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brgyName = e.target.selectedOptions[0].text;

    setBarangayAddr(brgyName);

    setForm(prev => ({
      ...prev,
      barangay: brgyName,
    }));

    fetchRate({
      province: convertProvince(provinceAddr),
      municipality: removeParentheses(cityAddr),
      barangay: brgyName,
    });
  };

  useEffect(() => {
    region()
  }, [])

  const fetchRate = async (recipient: { province: string; municipality: string; barangay: string; }) => {
    setLoadingRate(true);

    try {
      const res = await fetch("/api/philex/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items,
          recipient,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setShippingFee(data.rate?.results?.fees?.total_rate);
    } catch (err) {
      console.error(err);
      setShippingFee(100);
    } finally {
      setLoadingRate(false);
    }
  };

  const total = getTotal() + (shippingFee || 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.phone || !form.address) {
      setError('Please fill in all required fields');
      return;
    }

    if (shippingFee === null) {
      setError('Please select region, city, province and barangay to calculate shipping');
      return;
    }

    setStep('processing');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map((item: CartItem) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_image: item.product.imageUrl,
            quantity: item.quantity,
            unit_price: parsePrice(item.product.price),
          })),
          routine: routine,
          referrer_code: referrerCode,
          shipping_fee: shippingFee,
          bundle_discount: hasDrChangBundle() ? getBundleDiscount() : 0,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
        setStep('success');
        clearCart();
      } else {
        setError(data.error || 'Checkout failed');
        setStep('form');
      }
    } catch {
      setError('An error occurred. Please try again.');
      setStep('form');
    }
  };

  const parsePrice = (priceStr: string): number => {
    const match = priceStr.match(/[\d,]+/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  };

  const handleClose = () => {
    if (step === 'success') {
      setStep('form');
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        region: '',
        province: '',
        city: '',
        barangay: '',
        postal_code: '',
        payment_method: 'COD',
      });
      setResult(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose}></div>

      {/* Modal */}
      <div className="relative bg-surface-1 border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-1 p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-1">
            {step === 'success' ? 'Order Confirmed!' : 'Checkout'}
          </h2>
          <button onClick={handleClose} className="p-1 text-text-3 hover:text-text-1 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'processing' && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-1">Processing your order...</p>
          </div>
        )}

        {step === 'success' && result && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-1 mb-2">Thank You!</h3>
              <p className="text-text-3">Your order has been placed successfully.</p>
            </div>

            <div className="bg-surface-2 rounded-lg p-4 mb-6">
              <p className="text-sm text-text-3 mb-1">Order Number</p>
              <p className="text-lg font-bold text-text-1">{result.order_number}</p>
            </div>

            {result.account_created && (
              <div className="bg-purple-700/20 border border-purple-500/30 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-text-1 mb-2">Your Member Account is Ready!</h4>
                <p className="text-sm text-text-3 mb-3">
                  We&apos;ve created an account for you to track your routine and orders.
                </p>
                <div className="bg-surface-1 rounded p-3 space-y-1">
                  <p className="text-sm"><span className="text-text-3">Username:</span> <span className="text-text-1 font-medium">{form.email}</span></p>
                  <p className="text-sm"><span className="text-text-3">Password:</span> <span className="text-text-1 font-medium">{result.account_password}</span></p>
                </div>
                <p className="text-xs text-text-3 mt-2">Please save these credentials!</p>
              </div>
            )}

            <div className="space-y-3">
              <a
                href="/account/login"
                className="block w-full py-3 bg-purple-700 text-white rounded-lg font-medium text-center hover:bg-purple-600 transition"
              >
                Go to Member Dashboard
              </a>
              <button
                onClick={handleClose}
                className="block w-full py-3 bg-surface-2 text-text-1 rounded-lg font-medium text-center hover:bg-surface-3 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
              {error && (
                <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-surface-2 rounded-lg p-3">
                <h3 className="text-sm font-medium text-text-1 mb-2">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  {items.map((item: CartItem) => (
                    <div key={item.product.id} className="flex items-center justify-between gap-2">
                      <span className="text-text-3 flex-1 truncate">{item.product.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => item.quantity > 1 ? updateQuantity(item.product.id, item.quantity - 1) : removeFromCart(item.product.id)}
                          className="w-6 h-6 flex items-center justify-center bg-surface-3 rounded text-text-1 hover:bg-red-500/20 hover:text-red-400 transition"
                        >
                          {item.quantity === 1 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          ) : '−'}
                        </button>
                        <span className="w-6 text-center text-text-1">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-surface-3 rounded text-text-1 hover:bg-purple-500/20 hover:text-purple-400 transition"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-text-1 w-20 text-right">₱{(parsePrice(item.product.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  {hasDrChangBundle() && getBundleDiscount() > 0 && (
                    <div className="flex justify-between text-green-400 pt-1">
                      <span>Dr. Chang&apos;s Bundle Discount</span>
                      <span>-₱{getBundleDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-text-3">Subtotal</span>
                    <span className="text-text-1">{getTotalFormatted()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3">Shipping</span>
                    <span className="text-text-1">
                      {isCalculatingShipping ? (
                        <span className="text-text-3">Calculating...</span>
                      ) : shippingFee !== null ? (
                        shippingFee === 0 ? 'FREE' : `₱${shippingFee.toLocaleString()}`
                      ) : (
                        <span className="text-text-3 text-xs">Enter address to calculate</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-1">
                    <span className="text-text-1">Total</span>
                    <span className="text-gold-700">₱{total.toLocaleString()}</span>
                  </div>
                </div>
                {hasDrChangBundle() && (
                  <div className="mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                    🎉 Dr. Chang&apos;s Mega Peptide Bundle Applied!
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-medium text-text-1 mb-3">Customer Information</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full Name *"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email Address *"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone Number *"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-sm font-medium text-text-1 mb-3">Shipping Address</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street Address *"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-1 mb-3">Region</label>
                      <select
                        name="region"
                        onChange={province}
                        defaultValue={""}
                        className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500">
                        <option value="" disabled>Select Region</option>
                        {
                          regionData && regionData.length > 0 && regionData.map((item) => (
                            <option
                              key={item.region_code}
                              value={item.region_code}>
                              {item.region_name}
                            </option>))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-1 mb-3">Province</label>
                      <select
                        name="province"
                        onChange={city}
                        disabled={!regionAddr}
                        defaultValue={""}
                        className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500">
                        <option value="" disabled>Select Province</option>
                        {
                          provinceData && provinceData.length > 0 && provinceData.map((item) => (<option
                            key={item.province_code} value={item.province_code}>{item.province_name}</option>))
                        }
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-1 mb-3">City</label>
                      <select
                        name="city"
                        onChange={barangay}
                        disabled={!provinceAddr}
                        defaultValue={""}
                        className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500">
                        <option value="" disabled>Select City</option>
                        {
                          cityData && cityData.length > 0 && cityData.map((item) => (<option
                            key={item.city_code} value={item.city_code}>{item.city_name}</option>))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-1 mb-3">Barangay</label>
                      <select
                        name="barangay"
                        onChange={brgy}
                        disabled={!cityAddr}
                        defaultValue={""}
                        className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500">
                        <option value="" disabled>Select Barangay</option>
                        {
                          barangayData && barangayData.length > 0 && barangayData.map((item) => (<option
                            key={item.brgy_code} value={item.brgy_code}>{item.brgy_name}</option>))
                        }
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    placeholder="Postal Code"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-sm font-medium text-text-1 mb-3">Payment Method</h3>
                <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-lg">
                  <input
                    type="radio"
                    name="payment_method"
                    value="COD"
                    checked={form.payment_method === 'COD'}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-1">Cash on Delivery</p>
                    <p className="text-xs text-text-3">Pay when you receive your order</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-surface-1 p-4 border-t border-border">
              <button
                type="submit"
                className="w-full py-3 bg-gold-700 text-on-primary rounded-lg font-medium hover:bg-gold-600 transition"
              >
                Place Order - ₱{total.toLocaleString()}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
