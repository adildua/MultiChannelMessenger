import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { BalanceWidget } from "@/components/billing/balance-widget";
import { Menu, Search, Bell, Wallet } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for non-mobile */}
      {!isMobile && (
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden px-4 text-gray-500">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden px-4 text-gray-500 dark:text-gray-400" 
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </Button>
          )}
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <label htmlFor="search-field" className="sr-only">Search</label>
                <div className="relative w-full text-gray-500 dark:text-gray-400 focus-within:text-gray-700 dark:focus-within:text-gray-300">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 ml-3" />
                  </div>
                  <Input 
                    id="search-field" 
                    className="block w-full h-full pl-10 pr-3 py-2 border-transparent bg-white dark:bg-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm" 
                    placeholder="Search" 
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            {/* Header Right Menu */}
            <div className="ml-4 flex items-center md:ml-6">
              {/* Balance Widget */}
              <div className="hidden sm:flex items-center mr-4">
                <Link href="/billing" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
                  <Wallet className="h-4 w-4" /> 
                  <span>$1,250.00</span>
                </Link>
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </Button>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="max-w-xs flex items-center text-sm rounded-full">
                    <span className="sr-only">Open user menu</span>
                    <img className="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
