'use client';

import { useEffect, useState } from 'react';

interface SettingsData {
  general: Record<string, string>;
  shipping: Record<string, string>;
  payment: Record<string, string>;
  notification: Record<string, string>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    general: {},
    shipping: {},
    payment: {},
    notification: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setSettings({
            general: data.data.general || {},
            shipping: data.data.shipping || {},
            payment: data.data.payment || {},
            notification: data.data.notification || {},
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (category: keyof SettingsData, key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const settingsToSave: Record<string, { value: string; category: string }> = {};
    (Object.keys(settings) as (keyof SettingsData)[]).forEach(category => {
      Object.entries(settings[category]).forEach(([key, value]) => {
        settingsToSave[key] = { value, category };
      });
    });

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToSave }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
    { id: 'notification', label: 'Notifications' },
  ];

  const settingsConfig: Record<string, { key: string; label: string; type: string; placeholder?: string }[]> = {
    general: [
      { key: 'store_name', label: 'Store Name', type: 'text', placeholder: 'Youth Renew Concierge' },
      { key: 'store_email', label: 'Store Email', type: 'email', placeholder: 'support@example.com' },
      { key: 'store_phone', label: 'Store Phone', type: 'text', placeholder: '+63 912 345 6789' },
      { key: 'currency', label: 'Currency', type: 'text', placeholder: 'PHP' },
    ],
    shipping: [
      { key: 'default_courier', label: 'Default Courier', type: 'text', placeholder: 'LBC' },
      { key: 'shipping_fee', label: 'Shipping Fee (₱)', type: 'number', placeholder: '150' },
      { key: 'free_shipping_threshold', label: 'Free Shipping Threshold (₱)', type: 'number', placeholder: '2000' },
      { key: 'lbc_api_key', label: 'LBC API Key', type: 'password', placeholder: 'Enter API key' },
      { key: 'jt_api_key', label: 'J&T API Key', type: 'password', placeholder: 'Enter API key' },
    ],
    payment: [
      { key: 'cod_enabled', label: 'COD Enabled', type: 'select', placeholder: 'true' },
      { key: 'gcash_number', label: 'GCash Number', type: 'text', placeholder: '09XX XXX XXXX' },
      { key: 'bank_name', label: 'Bank Name', type: 'text', placeholder: 'BDO' },
      { key: 'bank_account_number', label: 'Bank Account Number', type: 'text', placeholder: '1234567890' },
      { key: 'bank_account_name', label: 'Bank Account Name', type: 'text', placeholder: 'Youth Renew Inc' },
    ],
    notification: [
      { key: 'email_notifications', label: 'Email Notifications', type: 'select', placeholder: 'true' },
      { key: 'sms_notifications', label: 'SMS Notifications', type: 'select', placeholder: 'false' },
      { key: 'order_confirmation_email', label: 'Order Confirmation Email', type: 'select', placeholder: 'true' },
      { key: 'shipping_update_email', label: 'Shipping Update Email', type: 'select', placeholder: 'true' },
    ],
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Settings</h1>
          <p className="text-text-3">Configure your store settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-purple-500 text-text-1'
                  : 'border-transparent text-text-3 hover:text-text-1'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-surface-1 border border-border rounded-xl p-6">
        <div className="space-y-6 max-w-xl">
          {settingsConfig[activeTab]?.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-text-1 mb-2">
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={settings[activeTab as keyof SettingsData][field.key] || ''}
                  onChange={(e) => handleChange(activeTab as keyof SettingsData, field.key, e.target.value)}
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-1 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select...</option>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input
                  type={field.type}
                  value={settings[activeTab as keyof SettingsData][field.key] || ''}
                  onChange={(e) => handleChange(activeTab as keyof SettingsData, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
