import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import SearchPage from "./pages/SearchPage";
import SearchHistoryPage from "./pages/SearchHistoryPage";
import WatchPage from "./pages/WatchPage";
import NotFoundPage from "./pages/404";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAuthStore } from "./store/authUser";

function App() {
  const { authCheck } = useAuthStore();

  useEffect(() => {
    authCheck();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/history" element={<SearchHistoryPage />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Avatar Chat Interface */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <Loader />
        <Leva />
        <UI />
        <Canvas shadows camera={{ position: [0, 0, 2], fov: 45 }} className="w-screen h-screen fixed top-0 left-0">
          <Experience />
        </Canvas>
      </div>

      <Toaster position="bottom-center" />
    </Router>
  );
}

export default App