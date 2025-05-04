import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./lib/theme-provider";
import { AuthProvider, ProtectedRoute } from "./lib/auth-context";
import { Fragment, Suspense } from "react";
import Sidebar from "./components/sidebar";
import MusicPlayer from "./components/music-player";
import TopBar from "./components/top-bar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TodoList from "@/pages/todo-list";
import QuickNotes from "@/pages/quick-notes";
import LoginPage from "@/pages/login";

// Main app layout with sidebar
function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar currentPath={location} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900 pb-24">
          {children}
        </div>
        <MusicPlayer />
      </main>
      
      {/* Floating Add New Note Button */}
      <button className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center transition-all duration-200 z-10">
        <i className="ri-add-line text-2xl"></i>
      </button>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <LoginPage />
      </Route>
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <Home />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/todos">
        <ProtectedRoute>
          <AppLayout>
            <TodoList />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/quick-notes">
        <ProtectedRoute>
          <AppLayout>
            <QuickNotes />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="notes-vibes-theme">
        <AuthProvider>
          <Suspense fallback={<Fragment />}>
            <Router />
            <Toaster />
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
