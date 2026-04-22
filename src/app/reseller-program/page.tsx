'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

export default function ResellerProgramPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
  });
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  const packageDetails = {
    name: 'Reseller Starter Package',
    price: 499,
    includes: [
      { icon: '', image: '/product_images/daily_sunblock_whitening.png', title: '1 K-Beauty Sunblock', description: 'Premium sunscreen product to start selling', worth: '' },
      { icon: '🎓', image: '', title: '3 Hours Training - AI Mastery Class', description: 'Learn AI tools for your business', worth: '₱5,000' },
      { icon: '🛒', image: '', title: 'AI-Commerce Dropshipping Platform', description: 'Access to our dropshipping system', worth: '₱10,000/mo' },
      { icon: '📱', image: '', title: '1 Hour Social Media Marketing Orientation', description: 'Marketing strategies for success', worth: '₱3,000' },
    ],
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.phone || !form.address) {
      setError('Please fill in all required fields');
      return;
    }

    setStep('processing');

    try {
      const res = await fetch('/api/reseller-program/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          package_name: packageDetails.name,
          package_price: packageDetails.price,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOrderNumber(data.order_number);
        setStep('success');
      } else {
        setError(data.error || 'Registration failed');
        setStep('form');
      }
    } catch {
      setError('An error occurred. Please try again.');
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/youth_renew.png" alt="AI Beautify Me" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Beautify Me</h1>
              <p className="text-xs text-purple-200">Reseller Program</p>
            </div>
          </Link>
          <Link href="/" className="text-purple-200 hover:text-white text-sm transition">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm mb-6">
            Limited Time Offer
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Your Beauty Business Today
          </h1>
          <p className="text-xl text-purple-200 mb-8">
            Join our Reseller Program and get everything you need to succeed
          </p>
          <div className="text-5xl font-bold text-white mb-2">
            ₱{packageDetails.price.toLocaleString()}
          </div>
          <p className="text-purple-300 mb-8">One-time payment</p>
          <button
            onClick={() => setShowCheckout(true)}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-600 transition shadow-lg"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Package Includes */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            What&apos;s Included in Your Package
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {packageDetails.includes.map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 relative">
                {item.worth && (
                  <div className="absolute top-4 right-4 text-right">
                    <p className="text-purple-300 text-xs">worth:</p>
                    <p className="text-white/70 text-sm line-through">{item.worth}</p>
                  </div>
                )}
                {item.image ? (
                  <div className="w-16 h-16 mb-4 rounded-lg overflow-hidden bg-white/20">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="text-4xl mb-4">{item.icon}</div>
                )}
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-purple-200 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Why Join Our Program?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Earn Extra Income</h3>
              <p className="text-purple-200 text-sm">Start earning from day one with our proven products</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-white font-semibold mb-2">No Inventory Needed</h3>
              <p className="text-purple-200 text-sm">Dropshipping model means no stock to manage</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Full Support</h3>
              <p className="text-purple-200 text-sm">Training and marketing guidance included</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start?
          </h2>
          <p className="text-purple-200 mb-8">
            Join hundreds of successful resellers today
          </p>
          <button
            onClick={() => setShowCheckout(true)}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-600 transition shadow-lg"
          >
            Register for ₱{packageDetails.price} Only
          </button>
        </div>
      </section>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => step !== 'processing' && setShowCheckout(false)}></div>
          
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-800">
                {step === 'success' ? 'Registration Complete!' : 'Register Now'}
              </h2>
              {step !== 'processing' && (
                <button onClick={() => setShowCheckout(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {step === 'processing' && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your registration...</p>
              </div>
            )}

            {step === 'success' && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to the Team!</h3>
                  <p className="text-gray-500">Your registration has been submitted successfully.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Reference Number</p>
                  <p className="text-lg font-bold text-gray-800">{orderNumber}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-purple-800 mb-2">What&apos;s Next?</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Our team will contact you within 24 hours</li>
                    <li>• Prepare your payment of ₱{packageDetails.price}</li>
                    <li>• Get ready for your training schedule</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Done
                </button>
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleSubmit}>
                <div className="p-4 space-y-4">
                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Package Summary */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-purple-800">{packageDetails.name}</p>
                        <p className="text-sm text-purple-600">One-time payment</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-800">₱{packageDetails.price}</p>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Full Name *"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email Address *"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Phone Number *"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Shipping Address (for product)</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Street Address *"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="City"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          name="province"
                          value={form.province}
                          onChange={handleChange}
                          placeholder="Province"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <input
                        type="text"
                        name="postal_code"
                        value={form.postal_code}
                        onChange={handleChange}
                        placeholder="Postal Code"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Payment Note */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Payment:</strong> Cash on Delivery - Pay ₱{packageDetails.price} when you receive your package.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white p-4 border-t">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition"
                  >
                    Complete Registration - ₱{packageDetails.price}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
