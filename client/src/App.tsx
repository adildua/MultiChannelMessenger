import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Contacts from "@/pages/contacts";
import FlowBuilder from "@/pages/flow-builder";
import Templates from "@/pages/templates";
import WhatsAppTemplates from "@/pages/whatsapp-templates";
import Conversations from "@/pages/conversations";
import ApiIntegrations from "@/pages/api-integrations";
import TenantManagement from "@/pages/tenant-management";
import Billing from "@/pages/billing";
import Checkout from "@/pages/checkout";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import AppLayout from "@/components/layouts/app-layout";
import { ThemeProvider } from "./components/theme-provider";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/campaigns">
        <AppLayout>
          <Campaigns />
        </AppLayout>
      </Route>
      <Route path="/contacts">
        <AppLayout>
          <Contacts />
        </AppLayout>
      </Route>
      <Route path="/flow-builder">
        <AppLayout>
          <FlowBuilder />
        </AppLayout>
      </Route>
      <Route path="/templates">
        <AppLayout>
          <Templates />
        </AppLayout>
      </Route>
      <Route path="/whatsapp-templates">
        <AppLayout>
          <WhatsAppTemplates />
        </AppLayout>
      </Route>
      <Route path="/conversations">
        <AppLayout>
          <Conversations />
        </AppLayout>
      </Route>
      <Route path="/api-integrations">
        <AppLayout>
          <ApiIntegrations />
        </AppLayout>
      </Route>
      <Route path="/tenant-management">
        <AppLayout>
          <TenantManagement />
        </AppLayout>
      </Route>
      <Route path="/billing">
        <AppLayout>
          <Billing />
        </AppLayout>
      </Route>
      <Route path="/checkout">
        <AppLayout>
          <Checkout />
        </AppLayout>
      </Route>
      <Route path="/analytics">
        <AppLayout>
          <Analytics />
        </AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
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
      <ThemeProvider defaultTheme="light">
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
