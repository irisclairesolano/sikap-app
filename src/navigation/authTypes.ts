export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Register: { role: 'worker' | 'employer' };
  RegisterStep2: {
    role: 'worker' | 'employer';
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
  };
  Login: undefined;
  OTPVerify: { userId: number; email: string; role: 'worker' | 'employer' };
  IDUpload: { userId: number; role: 'worker' | 'employer' };
  PendingVerify: undefined;
  ForgotPassword: undefined;
  Home: undefined; // For verified users
};
