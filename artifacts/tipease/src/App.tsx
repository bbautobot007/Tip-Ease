import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";

// Layouts
import Navbar from "@/components/layout/Navbar";

// Pages
import Home from "@/pages/home";
import SignInPage from "@/pages/auth/sign-in";
import SignUpPage from "@/pages/auth/sign-up";
import SelectRolePage from "@/pages/auth/select-role";
import NotFound from "@/pages/not-found";
import ProfilePage from "@/pages/profile";
import NotificationsPage from "@/pages/notifications";

// Guest Flow
import GuestDashboard from "@/pages/guest/dashboard";
import ScanPage from "@/pages/guest/scan";
import TipConfirmationPage from "@/pages/guest/tip";
import WalletPage from "@/pages/guest/wallet";
import HistoryPage from "@/pages/guest/history";

// Host Flow
import HostDashboard from "@/pages/host/dashboard";
import HostEventsPage from "@/pages/host/events/index";
import CreateEventPage from "@/pages/host/events/create";
import EventDetailPage from "@/pages/host/events/detail";
import VendorsPage from "@/pages/host/vendors/index";

// Vendor Flow
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorEventsPage from "@/pages/vendor/events/index";
import VendorEventDetailPage from "@/pages/vendor/events/detail";
import VendorProfilePage from "@/pages/vendor/profile";
import EarningsPage from "@/pages/vendor/earnings";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  const { data: userProfile, isLoading, isError } = useGetMe();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Show when="signed-in">
        {isError || !userProfile ? (
          <Redirect to="/select-role" />
        ) : !userProfile.role ? (
          <Redirect to="/select-role" />
        ) : (
          <Redirect to={`/${userProfile.role}`} />
        )}
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function AppRoutes() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/select-role" component={SelectRolePage} />
          
          {/* Shared Routes */}
          <Route path="/profile" component={ProfilePage} />
          <Route path="/notifications" component={NotificationsPage} />
          
          {/* Guest Flow */}
          <Route path="/guest" component={GuestDashboard} />
          <Route path="/guest/scan" component={ScanPage} />
          <Route path="/guest/tip/:token" component={TipConfirmationPage} />
          <Route path="/guest/wallet" component={WalletPage} />
          <Route path="/guest/history" component={HistoryPage} />
          
          {/* Host Flow */}
          <Route path="/host" component={HostDashboard} />
          <Route path="/host/events" component={HostEventsPage} />
          <Route path="/host/events/create" component={CreateEventPage} />
          <Route path="/host/events/:eventId" component={EventDetailPage} />
          <Route path="/host/vendors" component={VendorsPage} />
          
          {/* Vendor Flow */}
          <Route path="/vendor" component={VendorDashboard} />
          <Route path="/vendor/events" component={VendorEventsPage} />
          <Route path="/vendor/events/:eventId" component={VendorEventDetailPage} />
          <Route path="/vendor/profile" component={VendorProfilePage} />
          <Route path="/vendor/earnings" component={EarningsPage} />
          
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
