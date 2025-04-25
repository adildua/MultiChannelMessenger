import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TopupFormProps {
  onSuccess?: () => void;
}

export function TopupForm({ onSuccess }: TopupFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(50);
  
  const quickAmounts = [10, 50, 100, 500];

  const topupMutation = useMutation({
    mutationFn: async () => {
      // Use direct topup for testing purposes
      return apiRequest("POST", "/api/direct-topup", { amount });
    },
    onSuccess: (response) => {
      toast({
        title: "Account Topped Up",
        description: `Successfully added $${amount} to your account balance.`,
      });
      
      // Invalidate the balance query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/user/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    topupMutation.mutate();
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Top Up Your Account</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</span>
            <input
              id="amount"
              type="number"
              className="block w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-700 mb-2">Quick Amounts</p>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                className={`px-4 py-2 text-sm border rounded-md transition-colors
                  ${amount === quickAmount 
                    ? 'bg-blue-100 border-blue-500 text-blue-700' 
                    : 'border-slate-300 hover:bg-slate-50'
                  }`}
                onClick={() => setAmount(quickAmount)}
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={topupMutation.isPending}
        >
          {topupMutation.isPending ? "Processing..." : "Add Funds to Account"}
        </Button>
      </form>
    </div>
  );
}