'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { toast } from 'sonner';
import { QuestService } from '@/lib/services';
import TransactionHistory from '@/components/admin/transaction-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Globe,
  Palette,
  Save,
  AlertTriangle,
  Twitter,
  MessageCircle,
  Facebook,
  DollarSign,
  Loader2,
  Wallet,
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Claim threshold state
  const [claimThreshold, setClaimThreshold] = useState<number>(300);
  const [originalClaimThreshold, setOriginalClaimThreshold] = useState<number>(300);
  const [isLoadingThreshold, setIsLoadingThreshold] = useState(false);
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [claimOptionsId, setClaimOptionsId] = useState<number | null>(null);
  
  // Total withdrawn state
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(0);
  const [isLoadingWithdrawn, setIsLoadingWithdrawn] = useState(false);
  
  // Wallet transactions state
  const [walletTransactions, setWalletTransactions] = useState<any>(null);
  const [isLoadingWalletTxs, setIsLoadingWalletTxs] = useState(false);
  const [walletPage, setWalletPage] = useState(1);
  const [walletLimit, setWalletLimit] = useState(10);
  
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Hedera Quest Machine',
    siteDescription: 'Gamified learning platform for the Hedera ecosystem',
    maintenanceMode: false,
    registrationEnabled: true,
    
    // Quest Settings
    defaultQuestPoints: 0, // Will be configured by admin
    maxQuestAttempts: 3,
    questApprovalRequired: true,
    autoApproveThreshold: 0.8,
    questValidationAutomation: false,
    
    // User Settings
    defaultUserRole: 'user',
    emailVerificationRequired: false,
    profilePicturesEnabled: true,
    
    // Notification Settings
    emailNotifications: true,
    questCompletionEmails: true,
    weeklyDigest: true,
    adminAlerts: true,
    
    // Security Settings
    sessionTimeout: 24,
    passwordMinLength: 6,
    twoFactorEnabled: false,
    ipWhitelist: '',
    
    // Integration Settings
    hederaNetwork: 'testnet',
    hashscanEnabled: true,
    analyticsEnabled: true,
    
    // Social Media Integration
    twitterConnected: false,
    twitterApiKey: '',
    twitterApiSecret: '',
    twitterAccessToken: '',
    twitterAccessTokenSecret: '',
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleQuestValidationAutomationChange = async (checked: boolean) => {
    // Update local state immediately
    setSettings(prev => ({ ...prev, questValidationAutomation: checked }));
    
    try {
      const token = session?.user?.token;
      if (!token) return;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/quests/admin/auto_verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_verify: checked })
      });
      
      if (response.ok) {
        // Update admin profile to reflect the change
        setAdminProfile((prev: any) => {
          if (prev && typeof prev === 'object' && !Array.isArray(prev)) {
            return { ...prev, auto_verify: checked };
          }
          return prev;
        });
        toast.success(`Quest validation automation ${checked ? 'enabled' : 'disabled'} successfully`);
      } else {
        // Revert local state if API call failed
        setSettings(prev => ({ ...prev, questValidationAutomation: !checked }));
        toast.error("Failed to update quest validation automation setting");
      }
    } catch (error) {
      // Revert local state if API call failed
      setSettings(prev => ({ ...prev, questValidationAutomation: !checked }));
      toast.error("An error occurred while updating the setting");
    }
   };

  const fetchAdminProfile = async () => {
    try {
      const token = session?.user?.token;
      if (!token) {
        setLoading(false);
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminProfile(data.admin);
        // Sync quest validation automation with admin's auto_verify setting
        if (data.admin && typeof data.admin.auto_verify === 'boolean') {
          setSettings(prev => ({
            ...prev,
            questValidationAutomation: data.admin.auto_verify
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch claim threshold
  const fetchClaimThreshold = async () => {
    setIsLoadingThreshold(true);
    try {
      const token = session?.user?.token;
      if (!token) return;

      const response = await QuestService.getClaimOptions(token);
      if (response.success && response.options) {
        setClaimThreshold(response.options.threshold);
        setOriginalClaimThreshold(response.options.threshold);
        setClaimOptionsId(response.options.id);
      }
    } catch (error) {
      console.error('Error fetching claim threshold:', error);
      toast.error('Failed to load claim threshold');
    } finally {
      setIsLoadingThreshold(false);
    }
  };

  // Fetch total withdrawn amount
  const fetchTotalWithdrawn = async () => {
    setIsLoadingWithdrawn(true);
    try {
      const token = session?.user?.token;
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/user/widhraw/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Convert points to USD (1 point = $0.01)
          setTotalWithdrawn((data.data.total || 0) * 0.01);
        }
      }
    } catch (error) {
      console.error('Error fetching total withdrawn:', error);
      toast.error('Failed to load total withdrawn amount');
    } finally {
      setIsLoadingWithdrawn(false);
    }
  };

  // Fetch wallet transactions
  const fetchWalletTransactions = async (page: number = 1) => {
    setIsLoadingWalletTxs(true);
    try {
      const token = session?.user?.token;
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/admin/funds/transactions?page=${page}&limit=${walletLimit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletTransactions(data);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      toast.error('Failed to load wallet transactions');
    } finally {
      setIsLoadingWalletTxs(false);
    }
  };

  // Update claim threshold
  const handleUpdateClaimThreshold = async () => {
    if (claimThreshold === originalClaimThreshold) {
      toast.info('No changes to save');
      return;
    }

    if (claimThreshold < 0) {
      toast.error('Threshold must be a positive number');
      return;
    }

    setIsSavingThreshold(true);
    try {
      const token = session?.user?.token;
      if (!token) return;

      const response = await QuestService.updateClaimOptions(claimThreshold, token);
      
      if (response.success) {
        setOriginalClaimThreshold(claimThreshold);
        toast.success('Claim threshold updated successfully');
      } else {
        throw new Error('Failed to update threshold');
      }
    } catch (error: any) {
      console.error('Error updating claim threshold:', error);
      toast.error(error.message || 'Failed to update claim threshold');
      // Revert to original value
      setClaimThreshold(originalClaimThreshold);
    } finally {
      setIsSavingThreshold(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
    fetchClaimThreshold();
    fetchTotalWithdrawn();
    fetchWalletTransactions(walletPage);
    
    // Check if user just returned from Twitter auth
    const twitterAuthPending = localStorage.getItem('twitter_auth_pending');
    if (twitterAuthPending) {
      localStorage.removeItem('twitter_auth_pending');
      // Refresh profile data after a short delay to ensure backend is updated
      setTimeout(() => {
        fetchAdminProfile();
      }, 2000);
    }
    
    // Check if user just returned from Discord auth
     const discordAuthPending = localStorage.getItem('discord_auth_pending');
     if (discordAuthPending) {
       localStorage.removeItem('discord_auth_pending');
       // Refresh profile data after a short delay to ensure backend is updated
       setTimeout(() => {
         fetchAdminProfile();
       }, 2000);
     }
     
     // Check if user just returned from Facebook auth
     const facebookAuthPending = localStorage.getItem('facebook_auth_pending');
     if (facebookAuthPending) {
       localStorage.removeItem('facebook_auth_pending');
       // Refresh profile data after a short delay to ensure backend is updated
       setTimeout(() => {
         fetchAdminProfile();
       }, 2000);
     }
   }, []);

  const handleTwitterConnect = async () => {
    try {
      const token = session?.user?.token;
      if (!token) {
        alert('Please log in to connect your Twitter account.');
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/profile/admin/twitter/url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Store a flag to refresh profile data when user returns
          localStorage.setItem('twitter_auth_pending', 'true');
          window.location.href = data.url;
        } else {
          alert('Failed to get Twitter authorization URL');
        }
      } else {
        alert('Failed to connect to Twitter. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting to Twitter:', error);
      alert('Failed to connect to Twitter. Please try again.');
    }
  };

  const handleDiscordConnect = async () => {
    try {
      const token = session?.user?.token;
      if (!token) {
        alert('Please log in to connect your Discord account.');
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/profile/admin/discord/url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Store a flag to refresh profile data when user returns
          localStorage.setItem('discord_auth_pending', 'true');
          window.location.href = data.url;
        } else {
          alert('Failed to get Discord authorization URL');
        }
      } else {
        alert('Failed to connect to Discord. Please try again.');
      }
    } catch (error) {
       console.error('Error connecting to Discord:', error);
       alert('Failed to connect to Discord. Please try again.');
     }
   };

  const handleFacebookConnect = async () => {
    try {
      const token = session?.user?.token;
      if (!token) {
        alert('Please log in to connect your Facebook account.');
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/profile/admin/facebook/url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Store a flag to refresh profile data when user returns
          localStorage.setItem('facebook_auth_pending', 'true');
          window.location.href = data.url;
        } else {
          alert('Failed to get Facebook authorization URL');
        }
      } else {
        alert('Failed to connect to Facebook. Please try again.');
      }
    } catch (error) {
       console.error('Error connecting to Facebook:', error);
       alert('Failed to connect to Facebook. Please try again.');
     }
   };

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <AuthGuard requireAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure platform settings and preferences</p>
          </div>
          <Button onClick={handleSaveSettings} className="gap-2">
            <Save className="w-4 h-4" />
            Save All Changes
          </Button>
        </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="funds">Funds</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable access to the platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to create accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.registrationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Quest Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Quest Approval Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require admin approval for quest submissions
                    </p>
                  </div>
                  <Switch
                    checked={settings.questApprovalRequired}
                    onCheckedChange={(checked) => handleSettingChange('questApprovalRequired', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Quest Validation Automation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically validate quest submissions using AI
                    </p>
                  </div>
                  <Switch
                    checked={settings.questValidationAutomation}
                    onCheckedChange={handleQuestValidationAutomationChange}
                  />
                </div>

                <div>
                  <Label htmlFor="autoApproveThreshold">Auto-Approve Threshold</Label>
                  <Input
                    id="autoApproveThreshold"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={settings.autoApproveThreshold}
                    onChange={(e) => handleSettingChange('autoApproveThreshold', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Confidence score threshold for automatic approval (0.0 - 1.0)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card className="border-2 border-dashed border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                <DollarSign className="w-5 h-5 text-green-600" />
                REWARD_SETTINGS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 border-t-2 border-dashed border-green-500/10">
              {/* Claim Threshold Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-mono">Withdrawal Threshold</h3>
                    <p className="text-sm text-muted-foreground">
                      Minimum points required for users to withdraw rewards
                    </p>
                  </div>
                </div>

                <Separator className="border-dashed" />

                {isLoadingThreshold ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Current Threshold Card */}
                      <div className="relative overflow-hidden border-2 border-dashed border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4">
                        <div className="space-y-3">
                          <Label htmlFor="claimThreshold" className="text-sm font-mono text-green-700 dark:text-green-400">
                            THRESHOLD (POINTS)
                          </Label>
                          <Input
                            id="claimThreshold"
                            type="number"
                            min="0"
                            step="50"
                            value={claimThreshold}
                            onChange={(e) => setClaimThreshold(parseInt(e.target.value) || 0)}
                            disabled={isSavingThreshold}
                            className="font-mono text-lg border-2 border-dashed border-green-500/30 bg-background"
                          />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                            <span>1 point = $0.01 USD</span>
                          </div>
                        </div>
                      </div>

                      {/* Equivalent Value Card */}
                      <div className="relative overflow-hidden border-2 border-dashed border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg p-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-mono text-cyan-700 dark:text-cyan-400">
                            EQUIVALENT VALUE
                          </Label>
                          <div className="text-3xl font-bold font-mono text-cyan-700 dark:text-cyan-300">
                            ${(claimThreshold * 0.01).toFixed(2)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
                            <span>Minimum withdrawal amount</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/30 dark:border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                      <div className="bg-blue-500/20 rounded-full p-2 flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Important</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400/80">
                          Users must accumulate at least {claimThreshold} points (${(claimThreshold * 0.01).toFixed(2)}) 
                          before they can withdraw their rewards. This threshold applies to all users.
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleUpdateClaimThreshold}
                        disabled={isSavingThreshold || claimThreshold === originalClaimThreshold}
                        className="font-mono bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {isSavingThreshold ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      
                      {claimThreshold !== originalClaimThreshold && (
                        <Button
                          variant="outline"
                          onClick={() => setClaimThreshold(originalClaimThreshold)}
                          disabled={isSavingThreshold}
                          className="font-mono"
                        >
                          Reset
                        </Button>
                      )}
                    </div>

                    {/* Last Updated Info */}
                    {claimOptionsId && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground font-mono">
                          Configuration ID: #{claimOptionsId}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Withdrawn Statistics */}
          <Card className="border-2 border-dashed border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                <DollarSign className="w-5 h-5 text-purple-600" />
                TOTAL_WITHDRAWN_BY_USERS
              </CardTitle>
            </CardHeader>
            <CardContent className="border-t-2 border-dashed border-purple-500/10">
              {isLoadingWithdrawn ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  <span className="ml-3 font-mono text-purple-500">LOADING_DATA...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-hidden border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="text-sm font-mono text-purple-700 dark:text-purple-400">
                          TOTAL WITHDRAWN (USD)
                        </div>
                        <div className="text-4xl font-bold font-mono text-purple-700 dark:text-purple-300">
                          ${totalWithdrawn.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <div className="w-2 h-2 rounded-full bg-purple-500/50" />
                          <span>Cumulative withdrawals from all users</span>
                        </div>
                      </div>
                      <div className="p-4 bg-purple-500/20 rounded-full border-2 border-dashed border-purple-500/40">
                        <DollarSign className="w-12 h-12 text-purple-600" />
                      </div>
                    </div>
                  </div>                
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="funds" className="space-y-6">
          {/* Wallet Flow Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hashgraph Wallet (Source) */}
            <Card className="border-2 border-dashed border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-sm bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  HASHGRAPH_WALLET
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 border-t-2 border-dashed border-blue-500/10">
                <div className="p-3 bg-blue-500/10 rounded-lg border border-dashed border-blue-500/20">
                  <div className="text-xs font-mono text-blue-700 dark:text-blue-400 mb-1">SOURCE</div>
                  <div className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300">0.0.9692106</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <ArrowRight className="w-3 h-3 text-blue-500" />
                  <span>Funds flow to DarBlockchain</span>
                </div>
              </CardContent>
            </Card>

            {/* DarBlockchain Cold Wallet (Middle) */}
            <Card className="border-2 border-dashed border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 font-mono text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <Shield className="w-4 h-4 text-purple-600" />
                  DARBLOCKCHAIN_WALLET
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 border-t-2 border-dashed border-purple-500/10 relative">
                <div className="p-3 bg-purple-500/10 rounded-lg border border-dashed border-purple-500/20">
                  <div className="text-xs font-mono text-purple-700 dark:text-purple-400 mb-1">COLD STORAGE</div>
                  <div className="text-lg font-bold font-mono text-purple-700 dark:text-purple-300">0.0.7581100</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-green-600 font-mono">
                    <TrendingUp className="w-3 h-3" />
                    <span>Receiving</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600 font-mono">
                    <TrendingDown className="w-3 h-3" />
                    <span>Distributing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hot Funding Wallet (Destination) */}
            <Card className="border-2 border-dashed border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-sm bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  <Wallet className="w-4 h-4 text-orange-600" />
                  HOT_FUNDING_WALLET
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 border-t-2 border-dashed border-orange-500/10">
                <div className="p-3 bg-orange-500/10 rounded-lg border border-dashed border-orange-500/20">
                  <div className="text-xs font-mono text-orange-700 dark:text-orange-400 mb-1">REWARDS</div>
                  <div className="text-lg font-bold font-mono text-orange-700 dark:text-orange-300">0.0.10127540</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <ArrowLeft className="w-3 h-3 text-orange-500" />
                  <span>Receives from DarBlockchain</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fund Flow Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inbound Transactions */}
            <Card className="border-2 border-dashed border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  INBOUND_TO_DARBLOCKCHAIN
                </CardTitle>
              </CardHeader>
              <CardContent className="border-t-2 border-dashed border-green-500/10">
                {isLoadingWalletTxs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden border-2 border-dashed border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="text-sm font-mono text-green-700 dark:text-green-400">
                            TOTAL RECEIVED
                          </div>
                          <div className="text-4xl font-bold font-mono text-green-700 dark:text-green-300">
                            {walletTransactions?.sumTransferToDarBlockchain?.toLocaleString() || '0'} ℏ
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
                            <span>From Hashgraph Wallet</span>
                          </div>
                        </div>
                        <div className="p-4 bg-green-500/20 rounded-full border-2 border-dashed border-green-500/40">
                          <ArrowDownUp className="w-12 h-12 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent inbound transactions count */}
                    <div className="flex items-center justify-between p-3 border border-dashed border-green-500/20 rounded-lg bg-green-500/5">
                      <span className="text-sm font-mono text-muted-foreground">Transactions</span>
                      <span className="text-lg font-bold font-mono text-green-700 dark:text-green-300">
                        {walletTransactions?.transactions?.filter((tx: any) => tx.toWallet?.name === 'DARBLOCKCHAIN_WALLET').length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outbound Transactions */}
            <Card className="border-2 border-dashed border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                  OUTBOUND_TO_HOT_WALLET
                </CardTitle>
              </CardHeader>
              <CardContent className="border-t-2 border-dashed border-orange-500/10">
                {isLoadingWalletTxs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden border-2 border-dashed border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="text-sm font-mono text-orange-700 dark:text-orange-400">
                            TOTAL SENT
                          </div>
                          <div className="text-4xl font-bold font-mono text-orange-700 dark:text-orange-300">
                            {walletTransactions?.sumTransferToHotWallet?.toLocaleString() || '0'} ℏ
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <div className="w-2 h-2 rounded-full bg-orange-500/50 animate-pulse" />
                            <span>To Hot Funding Wallet</span>
                          </div>
                        </div>
                        <div className="p-4 bg-orange-500/20 rounded-full border-2 border-dashed border-orange-500/40">
                          <ArrowDownUp className="w-12 h-12 text-orange-600" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent outbound transactions count */}
                    <div className="flex items-center justify-between p-3 border border-dashed border-orange-500/20 rounded-lg bg-orange-500/5">
                      <span className="text-sm font-mono text-muted-foreground">Transactions</span>
                      <span className="text-lg font-bold font-mono text-orange-700 dark:text-orange-300">
                        {walletTransactions?.transactions?.filter((tx: any) => tx.toWallet?.name === 'HOT_FUNDING_WALLET').length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History Table */}
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-mono bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  <ArrowDownUp className="w-5 h-5 text-primary" />
                  TRANSACTION_HISTORY
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchWalletTransactions(walletPage)}
                  disabled={isLoadingWalletTxs}
                  className="gap-2 font-mono text-xs border-dashed"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingWalletTxs ? 'animate-spin' : ''}`} />
                  REFRESH
                </Button>
              </div>
            </CardHeader>
            <CardContent className="border-t-2 border-dashed border-primary/10">
              {isLoadingWalletTxs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 font-mono text-primary">LOADING_TRANSACTIONS...</span>
                </div>
              ) : walletTransactions?.transactions?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-muted/50 rounded-full mb-4">
                    <ArrowDownUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-mono text-muted-foreground">NO_TRANSACTIONS_FOUND</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Transaction List */}
                  <div className="space-y-3">
                    {walletTransactions?.transactions?.map((tx: any, index: number) => {
                      const isInbound = tx.toWallet?.name === 'DARBLOCKCHAIN_WALLET';
                      const isOutbound = tx.toWallet?.name === 'HOT_FUNDING_WALLET';
                      
                      return (
                        <div 
                          key={tx.id} 
                          className={`
                            relative overflow-hidden border-2 border-dashed rounded-lg p-4 transition-all hover:shadow-md
                            ${isInbound ? 'border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5' : ''}
                            ${isOutbound ? 'border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5' : ''}
                          `}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Transaction Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-2 rounded-lg border border-dashed
                                  ${isInbound ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}
                                `}>
                                  {isInbound ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-orange-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`
                                        font-mono text-xs
                                        ${isInbound ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-orange-500/10 text-orange-700 border-orange-500/20'}
                                      `}
                                    >
                                      {isInbound ? 'INBOUND' : 'OUTBOUND'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      #{tx.id}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-sm font-mono text-muted-foreground">
                                    {new Date(tx.created_at).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Wallet Flow */}
                              <div className="flex items-center gap-2 text-sm pl-11">
                                <span className="font-mono text-muted-foreground">
                                  {tx.fromWallet?.name}
                                </span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                <span className="font-mono text-foreground font-medium">
                                  {tx.toWallet?.name}
                                </span>
                              </div>

                              {/* Account IDs */}
                              <div className="flex items-center gap-2 text-xs pl-11">
                                <code className="px-2 py-1 bg-muted/50 rounded border border-dashed">
                                  {tx.fromWallet?.account_id}
                                </code>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <code className="px-2 py-1 bg-muted/50 rounded border border-dashed">
                                  {tx.toWallet?.account_id}
                                </code>
                              </div>

                              {/* Transaction ID */}
                              <div className="flex items-center gap-2 pl-11">
                                <a
                                  href={`https://hashscan.io/testnet/transaction/${tx.transaction_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                                >
                                  <span className="truncate max-w-[300px]">{tx.transaction_id}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right">
                              <div className={`
                                text-2xl font-bold font-mono
                                ${isInbound ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}
                              `}>
                                {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ℏ
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {walletTransactions && (
                    <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-primary/10">
                      <div className="text-sm text-muted-foreground font-mono">
                        Page {walletTransactions.page} of {walletTransactions.numberOfPage}
                        <span className="ml-2">({walletTransactions.count} total transaction{walletTransactions.count !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = walletPage - 1;
                            setWalletPage(newPage);
                            fetchWalletTransactions(newPage);
                          }}
                          disabled={walletPage === 1 || isLoadingWalletTxs}
                          className="font-mono text-xs border-dashed"
                        >
                          PREVIOUS
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = walletPage + 1;
                            setWalletPage(newPage);
                            fetchWalletTransactions(newPage);
                          }}
                          disabled={walletPage >= walletTransactions.numberOfPage || isLoadingWalletTxs}
                          className="font-mono text-xs border-dashed"
                        >
                          NEXT
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultUserRole">Default User Role</Label>
                <select
                  id="defaultUserRole"
                  value={settings.defaultUserRole}
                  onChange={(e) => handleSettingChange('defaultUserRole', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Verification Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to verify their email address
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailVerificationRequired}
                    onCheckedChange={(checked) => handleSettingChange('emailVerificationRequired', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profile Pictures Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to upload profile pictures
                    </p>
                  </div>
                  <Switch
                    checked={settings.profilePicturesEnabled}
                    onCheckedChange={(checked) => handleSettingChange('profilePicturesEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Roles & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-sm text-muted-foreground">Full system access</div>
                  </div>
                  <Badge>0 users</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Moderator</div>
                    <div className="text-sm text-muted-foreground">Quest review and user management</div>
                  </div>
                  <Badge variant="secondary">0 users</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">User</div>
                    <div className="text-sm text-muted-foreground">Standard user access</div>
                  </div>
                  <Badge variant="outline">0 users</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email notifications system-wide
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Quest Completion Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Send emails when users complete quests
                    </p>
                  </div>
                  <Switch
                    checked={settings.questCompletionEmails}
                    onCheckedChange={(checked) => handleSettingChange('questCompletionEmails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Send weekly progress summaries to users
                    </p>
                  </div>
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Admin Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alerts for system events and issues
                    </p>
                  </div>
                  <Switch
                    checked={settings.adminAlerts}
                    onCheckedChange={(checked) => handleSettingChange('adminAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="Enter IP addresses (one per line)"
                    value={settings.ipWhitelist}
                    onChange={(e) => handleSettingChange('ipWhitelist', e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Restrict admin access to specific IP addresses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Reset All User Progress
                </Button>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Clear All Submissions
                </Button>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Factory Reset System
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                External Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hederaNetwork">Hedera Network</Label>
                <select
                  id="hederaNetwork"
                  value={settings.hederaNetwork}
                  onChange={(e) => handleSettingChange('hederaNetwork', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>HashScan Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable HashScan explorer links
                    </p>
                  </div>
                  <Switch
                    checked={settings.hashscanEnabled}
                    onCheckedChange={(checked) => handleSettingChange('hashscanEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable user behavior analytics
                    </p>
                  </div>
                  <Switch
                    checked={settings.analyticsEnabled}
                    onCheckedChange={(checked) => handleSettingChange('analyticsEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="w-5 h-5" />
                Social Media Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Twitter Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect Twitter account for social features
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={adminProfile?.twitterProfile ? "default" : "secondary"}>
                      {adminProfile?.twitterProfile ? "Connected" : "Disconnected"}
                    </Badge>
                    <Button 
                      variant={adminProfile?.twitterProfile ? "outline" : "default"}
                      size="sm"
                      disabled={loading}
                      onClick={() => {
                        if (adminProfile?.twitterProfile) {
                          // Handle disconnect logic here
                          alert('Disconnect functionality to be implemented');
                        } else {
                          handleTwitterConnect();
                        }
                      }}
                    >
                      {adminProfile?.twitterProfile ? "Disconnect" : "Connect Twitter"}
                    </Button>
                  </div>
                </div>

                {adminProfile?.twitterProfile && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={adminProfile.twitterProfile.twitter_profile_picture} 
                        alt="Twitter Profile" 
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">@{adminProfile.twitterProfile.twitter_username}</p>
                        <p className="text-sm text-muted-foreground">Twitter ID: {adminProfile.twitterProfile.twitter_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Connected At</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(adminProfile.twitterProfile.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm">Token Expires</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(adminProfile.twitterProfile.expires_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Discord Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect Discord account for community features
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={adminProfile?.discordProfile ? "default" : "secondary"}>
                      {adminProfile?.discordProfile ? "Connected" : "Disconnected"}
                    </Badge>
                    <Button 
                      variant={adminProfile?.discordProfile ? "outline" : "default"}
                      size="sm"
                      disabled={loading}
                      onClick={() => {
                        if (adminProfile?.discordProfile) {
                          // Handle disconnect logic here
                          alert('Disconnect functionality to be implemented');
                        } else {
                          handleDiscordConnect();
                        }
                      }}
                    >
                      {adminProfile?.discordProfile ? "Disconnect" : "Connect Discord"}
                    </Button>
                  </div>
                </div>

                {adminProfile?.discordProfile && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-10 h-10 text-indigo-500" />
                      <div>
                        <p className="font-medium">{adminProfile.discordProfile.discord_username}</p>
                        <p className="text-sm text-muted-foreground">Discord ID: {adminProfile.discordProfile.discord_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Connected At</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(adminProfile.discordProfile.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm">Token Expires</Label>
                        <p className="text-sm text-muted-foreground">
                          {adminProfile.discordProfile.expires_at ? formatDistanceToNow(new Date(adminProfile.discordProfile.expires_at), { addSuffix: true }) : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Facebook Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect Facebook account for social features
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={adminProfile?.facebookProfile ? "default" : "secondary"}>
                      {adminProfile?.facebookProfile ? "Connected" : "Disconnected"}
                    </Badge>
                    <Button 
                      variant={adminProfile?.facebookProfile ? "outline" : "default"}
                      size="sm"
                      disabled={loading}
                      onClick={() => {
                        if (adminProfile?.facebookProfile) {
                          // Handle disconnect logic here
                          alert('Disconnect functionality to be implemented');
                        } else {
                          handleFacebookConnect();
                        }
                      }}
                    >
                      {adminProfile?.facebookProfile ? "Disconnect" : "Connect Facebook"}
                    </Button>
                  </div>
                </div>

                {adminProfile?.facebookProfile && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Facebook className="w-10 h-10 text-blue-600" />
                      <div>
                        <p className="font-medium">{adminProfile.facebookProfile.facebook_username}</p>
                        <p className="text-sm text-muted-foreground">Facebook ID: {adminProfile.facebookProfile.facebook_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Connected At</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(adminProfile.facebookProfile.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm">Token Expires</Label>
                        <p className="text-sm text-muted-foreground">
                          {adminProfile.facebookProfile.expires_at ? formatDistanceToNow(new Date(adminProfile.facebookProfile.expires_at), { addSuffix: true }) : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Rate Limits</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">Requests per minute</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div>
                    <Label className="text-sm">Requests per hour</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                </div>
              </div>

              <div>
                <Label>Webhook Endpoints</Label>
                <div className="space-y-2 mt-2">
                  <Input placeholder="Quest completion webhook URL" />
                  <Input placeholder="User registration webhook URL" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AuthGuard>
  );
}