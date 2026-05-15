import { useState, useEffect, useRef, useMemo, useCallback, type JSX } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../services/axiosClient';
import { updateUser } from '../store/slices/authSlice';
import type { RootState, AppDispatch } from '../store/store';
import type { AxiosError } from 'axios';
import {
  User, Mail, Phone, Lock, ShieldCheck,
  Camera, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

const PROFILE_CACHE_KEY = 'profileSettingsCache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  timestamp: number;
  profile: {
    fullName: string;
    userName: string;
    email: string;
    phoneNumber: string;
    profileImageUrl: string;
  };
  preferences: {
    defaultInterviewType: string;
    avatarStyle: string;
    language: string;
  };
  notifications: {
    emailUpdates: boolean;
    interviewReminders: boolean;
    marketingEmails: boolean;
  };
}

const saveToCache = (
  profile: CachedData['profile'],
  preferences: CachedData['preferences'],
  notifications: CachedData['notifications']
) => {
  const cache: CachedData = {
    timestamp: Date.now(),
    profile,
    preferences,
    notifications,
  };
  sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
};

const loadFromCache = (): CachedData | null => {
  const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
  if (!cached) return null;
  try {
    const data = JSON.parse(cached) as CachedData;
    if (Date.now() - data.timestamp < CACHE_TTL) {
      return data;
    } else {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
  } catch {
    return null;
  }
};

const clearCache = () => {
  sessionStorage.removeItem(PROFILE_CACHE_KEY);
};

interface UserProfileData {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl: string;
}

interface PreferencesData {
  defaultInterviewType: string;
  avatarStyle: string;
  language: string;
}

interface NotificationsData {
  emailUpdates: boolean;
  interviewReminders: boolean;
  marketingEmails: boolean;
}

interface ErrorResponseData {
  message?: string;
}

export default function ProfileSettingsPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user: reduxUser, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState<boolean>(true);

  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailVerifying, setEmailVerifying] = useState<boolean>(false);
  const [prefSaving, setPrefSaving] = useState<boolean>(false);
  const [notifSaving, setNotifSaving] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [emailUpdateStep, setEmailUpdateStep] = useState<'idle' | 'otpSent'>('idle');
  const [newEmail, setNewEmail] = useState<string>('');
  const [oldEmailOtp, setOldEmailOtp] = useState<string>('');
  const [newEmailOtp, setNewEmailOtp] = useState<string>('');

  const [defaultInterviewType, setDefaultInterviewType] = useState<string>('technical');
  const [avatarStyle, setAvatarStyle] = useState<string>('professional');
  const [language, setLanguage] = useState<string>('english');

  const [emailUpdates, setEmailUpdates] = useState<boolean>(true);
  const [interviewReminders, setInterviewReminders] = useState<boolean>(true);
  const [marketingEmails, setMarketingEmails] = useState<boolean>(false);

  const role = reduxUser?.role?.toLowerCase();
  const showPreferences = role === 'interviewee';
  const tabList = useMemo(() => {
    const tabs = ['profile', 'security', 'notifications'];
    if (showPreferences) tabs.splice(2, 0, 'preferences');
    return tabs;
  }, [showPreferences]);

  const fetchProfileData = useCallback(async (forceRefresh = false): Promise<void> => {
    if (!forceRefresh) {
      const cached = loadFromCache();
      if (cached) {
        setFullName(cached.profile.fullName);
        setUserName(cached.profile.userName);
        setEmail(cached.profile.email);
        setPhoneNumber(cached.profile.phoneNumber);
        setProfileImageUrl(cached.profile.profileImageUrl);
        setDefaultInterviewType(cached.preferences.defaultInterviewType);
        setAvatarStyle(cached.preferences.avatarStyle);
        setLanguage(cached.preferences.language);
        setEmailUpdates(cached.notifications.emailUpdates);
        setInterviewReminders(cached.notifications.interviewReminders);
        setMarketingEmails(cached.notifications.marketingEmails);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const profileRes = await axiosClient.get<{ data: UserProfileData }>('/profile');
      const userData = profileRes.data.data;
      setFullName(userData.fullName || '');
      setUserName(userData.userName || '');
      setEmail(userData.email || '');
      setPhoneNumber(userData.phoneNumber || '');
      setProfileImageUrl(userData.profileImageUrl || '');

      let prefsData: PreferencesData = { defaultInterviewType: 'technical', avatarStyle: 'professional', language: 'english' };
      try {
        const prefsRes = await axiosClient.get<{ data: PreferencesData }>('/profile/preferences');
        prefsData = prefsRes.data.data;
        setDefaultInterviewType(prefsData.defaultInterviewType);
        setAvatarStyle(prefsData.avatarStyle);
        setLanguage(prefsData.language);
      } catch { /* ignore */ }

      const notifRes = await axiosClient.get<{ data: NotificationsData }>('/profile/notifications');
      const notifData = notifRes.data.data;
      setEmailUpdates(notifData.emailUpdates);
      setInterviewReminders(notifData.interviewReminders);
      setMarketingEmails(notifData.marketingEmails);

      saveToCache(userData, prefsData, notifData);
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfileData();
  }, [token, navigate, fetchProfileData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploadProgress(true);
    try {
      const uploadRes = await axiosClient.post<{ data: string }>('/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadRes.data.data;
      setProfileImageUrl(imageUrl);
      toast.success('Profile photo uploaded');

      const updateRes = await axiosClient.put<{ data: UserProfileData }>('/profile/update-profile', {
        fullName,
        phoneNumber,
        profileImageUrl: imageUrl
      });
      const updatedProfile = updateRes.data.data;
      setFullName(updatedProfile.fullName);
      setUserName(updatedProfile.userName);
      setEmail(updatedProfile.email);
      setPhoneNumber(updatedProfile.phoneNumber);
      setProfileImageUrl(updatedProfile.profileImageUrl);
      dispatch(updateUser({ profileImageUrl: imageUrl, name: updatedProfile.fullName, phone: updatedProfile.phoneNumber }));

      clearCache();
      const prefsRes = await axiosClient.get<{ data: PreferencesData }>('/profile/preferences');
      const notifRes = await axiosClient.get<{ data: NotificationsData }>('/profile/notifications');
      saveToCache(
        {
          fullName: updatedProfile.fullName,
          userName: updatedProfile.userName,
          email: updatedProfile.email,
          phoneNumber: updatedProfile.phoneNumber,
          profileImageUrl: updatedProfile.profileImageUrl
        },
        prefsRes.data.data,
        notifRes.data.data
      );
      toast.success('Profile updated with new photo');
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSaveProfile = async (): Promise<void> => {
    setProfileSaving(true);
    try {
      const response = await axiosClient.put<{ data: UserProfileData }>('/profile/update-profile', {
        fullName,
        phoneNumber,
        profileImageUrl
      });
      const updatedProfile = response.data.data;
      setFullName(updatedProfile.fullName);
      setUserName(updatedProfile.userName);
      setEmail(updatedProfile.email);
      setPhoneNumber(updatedProfile.phoneNumber);
      setProfileImageUrl(updatedProfile.profileImageUrl);
      dispatch(updateUser({ name: updatedProfile.fullName, phone: updatedProfile.phoneNumber }));

      clearCache();
      // Refresh cache with new profile data (preferences/notifications unchanged)
      const prefsRes = await axiosClient.get<{ data: PreferencesData }>('/profile/preferences');
      const notifRes = await axiosClient.get<{ data: NotificationsData }>('/profile/notifications');
      saveToCache(
        {
          fullName: updatedProfile.fullName,
          userName: updatedProfile.userName,
          email: updatedProfile.email,
          phoneNumber: updatedProfile.phoneNumber,
          profileImageUrl: updatedProfile.profileImageUrl
        },
        prefsRes.data.data,
        notifRes.data.data
      );
      toast.success('Profile updated');
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePreferences = async (): Promise<void> => {
    setPrefSaving(true);
    const startTime = Date.now();
    try {
      const response = await axiosClient.put<{ data: PreferencesData }>('/profile/preferences', {
        defaultInterviewType,
        avatarStyle,
        language
      });
      const newPrefs = response.data.data;
      setDefaultInterviewType(newPrefs.defaultInterviewType);
      setAvatarStyle(newPrefs.avatarStyle);
      setLanguage(newPrefs.language);

      const cached = loadFromCache();
      if (cached) {
        const updatedCache = {
          ...cached,
          preferences: newPrefs,
          timestamp: Date.now()
        };
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedCache));
      }
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      toast.success('Preferences saved');
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setPrefSaving(false);
    }
  };

  const handleSaveNotifications = async (): Promise<void> => {
    setNotifSaving(true);
    const startTime = Date.now();
    try {
      const response = await axiosClient.put<{ data: NotificationsData }>('/profile/notifications', {
        emailUpdates,
        interviewReminders,
        marketingEmails
      });
      const newNotifs = response.data.data;
      setEmailUpdates(newNotifs.emailUpdates);
      setInterviewReminders(newNotifs.interviewReminders);
      setMarketingEmails(newNotifs.marketingEmails);

      // Update cache directly (only notifications part)
      const cached = loadFromCache();
      if (cached) {
        const updatedCache = {
          ...cached,
          notifications: newNotifs,
          timestamp: Date.now()
        };
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedCache));
      }
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      toast.success('Notification settings saved');
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'Failed to save notification settings');
    } finally {
      setNotifSaving(false);
    }
  };

  // Password change does not affect cached profile data
  const handleChangePassword = async (): Promise<void> => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setProfileSaving(true);
    const startTime = Date.now();
    try {
      await axiosClient.put('/profile/change-password', {
        oldPassword: currentPassword,
        newPassword,
        confirmPassword
      });
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'Password change failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendEmailOtp = async (): Promise<void> => {
    if (!newEmail || newEmail === email) {
      toast.error('Please enter a different valid email');
      return;
    }
    setEmailSending(true);
    try {
      await axiosClient.put('/profile/update-email', { email: newEmail });
      setEmailUpdateStep('otpSent');
      toast.success('Verification codes sent to both email addresses');
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'Failed to send OTPs');
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyAndUpdateEmail = async (): Promise<void> => {
    if (!oldEmailOtp || !newEmailOtp) {
      toast.error('Please enter both OTP codes');
      return;
    }
    setEmailVerifying(true);
    try {
      await axiosClient.put('/profile/update-email/verify-otp', {
        oldEmailOtp,
        newEmailOtp,
        newEmail
      });
      toast.success('Email updated successfully! Please log in again with your new email.');
      clearCache();
      setTimeout(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      const error = err as AxiosError<ErrorResponseData>;
      toast.error(error.response?.data?.message || 'OTP verification failed');
      setEmailVerifying(false);
    }
  };

  const cancelEmailUpdate = (): void => {
    setEmailUpdateStep('idle');
    setNewEmail('');
    setOldEmailOtp('');
    setNewEmailOtp('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${showPreferences ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {tabList.map((tabValue) => (
            <TabsTrigger key={tabValue} value={tabValue} className="capitalize">
              {tabValue === 'profile' ? 'Profile' :
               tabValue === 'security' ? 'Security' :
               tabValue === 'preferences' ? 'Preferences' : 'Notifications'}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="size-24">
                    {profileImageUrl && <AvatarImage src={profileImageUrl} />}
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-2xl">
                      {fullName?.[0]?.toUpperCase() || reduxUser?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full text-white shadow-md hover:bg-indigo-700"
                    disabled={uploadProgress}
                  >
                    {uploadProgress ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size 2MB</p>
                  <p className="text-xs text-gray-400 mt-1">Click camera icon to upload</p>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userName">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input id="userName" value={userName} disabled className="pl-10 bg-gray-50" />
                  </div>
                  <p className="text-xs text-gray-500">Username cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Current Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input id="email" type="email" value={email} disabled className="pl-10 bg-gray-50" />
                  </div>
                  <p className="text-xs text-gray-500">To change email, use the "Update Email" section below</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="button" 
                onClick={handleSaveProfile} 
                disabled={profileSaving}
              >
                {profileSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-indigo-600" />
                Update Email Address
              </CardTitle>
              <CardDescription>Verify your identity with OTP codes sent to both emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailUpdateStep === 'idle' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">New Email Address</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                      placeholder="your.new.email@example.com"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleSendEmailOtp} 
                    disabled={emailSending}
                  >
                    {emailSending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Send OTP Codes
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600">OTP Sent</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">✓ OTP sent to <strong>{email}</strong></p>
                    <p className="text-sm text-gray-700">✓ OTP sent to <strong>{newEmail}</strong></p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldOtp">OTP from Current Email</Label>
                      <Input
                        id="oldOtp"
                        type="text"
                        maxLength={6}
                        value={oldEmailOtp}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newOtp">OTP from New Email</Label>
                      <Input
                        id="newOtp"
                        type="text"
                        maxLength={6}
                        value={newEmailOtp}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleVerifyAndUpdateEmail}
                      disabled={!oldEmailOtp || !newEmailOtp || emailVerifying}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {emailVerifying ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Verify & Update Email
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelEmailUpdate}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="button" onClick={handleChangePassword} disabled={profileSaving}>
                {profileSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {showPreferences && (
          <TabsContent value="preferences" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Default Interview Settings</CardTitle>
                <CardDescription>Set your default preferences for new interviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultType">Default Interview Type</Label>
                    <Select value={defaultInterviewType} onValueChange={setDefaultInterviewType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatarStyle">Avatar Style</Label>
                    <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">👔 Professional</SelectItem>
                        <SelectItem value="friendly">😊 Friendly</SelectItem>
                        <SelectItem value="strict">🧐 Strict</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="button" onClick={handleSavePreferences} disabled={prefSaving}>
                  {prefSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive email updates about your account</p>
                </div>
                <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Interview Reminders</Label>
                  <p className="text-sm text-gray-500">Get reminders for scheduled interviews</p>
                </div>
                <Switch checked={interviewReminders} onCheckedChange={setInterviewReminders} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-gray-500">Receive tips and promotional content</p>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>
              <Button type="button" onClick={handleSaveNotifications} disabled={notifSaving}>
                {notifSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}