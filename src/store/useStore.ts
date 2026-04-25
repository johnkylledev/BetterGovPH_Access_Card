import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ApplicationStatus } from '../types';
import * as firebaseService from '../services/firebase';

interface AuthState {
  users: User[];
  currentUser: User | null;
  register: (user: Omit<User, 'id' | 'uid' | 'status' | 'isAdmin' | 'createdAt' | 'updatedAt'> & { authProvider?: 'traditional' | 'google' }) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (googleUser: any) => Promise<{ success: boolean; message: string; user?: User; needsProfile?: boolean }>;
  logout: () => void;
  updateUserStatus: (id: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  generateMemberId: (userId: string) => void;
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUserFromFirebase: (uid: string) => Promise<void>;
  authInitialized: boolean;
  setAuthInitialized: (val: boolean) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateMemberCode = () => `BGPH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

export const useStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      authInitialized: false,
      setAuthInitialized: (val: boolean) => set({ authInitialized: val }),

      register: async (userData) => {
        const { users } = get();
        if (users.find((u) => u.email === userData.email)) {
          return { success: false, message: 'Email already registered.' };
        }
        if (userData.discordUsername && users.find((u) => u.discordUsername === userData.discordUsername)) {
          return { success: false, message: 'Discord username already registered.' };
        }

        try {
          const authUser = await firebaseService.registerWithEmailPassword(userData);
          const newUser: User = {
            ...userData,
            id: authUser.uid,
            uid: authUser.uid,
            status: 'Pending',
            isAdmin: false,
            authProvider: userData.authProvider || 'traditional',
            createdAt: new Date().toISOString(),
          };

          set({ users: [...users, newUser], currentUser: newUser });
          return { success: true, message: 'Registration successful.' };
        } catch (error: any) {
          console.error('Registration error:', error);
          return { success: false, message: error.message || 'Registration failed.' };
        }
      },

      login: async (email, password) => {
        const state = get();
        const user = state.users.find((u) => u.email === email && u.password === password);
        if (user) {
          set({ currentUser: user });
          return { success: true, message: 'Login successful.' };
        }

        try {
          const userFromDb = await firebaseService.getUserByEmailAndPassword(email, password);
          if (userFromDb) {
            const normalizedUser: User = {
              id: userFromDb.id,
              uid: userFromDb.uid || userFromDb.id,
              fullName: userFromDb.fullName || '',
              email: userFromDb.email || '',
              password: userFromDb.password,
              photoURL: userFromDb.photoURL,
              specialization: userFromDb.specialization || '',
              role: userFromDb.role || 'Member',
              discordUsername: userFromDb.discordUsername || '',
              status: (userFromDb.status as ApplicationStatus) || 'Pending',
              memberId: userFromDb.memberId || undefined,
              adminNotes: userFromDb.adminNotes,
              isAdmin: !!userFromDb.isAdmin,
              createdAt: userFromDb.createdAt || new Date().toISOString(),
              updatedAt: userFromDb.updatedAt,
            };
            set({ currentUser: normalizedUser, users: [...state.users, normalizedUser] });
            return { success: true, message: 'Login successful.' };
          }
        } catch (error) {
          console.error('Firebase login fallback error:', error);
        }

        return { success: false, message: 'Invalid credentials.' };
      },

      loginWithGoogle: async (googleUser: any) => {
        try {
          const firebaseUser = await firebaseService.signInWithGoogle();
          let firebaseUserData = await firebaseService.getUserData(firebaseUser.uid, firebaseUser.email || undefined);

          if (firebaseUserData) {
            if (firebaseUserData.isAdmin && !firebaseUserData.memberId) {
              firebaseUserData.memberId = await firebaseService.ensureUserHasMemberId(firebaseUserData.id || firebaseUser.uid);
            }

            const needsProfile = !firebaseUserData.discordUsername || !firebaseUserData.specialization;
            const user: User = {
              id: firebaseUserData.id || firebaseUser.uid,
              uid: firebaseUserData.uid || firebaseUser.uid,
              fullName: firebaseUserData.fullName || firebaseUser.displayName || '',
              email: firebaseUserData.email || firebaseUser.email || '',
              photoURL: firebaseUserData.photoURL || firebaseUser.photoURL || '',
              role: firebaseUserData.role || 'Member',
              status: firebaseUserData.status || 'Pending',
              isAdmin: !!firebaseUserData.isAdmin,
              authProvider: firebaseUserData.authProvider || 'google',
              specialization: firebaseUserData.specialization || '',
              discordUsername: firebaseUserData.discordUsername || '',
              memberId: firebaseUserData.memberId || undefined,
              createdAt: firebaseUserData.createdAt || new Date().toISOString(),
              updatedAt: firebaseUserData.updatedAt,
            };
            
            set({ currentUser: user });
            return {
              success: true,
              message: 'Google login successful.',
              user,
              needsProfile,
            };
          }
          
          return { success: false, message: 'Failed to retrieve user data.' };
        } catch (error: any) {
          console.error('Google login error:', error);
          return { success: false, message: error.message || 'Google login failed.' };
        }
      },

      logout: async () => {
        try {
          await firebaseService.signOut();
          set({ currentUser: null, users: [] });
        } catch (error) {
          console.error('Logout error:', error);
          set({ currentUser: null });
        }
      },

      setCurrentUser: (user: User | null) => {
        set({ currentUser: user });
      },

      updateCurrentUserFromFirebase: async (uid: string) => {
        try {
          let firebaseUserData = await firebaseService.getUserData(uid);
          if (firebaseUserData) {
            if (firebaseUserData.isAdmin && !firebaseUserData.memberId) {
              firebaseUserData.memberId = await firebaseService.ensureUserHasMemberId(uid);
            }
            const user: User = {
              id: uid,
              uid: uid,
              fullName: firebaseUserData.fullName || '',
              email: firebaseUserData.email || '',
              photoURL: firebaseUserData.photoURL || '',
              role: firebaseUserData.role || 'Member',
              status: firebaseUserData.status || 'Pending',
              isAdmin: firebaseUserData.isAdmin || false,
              specialization: firebaseUserData.specialization || '',
              discordUsername: firebaseUserData.discordUsername || '',
              memberId: firebaseUserData.memberId || undefined,
              createdAt: firebaseUserData.createdAt,
              updatedAt: firebaseUserData.updatedAt,
            };
            set({ currentUser: user });
          }
        } catch (error) {
          console.error('Error updating current user:', error);
        }
      },

      updateUserStatus: async (id, status, notes) => {
        let generatedMemberId: string | undefined;

        if (id.length > 10) {
          try {
            generatedMemberId = await firebaseService.updateUserStatus(id, status);
          } catch (err) {
            console.error('Error updating Firebase:', err);
          }
        }

        set((state) => {
          const updatedUsers = state.users.map((u) => {
            if (u.id === id) {
              const updated = { ...u, status, adminNotes: notes || u.adminNotes };
              if (status === 'Approved' && !updated.memberId) {
                updated.memberId = generatedMemberId || generateMemberCode();
              }
              return updated;
            }
            return u;
          });

          const isCurrentUser = state.currentUser?.id === id;
          return {
            users: updatedUsers,
            currentUser: isCurrentUser ? updatedUsers.find((u) => u.id === id) : state.currentUser,
          };
        });
      },

      generateMemberId: (userId) => {
        set((state) => {
          const updatedUsers = state.users.map((u) =>
            u.id === userId && !u.memberId ? { ...u, memberId: generateMemberCode() } : u
          );
          return { users: updatedUsers };
        });
      },

      setUsers: (users) => set({ users }),
    }),
    {
      name: 'bettergovph-store-v2',
      partialize: (state) => ({
        users: state.users,
        currentUser: state.currentUser ? {
          ...state.currentUser,
          password: undefined,
        } : null,
      }),
    }
  )
);
