import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/mentor" element={<Mentor />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/aptitude" element={<Aptitude />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/career" element={<Career />} />
          <Route path="/startup" element={<Startup />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
