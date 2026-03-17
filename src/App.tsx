import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Dashboard from "./pages/Dashboard";
import Characters from "./pages/Characters";
import Mentor from "./pages/Mentor";
import Chat from "./pages/Chat";
import Aptitude from "./pages/Aptitude";
import Interview from "./pages/Interview";
import Career from "./pages/Career";
import Startup from "./pages/Startup";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/Profile";
import AuthPage from "./pages/Auth";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/mentor" element={<Mentor />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/aptitude" element={<Aptitude />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/career" element={<Career />} />
        <Route path="/startup" element={<Startup />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={user ? <NotFound /> : <Navigate to="/auth" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
