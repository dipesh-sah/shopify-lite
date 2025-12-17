'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { verify2FALoginAction, resendOTPAction } from '@/actions/2fa';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function Verify2FAPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verify2FALoginAction(token);

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const res = await resendOTPAction();
      if (res.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setError(res.error || 'Failed to resend code');
      }
    } catch (e) {
      setError('Failed to resend code');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Verify it's you</CardTitle>
          <CardDescription className="text-center">
            We've sent a 6-digit code to your email. Enter it below to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center font-medium">
                {error}
              </div>
            )}
            {resendSuccess && (
              <div className="text-sm text-green-600 text-center font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Code sent successfully!
              </div>
            )}
            <Button className="w-full" type="submit" disabled={loading || token.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">

          <Button
            variant="ghost"
            className="w-full"
            disabled={resending || loading}
            onClick={handleResend}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </Button>

          <Button variant="link" className="w-full text-muted-foreground" onClick={() => router.push('/admin/login')}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
