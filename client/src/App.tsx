import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import StudyPage from "@/pages/study-page";
import GuidePage from "@/pages/guide-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/reading" component={StudyPage} />
      <ProtectedRoute path="/speaking" component={StudyPage} />
      <ProtectedRoute path="/writing" component={StudyPage} />
      <ProtectedRoute path="/listening" component={StudyPage} />
      <ProtectedRoute path="/coaching" component={StudyPage} />
      <ProtectedRoute path="/daily" component={StudyPage} />
      <Route path="/guide" component={GuidePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;