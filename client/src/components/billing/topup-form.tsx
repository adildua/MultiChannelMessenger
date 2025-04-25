import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

interface TopupFormProps {
  onSuccess?: () => void;
}

export function TopupForm({ onSuccess }: TopupFormProps) {
  const [amount, setAmount] = useState("50");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Instead of processing payment here, redirect to checkout page
      setLocation(`/checkout?amount=${numAmount}`);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
      toast({
        title: "Error",
        description: "Failed to redirect to checkout. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <Input
            id="amount"
            value={amount}
            onChange={handleAmountChange}
            className="pl-8"
            placeholder="Enter amount"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleQuickAmount(10)}
          className="text-center"
        >
          $10
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleQuickAmount(50)}
          className="text-center"
        >
          $50
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleQuickAmount(100)}
          className="text-center"
        >
          $100
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full mt-6"
        disabled={isLoading || !amount || parseFloat(amount) <= 0}
      >
        {isLoading ? (
          "Processing..."
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Payment
          </>
        )}
      </Button>
    </form>
  );
}