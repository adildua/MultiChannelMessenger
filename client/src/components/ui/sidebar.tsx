import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { 
  LayoutDashboard, 
  Megaphone, 
  BookUser, 
  GitGraph, 
  FileCode, 
  MessageSquareText, 
  Plug2, 
  Users2, 
  Wallet, 
  BarChartHorizontalBig, 
  Settings 
} from "lucide-react";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
}

const SidebarNavItem = ({ href, icon: Icon, label, isActive }: SidebarNavItemProps) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center px-2 py-2 text-base font-medium rounded-md group transition-colors", 
        isActive 
          ? "bg-gray-900 text-white dark:bg-gray-800" 
          : "text-gray-300 hover:bg-gray-700 hover:text-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      )}
    >
      <Icon className={cn(
        "mr-3 h-5 w-5", 
        isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-300 dark:group-hover:text-gray-300"
      )} />
      {label}
    </Link>
  );
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/contacts", label: "Contacts", icon: BookUser },
    { href: "/flow-builder", label: "Flow Builder", icon: GitGraph },
    { href: "/templates", label: "Templates", icon: FileCode },
    { href: "/conversations", label: "Conversations", icon: MessageSquareText },
    { href: "/api-integrations", label: "API Integrations", icon: Plug2 },
    { href: "/tenant-management", label: "Tenant Management", icon: Users2 },
    { href: "/billing", label: "Billing & Balance", icon: Wallet },
    { href: "/analytics", label: "Analytics", icon: BarChartHorizontalBig },
    { href: "/settings", label: "Settings", icon: Settings }
  ];

  return (
    <div className={cn("flex flex-col w-64 bg-gray-800 dark:bg-gray-900", className)}>
      <div className="flex items-center justify-center h-16 px-4 bg-gray-900 dark:bg-gray-950">
        <span className="text-white text-lg font-semibold">OMNI<span className="text-primary">COMM</span></span>
      </div>
      
      {/* Sidebar Navigation */}
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto scrollbar-hide">
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <SidebarNavItem 
              key={item.href}
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              isActive={location === item.href}
            />
          ))}
        </nav>
      </div>
      
      {/* User Menu */}
      <div className="flex items-center p-4 border-t border-gray-700 dark:border-gray-800">
        <div className="flex-shrink-0">
          <img className="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-white">Alex Morgan</p>
          <p className="text-xs font-medium text-gray-300 dark:text-gray-400">Administrator</p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
