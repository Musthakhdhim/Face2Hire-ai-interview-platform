import { useState, type JSX } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Brain, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { forgotPassword, verifyForgotOtp } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import type { AppDispatch } from '../store/store';

type Step = 'email' | 'otp';

export default function ForgotPasswordPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendOtp = async (): Promise<void> => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    const result = await dispatch(forgotPassword(email));
    setIsLoading(false);
    if (forgotPassword.fulfilled.match(result)) {
      toast.success('Verification code sent to your email');
      setStep('otp');
    } else {
      toast.error((result.payload as string) || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    setIsLoading(true);
    const result = await dispatch(verifyForgotOtp({ email, otp }));
    setIsLoading(false);
    if (verifyForgotOtp.fulfilled.match(result)) {
      toast.success('OTP verified. You can now reset your password.');
      navigate('/reset-password', { state: { email } });
    } else {
      toast.error((result.payload as string) || 'Invalid or expired OTP');
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    setIsLoading(true);
    const result = await dispatch(forgotPassword(email));
    setIsLoading(false);
    if (forgotPassword.fulfilled.match(result)) {
      toast.success('New verification code sent to your email');
    } else {
      toast.error((result.payload as string) || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="size-7 text-white" />
          </div>
          <span className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            InterviewAI
          </span>
        </Link>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="size-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <Lock className="size-8 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'email' ? 'Reset Password' : 'Verify Email'}
            </CardTitle>
            <CardDescription>
              {step === 'email'
                ? 'Enter your email to receive a verification code'
                : 'Enter the code sent to your email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">Verification code sent to:</p>
                  <Badge className="bg-indigo-100 text-indigo-700 text-sm px-3 py-1 mt-2">
                    <Mail className="size-3 mr-1" />
                    {email}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 text-center">Enter the 6-digit code</p>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={!otp || isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    Resend verification code
                  </button>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:underline">
                  Back to login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}