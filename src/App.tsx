import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Verify from "./pages/public/Verify";
import { useStore } from "./store/useStore";
import { auth } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { LoadingOverlay } from "./components/LoadingOverlay";

export default function App() {
  const { updateCurrentUserFromFirebase } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await updateCurrentUserFromFirebase(firebaseUser.uid);
      }
      useStore.getState().setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, [updateCurrentUserFromFirebase]);

  const { authInitialized } = useStore();

  return (
    <>
      {!authInitialized && <LoadingOverlay />}
      <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/:id" element={<Verify />} />
      </Routes>
    </Router>
    </>
  );
}
