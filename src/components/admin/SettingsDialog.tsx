'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, Users, CreditCard, Shield, Globe, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const settingsTabs = [
  { id: 'general', label: 'Store Details', icon: Store },
  { id: 'users', label: 'Users & Permissions', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'checkout', label: 'Checkout', icon: Shield },
  { id: 'domain', label: 'Domains', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 h-[600px] flex flex-col gap-0 overflow-hidden">
        <div className="flex flex-1 h-full">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50/50 p-4 space-y-1">
            <h2 className="px-2 text-lg font-semibold mb-4">Settings</h2>
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white text-primary shadow-sm ring-1 ring-gray-200"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white p-6 overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl">
                {settingsTabs.find(t => t.id === activeTab)?.label}
              </DialogTitle>
            </DialogHeader>

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" defaultValue="Shopify Lite Store" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="storeEmail">Store Contact Email</Label>
                    <Input id="storeEmail" defaultValue="admin@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Store Currency</Label>
                    <Input id="currency" defaultValue="USD" disabled />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Manage user access and permissions for your store.</p>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Staff Members</h3>
                      <p className="text-xs text-muted-foreground">Give staff access to your store.</p>
                    </div>
                    <Button variant="outline" size="sm">Add Staff</Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-medium">AD</div>
                        <div>
                          <p className="text-sm font-medium">Admin User</p>
                          <p className="text-xs text-gray-500">admin@example.com</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Owner</span>
                    </div>
                  </div>
                </div>
                {/* Existing users link for full functionality */}
                <div className="mt-4 text-center">
                  <Link href="/admin/settings/users" className="text-sm text-blue-600 hover:underline" onClick={() => onOpenChange(false)}>
                    Go to full User Management page &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Placeholder for other tabs */}
            {['payments', 'checkout', 'domain', 'notifications'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  {settingsTabs.find(t => t.id === activeTab)?.icon({ className: "w-6 h-6 text-gray-400" })}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Settings Unavailable</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    The {settingsTabs.find(t => t.id === activeTab)?.label} settings are currently being implemented.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
