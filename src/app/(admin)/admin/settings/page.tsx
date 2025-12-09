'use client';

import { useState, useEffect } from 'react';
import { getGeneralSettingsAction, updateSettingsAction } from '@/actions/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getGeneralSettingsAction();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettingsAction('general', settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">General Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Store Name</label>
            <input
              type="text"
              value={settings.storeName || ''}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Store Email</label>
            <input
              type="email"
              value={settings.storeEmail || ''}
              onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Store Phone</label>
            <input
              type="tel"
              value={settings.storePhone || ''}
              onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              value={settings.currency || 'USD'}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="NPR">NPR - Nepalese Rupee</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Store Address</label>
          <textarea
            value={settings.storeAddress || ''}
            onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={settings.timezone || 'UTC'}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Asia/Kolkata">India Standard Time</option>
              <option value="Asia/Kathmandu">Nepal Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weight Unit</label>
            <select
              value={settings.weightUnit || 'kg'}
              onChange={(e) => setSettings({ ...settings, weightUnit: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lb">Pounds (lb)</option>
              <option value="g">Grams (g)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dimension Unit</label>
            <select
              value={settings.dimensionUnit || 'cm'}
              onChange={(e) => setSettings({ ...settings, dimensionUnit: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="cm">Centimeters (cm)</option>
              <option value="in">Inches (in)</option>
              <option value="m">Meters (m)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
