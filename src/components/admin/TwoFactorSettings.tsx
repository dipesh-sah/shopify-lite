'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Mail, ShieldCheck, AlertTriangle } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import {
  get2FAStatusAction,
  enable2FAAction,
  disable2FAAction
} from '@/actions/2fa';

export function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await get2FAStatusAction();
      if (!res.error) {
        setEnabled(!!res.enabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(checked: boolean) {
    setLoading(true);
    try {
      if (checked) {
        const res = await enable2FAAction();
        if (res.success) setEnabled(true);
        else alert(res.error || 'Failed to enable 2FA');
      } else {
        if (!confirm('Are you sure you want to disable Email 2FA?')) {
          setLoading(false);
          return;
        }
        const res = await disable2FAAction();
        if (res.success) setEnabled(false);
        else alert(res.error || 'Failed to disable 2FA');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-40 items-center justify-center">
      <Loading variant="inline" size="md" />
    </div>
  );

  return (
    <div className="space-y-6 border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Two-Factor Authentication
          </h3>
          <p className="text-sm text-muted-foreground">
            Receive a 6-digit verification code via email every time you log in.
          </p>
        </div>

        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      <div className={`p-4 rounded-md flex items-center gap-3 ${enabled ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
        {enabled ? (
          <ShieldCheck className="h-5 w-5" />
        ) : (
          <AlertTriangle className="h-5 w-5" />
        )}
        <div className="font-medium">
          {enabled ? 'Email 2FA is currently active.' : 'Your account is not protected by 2FA.'}
        </div>
      </div>
    </div>
  );
}
