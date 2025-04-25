import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface BalanceWidgetProps {
  className?: string;
  balance?: number;
  currency?: string;
}

export function BalanceWidget({ className, balance, currency = "USD" }: BalanceWidgetProps) {
  const { data: balanceData } = useQuery<{ balance: number; currency: string }>({
    queryKey: ['/api/user/balance'],
    enabled: balance === undefined,
  });
  
  const displayBalance = balance !== undefined 
    ? balance 
    : (balanceData?.balance || 0);
  
  const displayCurrency = currency || balanceData?.currency || "USD";
  
  const formattedBalance = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: displayCurrency 
  }).format(displayBalance);

  return (
    <div className={cn("flex items-center bg-gray-100 px-3 py-1 rounded-full", className)}>
      <span className="text-sm font-medium text-gray-700">Balance:</span>
      <span className="ml-1 text-sm font-semibold text-primary">{formattedBalance}</span>
    </div>
  );
}

export default BalanceWidget;
