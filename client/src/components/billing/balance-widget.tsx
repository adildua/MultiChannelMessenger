import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "wouter";
import { CreditCard } from "lucide-react";

interface BalanceWidgetProps {
  className?: string;
  balance?: number;
  currency?: string;
}

export function BalanceWidget({ className, balance, currency = "USD" }: BalanceWidgetProps) {
  const navigate = useNavigate();
  
  // If balance was not passed as a prop, fetch it from the API
  const { data } = useQuery({
    queryKey: ['/api/user/balance'],
    enabled: balance === undefined,
  });
  
  const displayBalance = balance !== undefined ? balance : data?.balance || 0;
  const displayCurrency = currency || data?.currency || "USD";
  
  const formattedBalance = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: displayCurrency 
  }).format(displayBalance);
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Current Balance</span>
          <span className="text-2xl font-bold">{formattedBalance}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate("/checkout")}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Add Funds
        </Button>
      </CardFooter>
    </Card>
  );
}