import { create } from 'zustand';
import { User, Quest, Submission, FilterOptions, Wallet } from './types';
import { QuestService } from './services';
import { AuthService } from './api/auth';
import { signIn, signOut } from 'next-auth/react';

// WebSocket connection management
let wsConnection: WebSocket | null = null;
let wsReconnectTimeout: NodeJS.Timeout | null = null;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'wss://localhost:8080';

// WebSocket event handlers
type WebSocketHandlers = {
  onNotification?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
};

let wsHandlers: WebSocketHandlers = {};

// WebSocket connection functions
const connectWebSocket = (token: string) => {
  if (wsConnection?.readyState === WebSocket.OPEN) {
    return;
  }

  try {
    const wsUrl = `${WEBSOCKET_URL}/?token=${encodeURIComponent(token)}`;
    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = () => {
      console.log('WebSocket connected on user login');
      wsReconnectAttempts = 0;
      wsHandlers.onConnect?.();
    };

    wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'notification') {
          wsHandlers.onNotification?.(message.data);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      wsHandlers.onError?.(error);
    };

    wsConnection.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      wsConnection = null;
      wsHandlers.onDisconnect?.();

      // Auto-reconnect if we have a session and haven't exceeded max attempts
      // WebSocket will be reconnected when session is restored
      if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        wsReconnectAttempts++;
        console.log(`WebSocket disconnected, will reconnect when session is restored`);
      }
    };
  } catch (err) {
    console.error('Failed to create WebSocket connection:', err);
  }
};

const disconnectWebSocket = () => {
  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = null;
  }
  
  if (wsConnection) {
    wsConnection.close(1000, 'User logout');
    wsConnection = null;
  }
  
  wsReconnectAttempts = 0;
};

// Function to set WebSocket event handlers
const setWebSocketHandlers = (handlers: WebSocketHandlers) => {
  wsHandlers = { ...wsHandlers, ...handlers };
};

// Function to get WebSocket connection status
const getWebSocketStatus = () => {
  return {
    isConnected: wsConnection?.readyState === WebSocket.OPEN,
    isConnecting: wsConnection?.readyState === WebSocket.CONNECTING,
    reconnectAttempts: wsReconnectAttempts
  };
};

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Quests
  quests: Quest[];
  selectedQuest: Quest | null;
  filters: FilterOptions;
  
  // Submissions
  submissions: Submission[];
  
  // Wallets
  wallets: Wallet[];
  
  // UI
  theme: Theme;
  sidebarOpen: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loadCurrentUser: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  setUser: (user: User) => void;
  loadQuests: () => Promise<void>;
  setSelectedQuest: (quest: Quest | null) => void;
  updateFilters: (filters: Partial<FilterOptions>) => void;
  submitQuest: (questId: string, content: any) => Promise<void>;
  loadSubmissions: () => Promise<void>;
  loadWallets: () => Promise<void>;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;

  // NextAuth session sync
  syncWithNextAuthSession: (session: any) => void;

  // WebSocket management
  setWebSocketHandlers: (handlers: WebSocketHandlers) => void;
  getWebSocketStatus: () => { isConnected: boolean; isConnecting: boolean; reconnectAttempts: number };
}

type Theme = 'light' | 'dark';

const useStore = create<AppState>((set, get) => ({
 
  user: null,
  isAuthenticated: false,
  isLoading: false,
  quests: [],
  selectedQuest: null,
  filters: {
    categories: [],
    difficulties: [],
    search: '',
    showCompleted: false
  },
  submissions: [],
  wallets: [],
  theme: 'dark',
  sidebarOpen: false,

  // Auth actions
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
 
        set({ isLoading: false });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData: any) => {
    set({ isLoading: true });
    try {
      await AuthService.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword || userData.password
      });
      
      // After registration, user needs to login to get a token and user data
      // The login process will handle getting the user data with proper authentication
      set({ isLoading: false });
      
      // Registration successful, but user needs to login to get session
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    // Disconnect WebSocket
    disconnectWebSocket();
    // Clear store state
    set({ user: null, isAuthenticated: false });
    // Use NextAuth signOut
    signOut({ callbackUrl: '/' });
  },

  // Method to sync store with NextAuth session
  syncWithNextAuthSession: (session: any) => {
    if (session?.user) {
      const user = session.user.userData;
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });

      // Connect WebSocket if we have a token
      const token = session.user.token;
      if (token) {
        connectWebSocket(token);
      }
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      disconnectWebSocket();
    }
  },

  loadCurrentUser: async () => {

    console.log('loadCurrentUser: Using NextAuth session');
  },

  refreshUserProfile: async () => {
    const { user } = get();
    if (!user) {
      console.log('refreshUserProfile: No user logged in');
      return;
    }

    try {
      // Get session to get token for API call
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      
      if (!session?.user?.token) {
        console.log('refreshUserProfile: No token available');
        return;
      }

      console.log('refreshUserProfile: Fetching latest user data from /profile/me');
      const profileData = await AuthService.me(session.user.token) as any;
      
      if (profileData.user || profileData.admin) {
        const latestUserData = profileData.admin || profileData.user;
        const isAdmin = profileData.is_admin || false;

        // Update the user with the latest data, preserving existing structure
        const updatedUser: User = {
          ...user,
          id: String(latestUserData.id || user.id),
          firstName: latestUserData.firstName || user.firstName,
          lastName: latestUserData.lastName || user.lastName,
          username: latestUserData.username || user.username,
          email: latestUserData.email || user.email,
          bio: latestUserData.bio || user.bio || '',
          total_points: latestUserData.total_points || 0,
          points: latestUserData.total_points || 0, // Keep both for compatibility
          level: latestUserData.userLevel?.level || user.level || 1,
          email_verified: latestUserData.email_verified || user.email_verified,
          role: isAdmin ? 'admin' : 'user',
          userLevel: latestUserData.userLevel || user.userLevel,
          facebookProfile: latestUserData.facebookProfile || user.facebookProfile,
          twitterProfile: latestUserData.twitterProfile || user.twitterProfile,
          discordProfile: latestUserData.discordProfile || user.discordProfile,
          linkedInProfile: latestUserData.linkedInProfile || user.linkedInProfile,
          hederaProfile: latestUserData.hederaProfile || user.hederaProfile
        };

        console.log('refreshUserProfile: Updated user data', {
          oldPoints: user.total_points || user.points,
          newPoints: updatedUser.total_points,
          userId: updatedUser.id
        });

        set({ user: updatedUser });
      }
    } catch (error) {
      console.error('refreshUserProfile: Failed to refresh user data:', error);
      // Don't throw - just log the error so UI doesn't break
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true, isLoading: false });

    // WebSocket connection is handled by session sync
    console.log('setUser: User set, WebSocket will be connected by session sync');
  },

  // Quest actions
  loadQuests: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const quests = await QuestService.getQuests(filters);
      set({ quests, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setSelectedQuest: (quest: Quest | null) => {
    set({ selectedQuest: quest });
  },

  updateFilters: (newFilters: Partial<FilterOptions>) => {
    const { filters, loadQuests } = get();
    const updatedFilters = { ...filters, ...newFilters };
    set({ filters: updatedFilters });
    loadQuests();
  },

  // Submission actions
  submitQuest: async (questId: string, content: any) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');
    
    try {
      await QuestService.submitQuest(questId, String(user.id), content);
      get().loadSubmissions();
    } catch (error) {
      throw error;
    }
  },

  loadSubmissions: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const submissions = await QuestService.getSubmissions(undefined, String(user.id));
      set({ submissions });
    } catch (error) {
      throw error;
    }
  },

  loadWallets: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      // Get session to get token for API call
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      
      if (!session?.user?.token) {
        console.log('loadWallets: No token available');
        return;
      }

      const response = await QuestService.getWallets(session.user.token);
      if (response.success) {
        set({ wallets: response.wallets });
      }
    } catch (error) {
      console.error('loadWallets: Failed to load wallets:', error);
    }
  },

  // UI actions
  toggleTheme: () => {
    const { theme } = get();
    set({ theme: theme === 'light' ? 'dark' : 'light' });
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
  
  // WebSocket management
  setWebSocketHandlers: (handlers: WebSocketHandlers) => {
    setWebSocketHandlers(handlers);
  },
  
  getWebSocketStatus: () => {
    return getWebSocketStatus();
  }
}));

export default useStore;
export type { WebSocketHandlers };