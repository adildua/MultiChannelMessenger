import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BalanceWidgetProps {
  className?: string;
  balance?: number;
  currency?: string;
}

export function BalanceWidget({ className, balance: initialBalance, currency = "USD" }: BalanceWidgetProps) {
  const [balance, setBalance] = useState<number | undefined>(initialBalance);

  const { data, isLoading } = useQuery<{ balance: number; currency: string }>({
    queryKey: ['/api/user/balance'],
    enabled: initialBalance === undefined,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (data && data.balance !== undefined) {
      setBalance(data.balance);
    }
  }, [data]);

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance || 0);

  const isLowBalance = (balance || 0) < 20;

  return (
    <div className={cn("p-4 border rounded-lg bg-white shadow-sm", className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full",
          isLowBalance ? "bg-red-100" : "bg-green-100"
        )}>
          <Wallet className={cn(
            "h-5 w-5",
            isLowBalance ? "text-red-500" : "text-green-500"
          )} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Current Balance</p>
          <p className="text-2xl font-semibold">{isLoading ? "Loading..." : formattedBalance}</p>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between">
        <Link href="/billing">
          <a className="text-sm text-blue-500 hover:text-blue-700">View Transactions</a>
        </Link>
        <Link href="/checkout">
          <a className="text-sm text-blue-500 hover:text-blue-700">Top Up</a>
        </Link>
      </div>
    </div>
  );
}