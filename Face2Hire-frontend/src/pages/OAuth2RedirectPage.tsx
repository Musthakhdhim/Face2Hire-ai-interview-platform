import { useEffect, type JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setOAuthUser } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import type { AppDispatch } from '../store/store';

type Role = 'INTERVIEWEE' | 'INTERVIEWER' | 'ADMIN';

export default function OAuth2RedirectPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken') ?? undefined;
    const role = searchParams.get('role') as Role | null;
    const email = searchParams.get('email') ?? undefined;
    const name = searchParams.get('name') ?? undefined;
    const error = searchParams.get('error');

    if (error) {
      toast.error(
        error === 'email_missing'
          ? 'Could not get your email from the provider.'
          : 'OAuth2 login failed.'
      );
      navigate('/login', { replace: true });
      return;
    }

    if (!token || !role) {
      toast.error('Login failed — no token received.');
      navigate('/login', { replace: true });
      return;
    }

    dispatch(setOAuthUser({ token, refreshToken, role, email, name }));
    toast.success('Logged in successfully!');

    const destination: Record<Role, string> = {
      INTERVIEWEE: '/interviewee',
      INTERVIEWER: '/interviewer',
      ADMIN: '/admin',
    };

    navigate(destination[role] || '/', { replace: true });
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto animate-pulse" />
        <p className="text-gray-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}