'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { AuthPage } from '@/components/auth/auth-page';
import { SocialMediaPromptModal } from '@/components/admin/social-media-prompt-modal';
import { OtpRouteGuard } from '@/components/auth/otp-route-guard';
// import { HederaVerificationModal } from '@/components/auth/hedera-verification-modal';
import { User } from '@/lib/types';
import { BalanceWidget } from '@/components/ui/balance-widget';

export function AppContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSocialMediaPrompt, setShowSocialMediaPrompt] = useState(false);
  const [hasCheckedSocialMedia, setHasCheckedSocialMedia] = useState(false);
  // const [showHederaVerificationModal, setShowHederaVerificationModal] = useState(false);
  const [hasCheckedHederaVerification, setHasCheckedHederaVerification] = useState(false);
  const [previousSessionId, setPreviousSessionId] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log('AppContent: Session status:', status, 'Session exists:', !!session);

  const isLoading = status === 'loading';
  const isAuthenticated = !!session && !!session.user;
  const user = (session?.user?.userData as User | undefined) || (session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    role: session.user.role || 'user',
    avatar: session.user.image || '/logo.png',
  } as User : undefined);

  console.log('AppContent: isAuthenticated:', isAuthenticated, 'user exists:', !!user, 'user role:', user?.role);

  // Debug session user object
  if (session?.user) {
    console.log('AppContent: Session user keys:', Object.keys(session.user));
    console.log('AppContent: Session user data:', session.user);
    console.log('AppContent: Session user has userData:', !!session.user.userData);
  }

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const hideFooter = pathname === '/validate-user';
  
  // Public routes that don't require authentication
  const publicRoutes = ['/update-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Reset check flags when session changes (new login)
  useEffect(() => {
    const currentSessionId = session?.user?.id || session?.user?.email || null;
    
    if (currentSessionId && currentSessionId !== previousSessionId) {
      // New session detected, reset all check flags
      setHasCheckedSocialMedia(false);
      setHasCheckedHederaVerification(false);
      setPreviousSessionId(currentSessionId);
    }
  }, [session?.user?.id, session?.user?.email, previousSessionId]);

  // Redirect admin users to admin dashboard immediately
  useEffect(() => {
    if (user && user.role === 'admin' && isAuthenticated && !isLoading) {
      // Only redirect if not already on an admin page
      if (!pathname.startsWith('/admin')) {
        console.log('AppContent: Admin user detected, redirecting to /admin');
        router.replace('/admin'); // Use replace instead of push
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);

  // Check for missing social media connections for admin users
  useEffect(() => {
    if (user && user.role === 'admin' && isAuthenticated && !isLoading && !hasCheckedSocialMedia) {
      const userData = user as any; // Cast to any to access social media properties
      const hasMissingSocialMedia = !userData.twitterProfile || !userData.facebookProfile || !userData.discordProfile;
      const isDismissed = localStorage.getItem('socialMediaPromptDismissed') === 'true';

      if (hasMissingSocialMedia && !isDismissed) {
        // Small delay to ensure the admin interface is fully loaded
        const timer = setTimeout(() => {
          setShowSocialMediaPrompt(true);
        }, 1000);

        return () => clearTimeout(timer);
      }

      setHasCheckedSocialMedia(true);
    }
  }, [user, isAuthenticated, isLoading, hasCheckedSocialMedia]);

  // Check for Hedera verification for non-admin users
  // useEffect(() => {
  //   const checkHederaVerification = async () => {
  //     if (user && user.role !== 'admin' && isAuthenticated && !isLoading && !hasCheckedHederaVerification && session?.user?.token) {
  //       try {
  //         const baseUrl = "https://hedera-quests.com";
  //         const response = await fetch(`${baseUrl}/profile/me`, {
  //           method: "GET",
  //           headers: {
  //             Authorization: `Bearer ${session.user.token}`,
  //             "Content-Type": "application/json",
  //           },
  //         });

  //         if (response.ok) {
  //           const data = await response.json();
  //           const needsVerification = !data.user.hederaProfile || !data.user.hederaProfile.hedera_did;
  //           const neverShowAgain = typeof window !== 'undefined' ? localStorage.getItem(`hedera-verification-never-show-${data.user.id}`) === 'true' : false;

  //           // If user has completed verification, clear any existing flags
  //           if (typeof window !== 'undefined' && data.user.hederaProfile && data.user.hederaProfile.hedera_did) {
  //             localStorage.removeItem(`hedera-verification-never-show-${data.user.id}`);
  //           }

  //           // Show modal if user needs verification AND hasn't selected "never show again"
  //           if (needsVerification && !neverShowAgain) {
  //             // Small delay to ensure the user interface is fully loaded
  //             const timer = setTimeout(() => {
  //               setShowHederaVerificationModal(true);
  //             }, 1500);

  //             return () => clearTimeout(timer);
  //           }
  //         }
  //       } catch (error) {
  //         console.error('Failed to check Hedera verification status:', error);
  //       }

  //       setHasCheckedHederaVerification(true);
  //     }
  //   };

  //   checkHederaVerification();
  // }, [user, isAuthenticated, isLoading, hasCheckedHederaVerification, session?.user?.token]);

  // const handleCloseHederaModal = () => {
  //   setShowHederaVerificationModal(false);
  //   setHasCheckedHederaVerification(true);
   
  // };

  // const handleNeverShowHederaModalAgain = () => {
  //   setShowHederaVerificationModal(false);
  //   setHasCheckedHederaVerification(true);
    
   
  //   if (typeof window !== 'undefined' && user?.id) {
  //     localStorage.setItem(`hedera-verification-never-show-${user.id}`, 'true');
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    console.log('AppContent: Not authenticated, showing AuthPage');
    return <AuthPage />;
  }

  if (!user && !isPublicRoute) {
    console.log('AppContent: Session exists but no userData, showing AuthPage');
    return <AuthPage />;
  }

  // If it's a public route, render the children directly
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // At this point, user should be defined for authenticated routes
  if (!user) {
    console.log('AppContent: Unexpected null user for authenticated route');
    return <AuthPage />;
  }

  if (user.role === 'admin') {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={user?.role || 'user'}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Social Media Prompt Modal */}
        <SocialMediaPromptModal
          user={user as any}
          isOpen={showSocialMediaPrompt}
          onClose={() => {
            setShowSocialMediaPrompt(false);
            setHasCheckedSocialMedia(true);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <OtpRouteGuard>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>

        {/* Balance Widget - Shows for all authenticated users except loading states */}
        {isAuthenticated && user && !isLoading && !hideFooter && (
          <BalanceWidget />
        )}
      </OtpRouteGuard>

      {/* Hedera Verification Modal - Shows for non-admin users who need verification */}
      {/* <HederaVerificationModal
        isOpen={showHederaVerificationModal}
        onClose={handleCloseHederaModal}
        onNeverShowAgain={handleNeverShowHederaModalAgain}
      /> */}
    </>
  );
}