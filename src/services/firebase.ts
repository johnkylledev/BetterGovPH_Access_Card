import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjsyFt1_YCBIJksfkjEyC8PA-5_Or7YQo",
  authDomain: "bettergovph-access-card.firebaseapp.com",
  projectId: "bettergovph-access-card",
  storageBucket: "bettergovph-access-card.firebasestorage.app",
  messagingSenderId: "590708444054",
  appId: "1:590708444054:web:ab8105b1f1d3ca2035ebb7",
  measurementId: "G-FHFS95ZYQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await createOrUpdateUserRecord(user);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

const usersCollection = collection(db, 'users');

const MEMBER_ID_PREFIX = `BGPH-${new Date().getFullYear()}-`;

const parseMemberSequence = (memberId: string) => {
  const match = memberId.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : NaN;
};

const generateUniqueMemberId = async () => {
  const querySnapshot = await getDocs(usersCollection);
  let maxSequence = 1;

  querySnapshot.forEach((doc) => {
    const data = doc.data() as any;
    const memberId = data.memberId;
    if (typeof memberId === 'string' && memberId.startsWith(MEMBER_ID_PREFIX)) {
      const sequence = parseMemberSequence(memberId);
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });

  const nextSequence = maxSequence + 1;
  const paddedSequence = String(nextSequence).padStart(3, '0');
  return `${MEMBER_ID_PREFIX}${paddedSequence}`;
};

export const ensureUserHasMemberId = async (uid: string) => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    throw new Error('User record not found in Firestore.');
  }

  const existingData = userDocSnap.data() as any;
  if (existingData?.memberId) {
    return existingData.memberId;
  }

  const memberId = await generateUniqueMemberId();
  await updateDoc(userDocRef, {
    memberId,
    updatedAt: new Date().toISOString(),
  });
  return memberId;
};

export const createOrUpdateUserRecord = async (user: any) => {
  try {
    let userDocRef = doc(db, 'users', user.uid);
    let userDocSnap = await getDoc(userDocRef);
    let existingData = userDocSnap.exists() ? userDocSnap.data() : null;

    // If not found by UID, try searching by email to prevent duplicates
    if (!existingData && user.email) {
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        userDocRef = querySnapshot.docs[0].ref;
        existingData = querySnapshot.docs[0].data();
      }
    }

    const values: any = {
      id: existingData?.id || user.uid,
      uid: existingData?.uid || user.uid,
      email: user.email,
      fullName: existingData?.fullName || user.displayName || '',
      photoURL: user.photoURL || existingData?.photoURL || '',
      role: existingData?.role || 'Member',
      status: existingData?.status || 'Pending',
      isAdmin: existingData?.isAdmin ?? false,
      authProvider: existingData?.authProvider || 'google',
      createdAt: existingData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingData?.memberId) {
      values.memberId = existingData.memberId;
    }

    if (existingData?.discordUsername) {
      values.discordUsername = existingData.discordUsername;
    }

    if (existingData?.specialization) {
      values.specialization = existingData.specialization;
    }

    await setDoc(userDocRef, values, { merge: true });
  } catch (error) {
    console.error('Error creating or updating user record:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string, email?: string) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }

    // Fallback: search by email to handle cases where UID might have changed (e.g. Traditional to Google)
    const targetEmail = email || auth.currentUser?.email;
    if (targetEmail) {
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Update user data
export const updateUserData = async (uid: string, data: any) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

export const createUserDoc = async (user: any) => {
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, {
      ...user,
      uid: user.id,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const registerWithEmailPassword = async (userData: any) => {
  try {
    // Create Firebase Auth user
    const authResult = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const authUser = authResult.user;

    // Save user data to Firestore
    const userDocRef = doc(db, 'users', authUser.uid);
    await setDoc(userDocRef, {
      id: authUser.uid,
      uid: authUser.uid,
      email: userData.email,
      fullName: userData.fullName || '',
      password: userData.password,
      photoURL: userData.photoURL || '',
      discordUsername: userData.discordUsername || '',
      specialization: userData.specialization || '',
      role: userData.role || 'Member',
      status: 'Pending',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return authUser;
  } catch (error: any) {
    console.error('Error registering with email/password:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

export const getUserByEmailAndPassword = async (email: string, password: string): Promise<any | null> => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email), where('password', '==', password));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data() as any;
    return { id: docSnap.id, ...data };
  } catch (error) {
    console.error('Error fetching user by email and password:', error);
    throw error;
  }
};

export const getUserByMemberIdOrId = async (id: string): Promise<any | null> => {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('memberId', '==', id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const matchSnap = querySnapshot.docs[0];
    return { id: matchSnap.id, ...matchSnap.data() };
  } catch (error) {
    console.error('Error fetching user by memberId or id:', error);
    throw error;
  }
};

// Get all users (for admin dashboard)
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const users: any[] = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get non-admin users (for admin dashboard)
export const getNonAdminUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('isAdmin', '==', false));
    const querySnapshot = await getDocs(q);
    const users: any[] = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return users;
  } catch (error) {
    console.error('Error getting non-admin users:', error);
    throw error;
  }
};

// Update user status (for admin)
export const updateUserStatus = async (uid: string, status: 'Pending' | 'Approved' | 'Declined') => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error('User record not found in Firestore.');
    }

    const existingData = userDocSnap.data();
    const updates: any = {
      status: status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'Approved' && !existingData?.memberId) {
      updates.memberId = await generateUniqueMemberId();
    }

    await updateDoc(userDocRef, updates);
    return updates.memberId;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Set user as admin
export const setUserAsAdmin = async (uid: string, isAdmin: boolean) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      isAdmin: isAdmin,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting user as admin:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};
