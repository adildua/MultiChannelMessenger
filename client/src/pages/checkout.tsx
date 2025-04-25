import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key, using dummy key');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy_key_for_development');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/billing',
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      // Payment succeeded, redirect happens automatically
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState('50');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createPaymentIntent = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", { amount });
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        toast({
          title: "Error",
          description: "Could not create payment. Please try again.",
          variant: "destructive", 
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to payment service.",
        variant: "destructive",
      });
      console.error("Payment intent error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Funds to Your Account</CardTitle>
          <CardDescription>
            Add credit to your account for messaging services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!clientSecret ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="amount">Amount</label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                />
              </div>
              <Button 
                onClick={createPaymentIntent} 
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Continue to Payment"}
              </Button>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          )}
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          Your card will be charged securely through Stripe.
        </CardFooter>
      </Card>
    </div>
  );
}