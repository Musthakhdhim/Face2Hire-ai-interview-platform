import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyOtp, resendOtp, clearPendingSignup } from '../store/slices/authSlice';
import { Brain, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import type { RootState } from '../store/store'; 
import type { AppDispatch } from '../store/store';

export default function VerifyEmailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { pendingSignup, isLoading } = useSelector((state: RootState) => state.auth);
  const [otp, setOtp] = useState<string>('');

  useEffect(() => {
    if (!pendingSignup) navigate('/signup');
  }, [pendingSignup, navigate]);

  if (!pendingSignup) return null;

  const handleVerify = async () => {
    if (!otp) return toast.error('Enter OTP');
    const result = await dispatch(verifyOtp({ email: pendingSignup.email, otp }));
    if (verifyOtp.fulfilled.match(result)) {
      toast.success('Email verified! You can now login.');
      navigate('/login');
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleResend = async () => {
    const result = await dispatch(resendOtp({ email: pendingSignup.email, type: 'REGISTRATION' }));
    if (resendOtp.fulfilled.match(result)) toast.success('New OTP sent');
    else toast.error(result.payload as string);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="size-7 text-white" />
          </div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <ShieldCheck className="size-12 mx-auto text-indigo-600 mb-2" />
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>We've sent a verification code to</CardDescription>
            <Badge>
              <Mail className="size-3 mr-1" />
              {pendingSignup.email}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Verification Code</Label>
            <Input
              placeholder="000000"
              value={otp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOtp(e.target.value.replace(/\D/g, ''))
              }
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
            <Button
              onClick={handleVerify}
              disabled={!otp || isLoading}
              className="w-full"
            >
              Verify Email
            </Button>
            <div className="text-center">
              <button
                onClick={handleResend}
                className="text-sm text-indigo-600 hover:underline"
              >
                Resend verification code
              </button>
            </div>
            <div className="border-t pt-4 text-center">
              <button
                onClick={() => {
                  dispatch(clearPendingSignup());
                  navigate('/signup');
                }}
                className="text-sm"
              >
                Go back to signup
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}