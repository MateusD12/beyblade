import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import Collection from "./pages/Collection";
import Components from "./pages/Components";
import Stats from "./pages/Stats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Collection />} />
            <Route path="/collection" element={<Navigate to="/" replace />} />
            <Route path="/components" element={<Components />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
