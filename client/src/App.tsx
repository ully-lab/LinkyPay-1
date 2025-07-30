import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import AddProducts from "@/pages/add-products";
import Assignments from "@/pages/assignments";
import Payments from "@/pages/payments";
import UserIntake from "@/pages/user-intake";
import AdminPage from "@/pages/admin";
import PendingApproval from "@/pages/pending-approval";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show pending approval page if user is not approved
  if ((user as any)?.status === 'pending') {
    return <PendingApproval />;
  }

  // Show rejected message if user is rejected
  if ((user as any)?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Your account access has been denied.</p>
          <button 
            onClick={() => window.location.href = "/api/logout"}
            className="text-blue-600 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Show dashboard for approved users
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/add-products" component={AddProducts} />
      <Route path="/user-intake" component={UserIntake} />
      <Route path="/assignments" component={Assignments} />
      <Route path="/payments" component={Payments} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated || (user as any)?.status !== 'approved') {
    return <Router />;
  }

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
