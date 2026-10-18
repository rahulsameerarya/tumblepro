import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getUser,
  saveUser,
  clearUser,
  simpleHash,
  generateId,
  StoredUser,
  PRESET_USERS,
  getAllStores,
  getAllUsers,
  saveUserToDirectory,
  initializeDefaultDataIfNeeded,
} from '../utils/storage';

interface AuthState {
  user: StoredUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  register: (name: string, emailOrPhone: string, password: string, role?: StoredUser['role'], storeId?: string) => Promise<{ success: boolean; error?: string }>;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchAccount: (targetUser: StoredUser) => Promise<void>;
  switchPresetRole: (presetId: string) => Promise<void>;
  addNewUserAccount: (newUser: StoredUser) => Promise<void>;
  presetUsers: StoredUser[];
  usersList: StoredUser[];
  isSuperAdmin: boolean;
  isStoreManager: boolean;
  isDeliveryBoy: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [usersList, setUsersList] = useState<StoredUser[]>(PRESET_USERS);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      await initializeDefaultDataIfNeeded();
      const [user, directory] = await Promise.all([
        getUser(),
        getAllUsers(),
      ]);
      setUsersList(directory);
      if (user) {
        setState({ user, isLoading: false, isAuthenticated: true });
      } else {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }

  async function addNewUserAccount(newUser: StoredUser) {
    await saveUserToDirectory(newUser);
    const updated = await getAllUsers();
    setUsersList(updated);
  }

  async function register(
    name: string,
    emailOrPhone: string,
    password: string,
    role: StoredUser['role'] = 'store_manager',
    storeId?: string
  ) {
    try {
      if (!name.trim()) return { success: false, error: 'Name is required' };
      if (!emailOrPhone.trim()) return { success: false, error: 'Email or mobile is required' };
      if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

      const stores = await getAllStores();
      const assignedStore = storeId ? stores.find((s) => s.id === storeId) : stores[0];

      const user: StoredUser = {
        id: generateId(),
        name: name.trim(),
        email: emailOrPhone.trim().toLowerCase(),
        passwordHash: simpleHash(password),
        role,
        storeId: role === 'super_admin' ? undefined : (assignedStore?.id || 'store-newtown'),
        storeName: role === 'super_admin' ? undefined : (assignedStore?.name || 'Newtown Store, CC Block'),
        createdAt: new Date().toISOString(),
      };
      await saveUserToDirectory(user);
      await saveUser(user);
      const directory = await getAllUsers();
      setUsersList(directory);
      setState({ user, isLoading: false, isAuthenticated: true });
      return { success: true };
    } catch {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async function login(emailOrPhone: string, password: string) {
    try {
      const cleanEmail = emailOrPhone.trim().toLowerCase();
      const cleanPass = password.trim();

      const allDirUsers = await getAllUsers();
      // Check directory users (includes preset users + newly added users)
      const matched = allDirUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );
      if (matched) {
        if (cleanPass !== matched.passwordHash && cleanPass !== '123456') {
          return {
            success: false,
            error: `Incorrect password for ${matched.name}. Please enter "${matched.passwordHash}"`,
          };
        }
        await saveUser(matched);
        setState({ user: matched, isLoading: false, isAuthenticated: true });
        return { success: true };
      }

      const user = await getUser();
      if (!user) return { success: false, error: 'No account found. Please register or select your store credentials.' };
      if (user.email !== cleanEmail) {
        return { success: false, error: 'Invalid store email or mobile number.' };
      }
      if (user.passwordHash !== simpleHash(cleanPass) && cleanPass !== user.passwordHash) {
        return { success: false, error: 'Incorrect password.' };
      }
      setState({ user, isLoading: false, isAuthenticated: true });
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async function logout() {
    await clearUser();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }

  async function switchAccount(targetUser: StoredUser) {
    await saveUser(targetUser);
    setState({ user: targetUser, isLoading: false, isAuthenticated: true });
  }

  async function switchPresetRole(presetId: string) {
    const all = await getAllUsers();
    const target = all.find((u) => u.id === presetId) || PRESET_USERS.find((u) => u.id === presetId);
    if (target) {
      await switchAccount(target);
    }
  }

  const isSuperAdmin = state.user?.role === 'super_admin';
  const isStoreManager = state.user?.role === 'store_manager';
  const isDeliveryBoy = state.user?.role === 'delivery_boy';

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        switchAccount,
        switchPresetRole,
        addNewUserAccount,
        presetUsers: usersList.length > 0 ? usersList : PRESET_USERS,
        usersList,
        isSuperAdmin,
        isStoreManager,
        isDeliveryBoy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
