"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUserNotFoundHandler } from "@/hooks/use-user-not-found";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import { useSearchParams, useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { QuestService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  User as UserIcon,
  Settings,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertCircle,
  Link,
  Twitter,
  Facebook,
  MessageSquare,
  Award,
  Clock,
  XCircle,
  Linkedin,
  Trash2,
  Copy,
  Check,
  Users,
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { formatDistanceToNow } from "date-fns";
import { tr } from "zod/v4/locales";

interface UserStats {
  numberOfBadges: number;
  numberOfquestCompleted: number;
  numberOfquestRejected: number;
  numberOfquestPending: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { apiCall } = useAuthenticatedApi();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerificationSuccess, setEmailVerificationSuccess] =
    useState(false);
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  // const [isConnectingHedera, setIsConnectingHedera] = useState(false);
  const [isConnectingFacebook, setIsConnectingFacebook] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [isValidatingHedera, setIsValidatingHedera] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Referral state
  const [referralData, setReferralData] = useState<any>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [referralPage, setReferralPage] = useState(1);
  const referralLimit = 5; // Show 5 users per page

  // Timer for Hedera DID verification button
  const [hederaMailCooldown, setHederaMailCooldown] = useState<number>(0);
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (profileData?.user?.hederaMail?.last_send) {
      const updateCooldown = () => {
        const lastSend = new Date(
          profileData.user.hederaMail.last_send
        ).getTime();
        const now = Date.now();
        const diff = now - lastSend;
        const cooldown = 10 * 60 * 1000 - diff; 
        setHederaMailCooldown(cooldown > 0 ? cooldown : 0);
      };
      updateCooldown();
      interval = setInterval(updateCooldown, 1000);
    } else {
      setHederaMailCooldown(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [profileData?.user?.hederaMail?.last_send]);

  // console.log("profileData",profileData.user.hederaProfile.hedera_did === "null");

  const { toast } = useToast();

  // Handle tab selection from query params
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && (tab === 'profile' || tab === 'account')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle auto-scroll to social media section
  useEffect(() => {
    const social = searchParams?.get('social');
    if (social && activeTab === 'account') {
      // Wait for the DOM to be ready and the account tab to be visible
      const timer = setTimeout(() => {
        const element = document.getElementById(`social-${social.toLowerCase()}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          // Add a highlight effect
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
          
          // Clear the social parameter from URL after scrolling
          if (searchParams) {
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.delete('social');
            const search = current.toString();
            const query = search ? `?${search}` : "";
            router.replace(`${window.location.pathname}${query}`, { scroll: false });
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, activeTab, router]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (searchParams) {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set('tab', value);
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${window.location.pathname}${query}`);
    }
  };

  const handleVerifyEmail = async () => {
    const email = profileData?.user?.email;
    if (!email || !session?.user?.token) {
      toast({
        title: "Verification Error",
        description: "No email address or session found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingEmail(true);
    setEmailVerificationSuccess(false);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/verify-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to send verification email";
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Verification Email Sent",
          description: "Check your inbox for the verification email.",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        setEmailVerificationSuccess(true);
        setTimeout(() => setEmailVerificationSuccess(false), 5000);
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to send verification email";
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const loadUser = async () => {
    if (!session?.user?.token) {
      console.log("No session token found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use the authenticated API hook for profile data
      const { data } = await apiCall('/profile/me');
      
      setProfileData(data);
      console.log("profileDataaaaa", data);

      // Check if hedera_did is null
      // if (data.user.hederaProfile.hedera_did === "null") {
      //   console.log("Hedera DID is null");
      //   verifyHederaDidEmail();
      // }

      // Create user object from profile data
      const userData: User = {
        id: String(data.user.id),
        name: `${data.user.firstName} ${data.user.lastName}`.trim(),
        email: data.user.email,
        avatar:
          data.user.twitterProfile?.twitter_profile_picture || "/logo.png",
        hederaAccountId: "",
        points: 0,
        level: 1,
        streak: 0,
        joinedAt: data.user.userLevel?.created_at || new Date().toISOString(),
        role: data.is_admin ? "admin" : "user",
        badges: [],
        completedQuests: [],
      };

      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
      setSaveError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!session?.user?.token) {
      console.log("No session token found for stats");
      setUserStats({
        numberOfBadges: 0,
        numberOfquestCompleted: 0,
        numberOfquestRejected: 0,
        numberOfquestPending: 0,
      });
      return;
    }

    try {
      // Use the authenticated API hook for user stats
      const { data } = await apiCall('/user/stats');

      if (data.success && data.stats) {
        setUserStats(data.stats);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to load user stats:", error);
      // Set default stats on error
      setUserStats({
        numberOfBadges: 0,
        numberOfquestCompleted: 0,
        numberOfquestRejected: 0,
        numberOfquestPending: 0,
      });
    }
  };

  const fetchReferralData = async (page: number = 1) => {
    if (!session?.user?.token) {
      console.log("No session token found for referrals");
      return;
    }

    setIsLoadingReferrals(true);
    try {
      const response = await QuestService.getReferralProfile(page, referralLimit, session.user.token);
      if (response.success) {
        setReferralData(response);
      }
    } catch (error) {
      console.error("Failed to load referral data:", error);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  const handleReferralPageChange = (newPage: number) => {
    setReferralPage(newPage);
    fetchReferralData(newPage);
  };

  const handleCopyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode('code');
      setTimeout(() => setCopiedCode(null), 2000);
      
      toast({
        title: "Referral Code Copied!",
        description: `Copied "${code}" to clipboard`,
      });
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy referral code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyReferralLink = async (code: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
      const referralLink = `${baseUrl}/auth/login?ref=${code}`;
      
      await navigator.clipboard.writeText(referralLink);
      setCopiedCode('link');
      setTimeout(() => setCopiedCode(null), 2000);
      
      toast({
        title: "Referral Link Copied!",
        description: `Copied full referral link to clipboard`,
      });
    } catch (err) {
      console.error('Failed to copy referral link:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy referral link to clipboard",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      loadUser();
      fetchUserStats();
      fetchReferralData();
    } else {
      setIsLoading(false);
    }
  }, [session, status]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleConnectTwitter = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Authentication Error",
        description: "Please login to connect your Twitter account.",
        variant: "destructive",
      });
      return;
    }

    setIsConnectingTwitter(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/twitter/url`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to get Twitter authorization URL";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success && data.url) {
        // Show success message before redirect
        toast({
          title: "Connecting to Twitter",
          description: "Redirecting to Twitter authentication...",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Redirect to Twitter authorization URL
        window.location.href = data.url;
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Invalid response from server";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting to Twitter:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Twitter",
        variant: "destructive",
      });
    } finally {
      setIsConnectingTwitter(false);
    }
  };

  const handleConnectHedera = async () => {
    // setIsConnectingHedera(true);
    try {
      const accessToken = session?.user?.token;
      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "No access token found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/hederadid/verify-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to connect to Hedera";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        if (data.url) {
          // Show success message before redirect
          toast({
            title: "Connecting to Hedera",
            description: "Redirecting to Hedera authentication...",
            variant: "default",
            className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
          });
          // Redirect to Hedera authorization URL
          window.location.href = data.url;
        } else {
          // Hedera profile was created/updated successfully without redirect
          toast({
            title: "Hedera Connected",
            description: "Your Hedera profile has been successfully connected.",
            variant: "default",
            className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
          });
          // Refresh profile data to show the updated connection
          await loadUser();
        }
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Invalid response from server";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting to Hedera:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Hedera",
        variant: "destructive",
      });
    } finally {
      console.log("Finished connecting to Hedera");
      // setIsConnectingHedera(false);
    }
  };

  const verifyHederaDidEmail = async () => {
    // setIsConnectingHedera(true);
    try {
      const accessToken = session?.user?.token;
      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "No access token found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(
        `${baseUrl}/profile/hederadid/verify-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to send verification email";
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        if (data.url) {
          // Show success message before redirect
          toast({
            title: "Verification Email Sent",
            description: "Check your email for verification instructions.",
            variant: "default",
            className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
          });
          // Redirect to verification URL
          window.location.href = data.url;
        } else {
          // Show success message for email sent (no redirect)
          toast({
            title: "Verification Email Sent",
            description: "Check your email for verification instructions.",
            variant: "default",
            className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
          });
          // Optionally reload profile data to reflect any changes
          loadUser();
        }
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Invalid response from server";
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying Hedera DID email:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      console.log("Finished Hedera DID email verification");
      // setIsConnectingHedera(false);
    }
  };

  const handleConnectFacebook = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Authentication Error",
        description: "Please login to connect your Facebook account.",
        variant: "destructive",
      });
      return;
    }

    setIsConnectingFacebook(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/facebook/url`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to get Facebook authorization URL";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success && data.url) {
        // Show success message before redirect
        toast({
          title: "Connecting to Facebook",
          description: "Redirecting to Facebook authentication...",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Redirect to Facebook authorization URL
        window.location.href = data.url;
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Invalid response from server";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting to Facebook:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Facebook",
        variant: "destructive",
      });
    } finally {
      setIsConnectingFacebook(false);
    }
  };

  const handleDisconnectTwitter = async () => {
    if (!session?.user?.token) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/twitter/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Twitter Disconnected",
          description:
            "Your Twitter account has been successfully disconnected.",
          variant: "default",
          className:
            "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Refresh profile data
        await loadUser();
      } else {
        const data = await response.json();
        toast({
          title: "Failed to disconnect Twitter",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to disconnect Twitter",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectFacebook = async () => {
    if (!session?.user?.token) return;

    try {
      const baseUrl =process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/facebook/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Facebook Disconnected",
          description:
            "Your Facebook account has been successfully disconnected.",
          variant: "default",
          className:
            "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Refresh profile data
        await loadUser();
      } else {
        const data = await response.json();
        toast({
          title: "Failed to disconnect Facebook",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to disconnect Facebook",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleConnectDiscord = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Authentication Error",
        description: "Please login to connect your Discord account.",
        variant: "destructive",
      });
      return;
    }

    setIsConnectingDiscord(true);
    try {
      const baseUrl =process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/discord/url`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to get Discord authorization URL";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success && data.url) {
        // Show success message before redirect
        toast({
          title: "Connecting to Discord",
          description: "Redirecting to Discord authentication...",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Redirect to Discord authorization URL
        window.location.href = data.url;
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Invalid response from server";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting to Discord:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Discord",
        variant: "destructive",
      });
    } finally {
      setIsConnectingDiscord(false);
    }
  };

  const handleDisconnectDiscord = async () => {
    if (!session?.user?.token) return;

    try {
      const baseUrl =process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/discord/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Discord Disconnected",
          description:
            "Your Discord account has been successfully disconnected.",
          variant: "default",
          className:
            "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Refresh profile data
        await loadUser();
      } else {
        const data = await response.json();
        toast({
          title: "Failed to disconnect Discord",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to disconnect Discord",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Authentication Error",
        description: "Please login to connect your LinkedIn account.",
        variant: "destructive",
      });
      return;
    }

    setIsConnectingLinkedIn(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/linked-in/url`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user?.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to get LinkedIn authorization URL";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success && data.result) {
        // Show success message before redirect
        toast({
          title: "Connecting to LinkedIn",
          description: "Redirecting to LinkedIn authentication...",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Redirect to LinkedIn authorization URL
        window.location.href = data.result;
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Invalid response from server";
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting to LinkedIn:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to LinkedIn",
        variant: "destructive",
      });
    } finally {
      setIsConnectingLinkedIn(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!session?.user?.token) return;

    try {
      const baseUrl =process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/linkedin/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "LinkedIn Disconnected",
          description:
            "Your LinkedIn account has been successfully disconnected.",
          variant: "default",
          className:
            "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Refresh profile data
        await loadUser();
      } else {
        const data = await response.json();
        toast({
          title: "Failed to disconnect LinkedIn",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to disconnect LinkedIn",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleValidateHedera = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Authentication Error",
        description: "Please login to validate your Hedera account.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingHedera(true);
    try {
      const baseUrl =process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/profile/hederadid/validate-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to validate Hedera account";
        toast({
          title: "Validation Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Hedera Validated",
          description: "Your Hedera account has been successfully validated.",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        // Refresh profile data to show the updated validation status
        await loadUser();
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to validate Hedera account";
        toast({
          title: "Validation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating Hedera:", error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate Hedera account",
        variant: "destructive",
      });
    } finally {
      setIsValidatingHedera(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Authentication Error",
        description: "Please login to delete your account.",
        variant: "destructive",
      });
      return;
    }

    if (deleteConfirmText.toLowerCase() !== "delete my account") {
      toast({
        title: "Confirmation Error",
        description: "Please type 'delete my account' exactly to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const baseUrl =process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      const response = await fetch(`${baseUrl}/user/remove-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to delete account";
        toast({
          title: "Deletion Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted. Logging out...",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
        });
        
        // Sign out and redirect to home page
        setTimeout(async () => {
          await signOut({ callbackUrl: "/" });
        }, 1500);
      } else {
        // Handle backend error responses
        const errorMessage = (typeof data?.data === 'string' ? data.data : data?.message) || "Failed to delete account";
        toast({
          title: "Deletion Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
      setDeleteConfirmText("");
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Please log in to view your profile.
        </p>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 hover:border-solid transition-all duration-200">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full border-2 border-dashed border-primary/30" />
              <Avatar className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border-2 border-solid border-background shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <AvatarImage src={profileData?.user?.profilePicture || ""} />
                <AvatarFallback className="text-lg sm:text-xl lg:text-2xl font-mono bg-gradient-to-r from-primary/10 to-purple-500/10">
                  {getInitials(
                    profileData?.user?.firstName && profileData?.user?.lastName
                      ? `${profileData.user.firstName} ${profileData.user.lastName}`
                      : profileData?.user?.username || "User"
                  )}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent leading-tight">
                {profileData?.user?.firstName && profileData?.user?.lastName
                  ? `${profileData.user.firstName} ${profileData.user.lastName}`
                  : profileData?.user?.username || "User"}
              </h1>
              <p className="text-muted-foreground font-mono text-xs sm:text-sm px-2">
                {">"} Member since{" "}
                {profileData?.user?.userLevel?.created_at
                  ? formatDistanceToNow(new Date(profileData.user.userLevel.created_at), {
                      addSuffix: true,
                    })
                  : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger
            value="profile"
            className="font-mono text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:border data-[state=active]:border-dashed data-[state=active]:border-primary/30 data-[state=active]:text-primary transition-all duration-200 py-2 px-2 sm:px-4"
          >
            PROFILE
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="font-mono text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:border data-[state=active]:border-dashed data-[state=active]:border-primary/30 data-[state=active]:text-primary transition-all duration-200 py-2 px-2 sm:px-4"
          >
            ACCOUNT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 sm:space-y-6">{/* Profile content continues... */}
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 hover:border-solid transition-all duration-200">
            <CardHeader className="border-b border-dashed border-primary/20 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 font-mono text-sm sm:text-base lg:text-lg">
                <div className="p-1 bg-primary/10 rounded border border-dashed border-primary/30">
                  <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                {">"} PROFILE_INFORMATION
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs sm:text-sm text-primary">
                      FULL_NAME
                    </Label>
                    <div className="p-2 sm:p-3 border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-md">
                      <p className="font-mono text-xs sm:text-sm">
                        {profileData?.user?.firstName &&
                        profileData?.user?.lastName
                          ? `${profileData.user.firstName} ${profileData.user.lastName}`
                          : profileData?.user?.username || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs sm:text-sm text-primary">
                      EMAIL_ADDRESS
                    </Label>
                    <div className="p-2 sm:p-3 border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-md">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="font-mono text-xs sm:text-sm break-all sm:break-normal flex-1 min-w-0">
                          {profileData?.user?.email || "Not provided"}
                        </p>
                        {profileData?.user?.email && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {profileData?.user?.email_verified ? (
                              <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-dashed border-green-500/50 font-mono text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                VERIFIED
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-dashed border-yellow-500/50 font-mono text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  UNVERIFIED
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 sm:h-7 px-2 text-xs font-mono border-dashed border-primary/50 hover:border-solid"
                                  onClick={handleVerifyEmail}
                                  disabled={isVerifyingEmail}
                                >
                                  {isVerifyingEmail ? "SENDING..." : "VERIFY"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Profile Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-sm text-primary">
                      USERNAME
                    </Label>
                    <div className="p-3 border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-md">
                      <p className="font-mono text-sm">
                        {profileData?.user?.username || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Section */}
                {profileData?.user?.referral_code && (
                  <div id="social-referral" className="space-y-2">
                    <Label className="font-mono text-sm text-primary flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      REFERRAL
                    </Label>
                    <div className="p-4 border-2 border-dashed border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-md space-y-3">
                      {/* Referral Code Display */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          {/* <p className="text-xs text-muted-foreground font-mono mb-1">
                            Your Referral Code:
                          </p> */}
                          <Badge 
                            variant="outline" 
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-sm px-3 py-1"
                          >
                            {profileData.user.referral_code}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyReferralCode(profileData.user.referral_code)}
                            className="font-mono gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 text-xs h-8"
                          >
                            {copiedCode === 'code' ? (
                              <>
                                <Check className="h-3 w-3" />
                                COPIED
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                COPY_CODE
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyReferralLink(profileData.user.referral_code)}
                            className="font-mono gap-1 border-teal-500/20 text-teal-600 hover:bg-teal-500/10 text-xs h-8"
                          >
                            {copiedCode === 'link' ? (
                              <>
                                <Check className="h-3 w-3" />
                                COPIED
                              </>
                            ) : (
                              <>
                                <Link className="h-3 w-3" />
                                COPY_LINK
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Referral Stats & Users List */}
                      {referralData && (
                        <>
                          <div className="pt-3 border-t border-dashed border-emerald-500/20">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-4">
                                <p className="text-xs text-muted-foreground font-mono">
                                  Total Referrals:
                                </p>
                                <p className="text-lg font-bold font-mono text-emerald-600">
                                  {referralData.countReferral || 0}
                                </p>
                              </div>
                             
                            </div>

                            {/* Referred Users List */}
                            {referralData.referredUsers && referralData.referredUsers.length > 0 && (
                              <div className="space-y-2">
                                {referralData.referredUsers.map((referredUser: any) => (
                                  <div 
                                    key={referredUser.id}
                                    className="flex items-center gap-3 p-2 bg-emerald-500/5 rounded-lg border border-dashed border-emerald-500/20 hover:bg-emerald-500/10 transition-colors"
                                  >
                                    <Avatar className="w-8 h-8 border border-dashed border-emerald-500/30">
                                      <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-mono text-xs">
                                        {referredUser.firstName?.charAt(0) || referredUser.username?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium font-mono text-xs truncate">
                                        {referredUser.firstName && referredUser.lastName 
                                          ? `${referredUser.firstName} ${referredUser.lastName}`
                                          : referredUser.username || 'User'}
                                      </p>
                                      <p className="text-xs text-muted-foreground font-mono truncate">
                                        @{referredUser.username || `user${referredUser.id}`}
                                      </p>
                                    </div>
                                    <div className="text-right flex items-center gap-1">
                                      <Badge 
                                        variant="outline" 
                                        className="bg-teal-500/10 text-teal-600 border-teal-500/20 font-mono text-xs"
                                      >
                                        {referredUser.total_points || 0} pts
                                      </Badge>
                                      {referredUser.email_verified && (
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {/* Pagination Controls */}
                                {referralData.numberOfPages > 1 && (
                                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-emerald-500/20">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleReferralPageChange(referralPage - 1)}
                                      disabled={referralPage === 1 || isLoadingReferrals}
                                      className="font-mono gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 text-xs h-7 px-2"
                                    >
                                      ← PREV
                                    </Button>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      Page {referralPage} of {referralData.numberOfPages}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleReferralPageChange(referralPage + 1)}
                                      disabled={referralPage === referralData.numberOfPages || isLoadingReferrals}
                                      className="font-mono gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 text-xs h-7 px-2"
                                    >
                                      NEXT →
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Info text */}
                      <p className="text-xs text-muted-foreground font-mono pt-2 border-t border-dashed border-emerald-500/20">
                        [INFO] Share your referral link with friends to earn rewards when they join!
                      </p>
                    </div>
                  </div>
                )}

                {profileData?.user?.role && (
                  <div className="space-y-2">
                    <Label className="font-mono text-sm text-primary">
                      ACCOUNT_TYPE
                    </Label>
                    <div className="p-3 border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-md">
                      <Badge
                        className={`font-mono ${
                          profileData.user.role === "admin"
                            ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-dashed border-red-500/50"
                            : "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-dashed border-blue-500/50"
                        }`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {profileData.user.role.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
                {saveError && (
                  <Alert className="border-2 border-dashed border-destructive/50 bg-destructive/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-mono text-sm">
                      {">"} {saveError}
                    </AlertDescription>
                  </Alert>
                )}

                {emailVerificationSuccess && (
                  <Alert className="border-2 border-dashed border-blue-500/50 bg-blue-500/5">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="font-mono text-sm text-blue-700 dark:text-blue-300">
                      {">"} Verification email sent! Check your inbox.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6`}>
            {/* Badges */}
            <Card className="border-2 border-dashed border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 hover:border-solid transition-all duration-200">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg border border-dashed border-yellow-500/30 w-fit mx-auto mb-2">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {userStats?.numberOfBadges ?? "0"}
                </div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider leading-tight">
                  BADGES_EARNED
                </div>
              </CardContent>
            </Card>

            {/* Completed Quests */}
            <Card className="border-2 border-dashed border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:border-solid transition-all duration-200">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg border border-dashed border-green-500/30 w-fit mx-auto mb-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  {userStats?.numberOfquestCompleted ?? "0"}
                </div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider leading-tight">
                  QUESTS_COMPLETED
                </div>
              </CardContent>
            </Card>

            {/* Pending Quests */}
            <Card className="border-2 border-dashed border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 hover:border-solid transition-all duration-200">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg border border-dashed border-blue-500/30 w-fit mx-auto mb-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {userStats?.numberOfquestPending ?? "0"}
                </div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider leading-tight">
                  QUESTS_PENDING
                </div>
              </CardContent>
            </Card>

            {/* Rejected Quests */}
            <Card className="border-2 border-dashed border-red-500/20 bg-gradient-to-br from-red-500/5 to-pink-500/5 hover:border-solid transition-all duration-200">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-1.5 sm:p-2 bg-red-500/10 rounded-lg border border-dashed border-red-500/30 w-fit mx-auto mb-2">
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                  {userStats?.numberOfquestRejected ?? "0"}
                </div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider leading-tight">
                  QUESTS_REJECTED
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 sm:space-y-6">
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 hover:border-solid transition-all duration-200">
            <CardHeader className="border-b border-dashed border-primary/20 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 font-mono text-sm sm:text-base lg:text-lg">
                <div className="p-1 bg-primary/10 rounded border border-dashed border-primary/30">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                {">"} ACCOUNT_SETTINGS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
              {/* hedera Integration */}

              <div 
                id="social-hedera"
                className="border-2 border-dashed border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 hover:border-solid transition-all duration-200 rounded-lg p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-semibold text-pink-600 dark:text-purple-400 uppercase tracking-wider text-sm">
                      {">"} IDTrust_Verification
                    </h3>
                    {profileData?.user?.hederaProfile ? (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                        [CONNECTED] @{profileData.user.firstName}
                        {profileData.user.lastName}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                        [DISCONNECTED] Link your Hedera account to verify social
                        media quests
                      </p>
                    )}
                  </div>
                  {profileData?.user?.hederaProfile ? (
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-dashed border-green-500/50 font-mono">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        CONNECTED
                      </Badge>
                      {profileData?.user?.hederaProfile.hedera_did ? (
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-dashed border-green-500/50 font-mono text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          VERIFIED
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-dashed border-yellow-500/50 font-mono text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            UNVERIFIED
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs font-mono border-dashed border-primary/50 hover:border-solid"
                            onClick={verifyHederaDidEmail}
                            disabled={hederaMailCooldown > 0}
                          >
                            {hederaMailCooldown > 0
                              ? `VERIFY (${Math.floor(
                                  hederaMailCooldown / 60000
                                )}:${String(
                                  Math.floor(
                                    (hederaMailCooldown % 60000) / 1000
                                  )
                                ).padStart(2, "0")})`
                              : Date.now() -
                                  new Date(
                                    profileData?.user?.hederaMail?.last_send
                                  ).getTime() >
                                10 * 60 * 1000
                              ? "RESEND"
                              : "VERIFY"}
                          </Button>
                          {profileData?.user?.hederaProfile && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs font-mono border-dashed border-blue-500/50 hover:border-solid"
                              onClick={handleValidateHedera}
                              disabled={isValidatingHedera}
                            >
                              {isValidatingHedera ? "VALIDATING..." : "VALIDATE"}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* ) : (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-dashed border-yellow-500/50 font-mono text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  UNVERIFIED
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs font-mono border-dashed border-primary/50 hover:border-solid"
                                  onClick={handleVerifyEmail}
                                  disabled={isVerifyingEmail}
                                >
                                  {isVerifyingEmail ? 'SENDING...' : 'VERIFY'}
                                </Button>
                              </div> */}
                    </div>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-dashed border-gray-500/50 font-mono">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      NOT_CONNECTED
                    </Badge>
                  )}
                </div>

                {profileData?.user?.hederaProfile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-dashed border-blue-500/30">
                      <Avatar className="w-10 h-10 border border-dashed border-blue-500/50">
                        <AvatarImage
                          src={
                            profileData.user.hederaProfile
                              .twitter_profile_picture
                          }
                        />
                        <AvatarFallback className="font-mono">@</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium font-mono">
                          @{profileData.user.firstName}
                          {profileData.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          ID: {profileData.user.hederaProfile.hedera_id}
                        </p>
                      </div>
                    </div>
                    {/* <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-blue-500/50 hover:border-solid font-mono"
                        onClick={() => window.open(`https://twitter.com/${profileData.user.twitterProfile.twitter_username}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 border-dashed border-red-500/50 hover:border-solid font-mono"
                        onClick={handleDisconnectTwitter}
                      >
                        <Link className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div> */}
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-gray-400 hover:bg-gray-600 text-white border-dashed border-blue-600/50 hover:border-solid font-mono"
                        onClick={handleConnectHedera}
                        disabled={profileData?.user?.hederaProfile}
                      >
                        {/* logo hedera */}

                        <img
                          src="/icon.png"
                          alt="Hedera Logo"
                          className="w-4 h-4 mr-1"
                        />
                        {isConnectingTwitter
                          ? "CONNECTING..."
                          : "CONNECT_HEDERA"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-gray-500/50 font-mono"
                        disabled
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                    {/* <p className="text-xs text-muted-foreground mt-2 font-mono">
                      [INFO] Connecting your Twitter account allows you to
                      participate in social media quests and earn additional
                      rewards.
                    </p> */}
                  </div>
                )}
              </div>

              {/* Social Media Integration */}
              <div 
                id="social-twitter"
                className="border-2 border-dashed border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 hover:border-solid transition-all duration-200 rounded-lg p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-xs sm:text-sm break-words">
                      {">"} TWITTER_INTEGRATION
                    </h3>
                    {profileData?.user?.twitterProfile ? (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                        [CONNECTED] @
                        {profileData.user.twitterProfile.twitter_username}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                        [DISCONNECTED] Link your Twitter account to verify
                        social media quests
                      </p>
                    )}
                  </div>
                  {profileData?.user?.twitterProfile ? (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-dashed border-green-500/50 font-mono text-xs shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      CONNECTED
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-dashed border-gray-500/50 font-mono text-xs shrink-0">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      NOT_CONNECTED
                    </Badge>
                  )}
                </div>

                {profileData?.user?.twitterProfile ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-dashed border-blue-500/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 shrink-0 border border-dashed border-blue-500/50">
                          <AvatarImage
                            src={
                              profileData.user.twitterProfile
                                .twitter_profile_picture
                            }
                          />
                          <AvatarFallback className="font-mono">@</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium font-mono text-sm break-all">
                            @{profileData.user.twitterProfile.twitter_username}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                            ID: {profileData.user.twitterProfile.twitter_id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-blue-500/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() =>
                          window.open(
                            `https://twitter.com/${profileData.user.twitterProfile.twitter_username}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-dashed border-red-500/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={handleDisconnectTwitter}
                      >
                        <Link className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white border-dashed border-blue-600/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={handleConnectTwitter}
                        disabled={isConnectingTwitter}
                      >
                        <Twitter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {isConnectingTwitter
                          ? "CONNECTING..."
                          : "CONNECT_TWITTER"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-gray-500/50 font-mono text-xs sm:text-sm h-8 sm:h-9"
                        disabled
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      [INFO] Connecting your Twitter account allows you to
                      participate in social media quests and earn additional
                      rewards.
                    </p>
                  </div>
                )}
              </div>

              {/* Facebook Integration */}
              <div 
                id="social-facebook"
                className="border-2 border-dashed border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 hover:border-solid transition-all duration-200 rounded-lg p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs sm:text-sm break-words">
                      {">"} FACEBOOK_INTEGRATION
                    </h3>
                    {profileData?.user?.facebookProfile ? (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                        [CONNECTED]{" "}
                        {profileData.user.facebookProfile.facebook_name}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                        [DISCONNECTED] Link your Facebook account to verify
                        social media quests
                      </p>
                    )}
                  </div>
                  {profileData?.user?.facebookProfile ? (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-dashed border-green-500/50 font-mono text-xs shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      CONNECTED
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-dashed border-gray-500/50 font-mono text-xs shrink-0">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      NOT_CONNECTED
                    </Badge>
                  )}
                </div>

                {profileData?.user?.facebookProfile ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-indigo-500/10 rounded-lg border border-dashed border-indigo-500/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 shrink-0 border border-dashed border-indigo-500/50">
                          <AvatarImage
                            src={
                              profileData.user.facebookProfile
                                .facebook_profile_picture
                            }
                          />
                          <AvatarFallback className="font-mono">
                            FB
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium font-mono text-sm break-all">
                            {profileData.user.facebookProfile.firstname}{" "}
                            {profileData.user.facebookProfile.lastname}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                            ID: {profileData.user.facebookProfile.facebook_id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-indigo-500/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() =>
                          window.open(
                            `https://facebook.com/${profileData.user.facebookProfile.facebook_id}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-dashed border-red-500/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={handleDisconnectFacebook}
                      >
                        <Link className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-dashed border-blue-700/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={handleConnectFacebook}
                        disabled={isConnectingFacebook}
                      >
                        <Facebook className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {isConnectingFacebook
                          ? "CONNECTING..."
                          : "CONNECT_FACEBOOK"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-gray-500/50 font-mono text-xs sm:text-sm h-8 sm:h-9"
                        disabled
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      [INFO] Connecting your Facebook account allows you to
                      participate in social media quests and earn additional
                      rewards.
                    </p>
                  </div>
                )}
              </div>

              {/* Discord Integration */}
              <Card 
                id="social-discord"
                className="border-2 border-dashed border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/5 to-indigo-600/5 hover:border-solid transition-all duration-200"
              >
                <CardHeader className="border-b border-dashed border-[#5865F2]/30 bg-gradient-to-r from-[#5865F2]/5 to-transparent p-3 sm:p-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 font-mono">
                    <span className="flex items-center gap-2 flex-1 min-w-0">
                      <SiDiscord className="w-4 h-4 sm:w-5 sm:h-5 text-[#5865F2] shrink-0" />
                      <span className="text-xs sm:text-sm break-words">[DISCORD_INTEGRATION]</span>
                    </span>
                    <Badge
                      variant="secondary"
                      className="border border-dashed border-[#5865F2]/50 bg-[#5865F2]/10 text-[#5865F2] font-mono text-xs shrink-0"
                    >
                      {profileData?.user?.discordProfile
                        ? "[CONNECTED]"
                        : "[NOT_CONNECTED]"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-6 p-3 sm:p-6">
                  {profileData?.user?.discordProfile ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-purple-600/10 rounded-lg border border-dashed border-purple-600/30">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 shrink-0 border border-dashed border-purple-600/50">
                            <AvatarImage
                              src={profileData.user.discordProfile.discord_picture 
        ? `https://cdn.discordapp.com/avatars/${profileData.user.discordProfile.discord_id}/${profileData.user.discordProfile.discord_picture}.png`
        : undefined
      }
                            />
                            <AvatarFallback className="font-mono">
                              DC
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium font-mono text-sm break-all">
                              {profileData.user.discordProfile.discord_username}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                              ID: {profileData.user.discordProfile.discord_id}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-dashed border-purple-600/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                          onClick={() =>
                            window.open(
                              `https://discord.com/users/${profileData.user.discordProfile.discord_id}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-dashed border-red-500/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                          onClick={handleDisconnectDiscord}
                        >
                          <Link className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white border-dashed border-purple-700/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                          onClick={handleConnectDiscord}
                          disabled={isConnectingDiscord}
                        >
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {isConnectingDiscord
                            ? "CONNECTING..."
                            : "CONNECT_DISCORD"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-dashed border-gray-500/50 font-mono text-xs sm:text-sm h-8 sm:h-9"
                          disabled
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          View Profile
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">
                        [INFO] Connecting your Discord account allows you to
                        participate in social media quests and earn additional
                        rewards.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* LinkedIn Integration */}
              <div 
                id="social-linkedin"
                className="border-2 border-dashed border-[#0077B5]/30 bg-gradient-to-br from-[#0077B5]/5 to-blue-600/5 hover:border-solid transition-all duration-200 rounded-lg p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-semibold text-[#0077B5] dark:text-[#0077B5] uppercase tracking-wider text-xs sm:text-sm break-words">
                      {">"} LINKEDIN_INTEGRATION
                    </h3>
                    {profileData?.user?.linkedInProfile ? (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                        [CONNECTED] {profileData.user.linkedInProfile.linked_in_username}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                        [DISCONNECTED] Link your LinkedIn account to verify
                        professional quests
                      </p>
                    )}
                  </div>
                  {profileData?.user?.linkedInProfile ? (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-dashed border-green-500/50 font-mono text-xs shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      CONNECTED
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-dashed border-gray-500/50 font-mono text-xs shrink-0">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      NOT_CONNECTED
                    </Badge>
                  )}
                </div>

                {profileData?.user?.linkedInProfile ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[#0077B5]/10 rounded-lg border border-dashed border-[#0077B5]/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 shrink-0 border border-dashed border-[#0077B5]/50">
                          <AvatarImage
                            src={
                              profileData.user.linkedInProfile
                                .linked_in_profile_picture
                            }
                          />
                          <AvatarFallback className="font-mono">LI</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium font-mono text-sm break-all">
                            {profileData.user.linkedInProfile.linked_in_username}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                            ID: {profileData.user.linkedInProfile.linked_in_id || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-[#0077B5]/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => {
                          if (profileData.user.linkedInProfile.linked_in_id) {
                            window.open(
                              `https://linkedin.com/in/${profileData.user.linkedInProfile.linked_in_id}`,
                              "_blank"
                            );
                          } else {
                            window.open("https://linkedin.com", "_blank");
                          }
                        }}
                        disabled={!profileData.user.linkedInProfile.linked_in_id}
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-dashed border-red-500/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={handleDisconnectLinkedIn}
                      >
                        <Link className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-[#0077B5] hover:bg-[#0077B5]/90 text-white border-dashed border-[#0077B5]/50 hover:border-solid font-mono text-xs sm:text-sm h-8 sm:h-9"
                        onClick={handleConnectLinkedIn}
                        disabled={isConnectingLinkedIn}
                      >
                        <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {isConnectingLinkedIn
                          ? "CONNECTING..."
                          : "CONNECT_LINKEDIN"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-gray-500/50 font-mono text-xs sm:text-sm h-8 sm:h-9"
                        disabled
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      [INFO] Connecting your LinkedIn account allows you to
                      participate in professional quests and earn additional
                      rewards.
                    </p>
                  </div>
                )}
              </div>              {/* Email Verification */}
              <div
                className={`border-2 border-dashed hover:border-solid transition-all duration-200 rounded-lg p-3 sm:p-4 ${
                  profileData?.user?.email_verified
                    ? "border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5"
                    : "border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-yellow-500/5"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-mono font-semibold uppercase tracking-wider text-xs sm:text-sm break-words ${
                        profileData?.user?.email_verified
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {">"} EMAIL_VERIFICATION
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                      [EMAIL] {profileData?.user?.email || "No email set"}
                    </p>
                  </div>
                  <Badge
                    className={`border border-dashed font-mono text-xs shrink-0 ${
                      profileData?.user?.email_verified
                        ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50"
                        : "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50"
                    }`}
                  >
                    {profileData?.user?.email_verified ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        VERIFIED
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        VERIFY_REQUIRED
                      </>
                    )}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {!profileData?.user?.email_verified && (
                    <>
                      <div className="flex">
                        <Button
                          type="button"
                          onClick={handleVerifyEmail}
                          disabled={
                            isVerifyingEmail || !profileData?.user?.email
                          }
                          className="font-mono border-2 border-dashed border-orange-500/50 hover:border-solid hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm h-8 sm:h-9"
                        >
                          {isVerifyingEmail
                            ? "SENDING..."
                            : "SEND_VERIFICATION_EMAIL"}
                        </Button>
                      </div>
                      {emailVerificationSuccess && (
                        <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded border border-dashed border-green-500/30">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-mono">
                            {">"} Email sent successfully! Check your inbox.
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        [INFO] Verify your email address to receive important
                        notifications and updates.
                      </p>
                    </>
                  )}
                  {profileData?.user?.email_verified && (
                    <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded border border-dashed border-green-500/30">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-mono">
                        {">"} Your email address has been verified successfully!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="border-2 border-dashed border-red-500/30 bg-gradient-to-br from-red-500/5 to-pink-500/5 hover:border-solid transition-all duration-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider text-xs sm:text-sm break-words">
                      {">"} DANGER_ZONE
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                      [WARNING] Permanently delete your account and all data
                    </p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border border-dashed border-red-500/50 font-mono text-xs shrink-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    DESTRUCTIVE
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="p-3 border border-dashed border-red-500/30 bg-red-500/10 rounded-lg">
                    <div className="flex items-start gap-2 text-red-600 dark:text-red-400 mb-2">
                      <Trash2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-semibold text-xs uppercase tracking-wider">
                        Account Deletion
                      </span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      This action cannot be undone. This will permanently delete your account, all your data, quest progress, badges, and social media connections.
                    </p>
                  </div>
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="font-mono border-2 border-dashed border-red-500/50 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        DELETE_ACCOUNT
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-sm sm:max-w-md font-mono border-2 border-dashed border-red-500/30 bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20 mx-4">
                      <AlertDialogHeader className="text-center space-y-4">
                        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-dashed border-red-500/30">
                          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent break-words">
                          [DELETE_ACCOUNT_CONFIRMATION]
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="text-xs sm:text-sm text-muted-foreground space-y-3">
                            <div className="p-3 border border-dashed border-red-500/30 bg-gradient-to-r from-red-500/5 to-pink-500/5 rounded-lg">
                              <div className="flex items-start gap-2 text-red-600 dark:text-red-400 mb-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="font-semibold text-xs uppercase tracking-wider">
                                  PERMANENT ACTION
                                </span>
                              </div>
                              <p className="text-xs text-red-600 dark:text-red-400">
                                This action cannot be undone. All your data, including quest progress, badges, and social media connections will be permanently deleted.
                              </p>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="delete-confirmation" className="font-mono text-xs sm:text-sm text-red-600 dark:text-red-400">
                            TYPE_TO_CONFIRM
                          </Label>
                          <Input
                            id="delete-confirmation"
                            placeholder="delete my account"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="font-mono border-dashed border-red-500/50 focus:border-solid focus:border-red-500 text-xs sm:text-sm h-8 sm:h-9"
                          />
                          <p className="text-xs text-muted-foreground font-mono">
                            [INPUT] Type "delete my account" to confirm
                          </p>
                        </div>
                        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <AlertDialogCancel 
                            className="font-mono border-dashed border-gray-500/50 hover:border-solid transition-all duration-200 text-xs sm:text-sm h-8 sm:h-9 order-2 sm:order-1"
                            onClick={() => {
                              setDeleteConfirmText("");
                              setIsDeleteDialogOpen(false);
                            }}
                          >
                            CANCEL
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeletingAccount || deleteConfirmText.toLowerCase() !== "delete my account"}
                            className="font-mono bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm h-8 sm:h-9 order-1 sm:order-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            {isDeletingAccount ? "DELETING..." : "DELETE_FOREVER"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                  <p className="text-xs text-muted-foreground font-mono">
                    [INFO] Once deleted, your account cannot be recovered. All progress will be lost permanently.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
