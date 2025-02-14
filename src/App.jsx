import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import WatchPage from "./pages/WatchPage";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authUser";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import SearchPage from "./pages/SearchPage";
import SearchHistoryPage from "./pages/SearchHistoryPage";
import NotFoundPage from "./pages/404";
import { Canvas } from "@react-three/fiber"; // Import Canvas for 3D interface
import { Experience } from "./components/Experience"; // Import Experience component for 3D elements
import { UI } from "./components/UI"; // Import UI for avatar chat interface

function App() {
  const { user, isCheckingAuth, authCheck } = useAuthStore();

  useEffect(() => {
    authCheck();
  }, [authCheck]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen">
        <div className="flex justify-center items-center bg-black h-full">
          <Loader className="animate-spin text-red-600 size-10" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/watch/:id" element={user ? <WatchPage /> : <Navigate to="/login" />} />
        <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <SearchHistoryPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Footer */}
      <Footer />

      {/* Avatar Chat Interface */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <Loader />
        <UI />
        <Canvas 
          shadows 
          camera={{ position: [0, 0, 2], fov: 45 }} 
          className="!fixed top-0 left-0 pointer-events-auto"
          style={{ pointerEvents: 'none' }}
        >
          <Experience />
        </Canvas>
      </div>

      {/* Toaster Notification */}
      <Toaster position="bottom-center" />
    </>
  );
}

export default App;
