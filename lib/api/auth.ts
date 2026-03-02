import { api, createApiClientWithToken } from './client';
import axios from 'axios';
import type { User } from '@/lib/types';

export type LoginRequest = { email: string; password: string; recaptchaToken?: string };
export type RegisterRequest = { name: string; email: string; password: string; confirmPassword: string; recaptchaToken?: string; referralCode?: string };
export type AuthResponse = { user: User; accessToken: string; refreshToken?: string };

export const AuthService = {
  async login(payload: LoginRequest): Promise<{ user: User; isAdmin: boolean }> {
    console.log('Logging in with:', payload.email);

    try {
      // Direct API call to avoid NextAuth issues
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Login response:', data);

      // Token is now handled by NextAuth session

      // Handle both admin and regular user data structures
      const userData = data.admin || data.user || data;
      const isAdmin = data.is_admin || false;

      // Clean username by removing any brackets like [Admin]
      const cleanUsername = userData.username ? userData.username.replace(/\[.*?\]/g, '').trim() : '';

      // Create comprehensive user object from response data
      const user: User = {
        id: String(userData.id || Date.now()),
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        name: (() => {
          if (isAdmin) {
            // For admins, show full name
            const firstName = userData.firstName || '';
            const lastName = userData.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || cleanUsername || 'Admin';
          } else {
            // For regular users, show username or full name
            const firstName = userData.firstName || '';
            const lastName = userData.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || cleanUsername || 'User';
          }
        })(),
        email: userData.email || payload.email,
        bio: userData.bio || '',
        avatar: '/logo.png',
        hederaAccountId: null,
        // Admin users don't have points
        points: isAdmin ? undefined : (userData.total_points || 0),
        level: userData.userLevel?.level || 1,
        streak: 0,
        joinedAt: userData.created_at || new Date().toISOString(),
        role: isAdmin ? 'admin' : 'user',
        badges: [],
        completedQuests: [],
        userLevel: userData.userLevel,
        facebookProfile: userData.facebookProfile,
        twitterProfile: userData.twitterProfile,
        discordProfile: userData.discordProfile
      };

      return { user, isAdmin };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(payload: RegisterRequest): Promise<{ user: User; token: string }> {
    // Map current UI fields to backend contract at /user/register
    const [firstName, ...rest] = payload.name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;
    const username = payload.email.split('@')[0];
    const body = {
      firstName,
      lastName,
      username,
      email: payload.email,
      password: payload.password,
      bio: '',
      ...(payload.referralCode && { ref: payload.referralCode })
    };

    // Use Next.js API proxy to avoid CORS issues
    console.log('Registering with proxy URL: /user/register');
    console.log('Request body:', body);

    const { data } = await api.post('/user/register', body);

    // Best-effort user construction until backend spec is finalized
    const returnedUser: any = data?.user || data;
    const user: User = {
      id: String(returnedUser?.id ?? Date.now()),
      name: `${firstName} ${lastName}`.trim(),
      email: payload.email,
      avatar: returnedUser?.avatar || '/logo.png',
      hederaAccountId: '',
      points: 0,
      level: 1,
      streak: 0,
      joinedAt: new Date().toISOString(),
      role: 'user',
      badges: [],
      completedQuests: []
    };

    // Return both user and token for OTP verification
    return { 
      user, 
      token: data?.token || data?.accessToken || '' 
    };
  },



  async me(token: string): Promise<{ admin: any; is_admin: boolean }> {
    console.log('Fetching user profile with token');

    const apiWithToken = createApiClientWithToken(token);
    const { data } = await apiWithToken.get('/profile/me');

    console.log('Profile response:', data);
    
    // Check if user not found - this means account was deleted but session is still active
    if (!data.success && data.message === "user not found") {
      throw new Error('User not found - account may have been deleted');
    }
    
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout is handled by NextAuth, API call is optional
      console.log('API logout failed, but NextAuth will handle session cleanup');
    }
  },

  async verifyToken(token: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    console.log('Verifying OTP token:', otpCode);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/profile/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: otpCode })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Invalid verification code' }));
        throw new Error(errorData.message || 'Invalid verification code');
      }

      const data = await response.json();
      console.log('OTP verification response:', data);
      
      return { 
        success: true, 
        message: data.message || 'Email verified successfully' 
      };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  async resendVerificationEmail(token: string): Promise<{ success: boolean; message: string }> {
    console.log('Resending verification email');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/profile/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to resend verification email' }));
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      const data = await response.json();
      console.log('Resend email response:', data);
      
      return { 
        success: true, 
        message: data.message || 'Verification email sent successfully' 
      };
    } catch (error: any) {
      console.error('Resend email error:', error);
      throw error;
    }
  },

  async forgotPassword(payload: { email: string; recaptchaToken?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      
      const response = await fetch(`${apiUrl}/profile/forget-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send reset email' }));
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      const data = await response.json();
      console.log('Forgot password response:', data);
      
      return { 
        success: true, 
        message: data.message || 'Password reset link sent to your email' 
      };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  async updatePassword(payload: { newPassword: string; token: string; recaptchaToken?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      
      const response = await fetch(`${apiUrl}/profile/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update password' }));
        throw new Error(errorData.message || 'Failed to update password');
      }

      const data = await response.json();
      console.log('Update password response:', data);
      
      return { 
        success: true, 
        message: data.message || 'Password updated successfully' 
      };
    } catch (error: any) {
      console.error('Update password error:', error);
      throw error;
    }
  }
};


