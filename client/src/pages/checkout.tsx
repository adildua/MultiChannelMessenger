import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const CheckoutForm = ({ amount }: { amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/billing",
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Something went wrong with your payment",
          variant: "destructive",
        });
      } else {
        // Payment succeeded - but this won't execute because we're redirected
        toast({
          title: "Payment Successful",
          description: "Thank you for your payment!",
        });
        setLocation("/billing");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation("/billing")}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          className="flex-1"
          disabled={!stripe || isLoading}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get the amount from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amountParam = params.get('amount');
    
    if (!amountParam) {
      setError("No amount specified. Please go back and try again.");
      setIsLoading(false);
      return;
    }
    
    const numAmount = parseFloat(amountParam);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Invalid amount. Please go back and try again.");
      setIsLoading(false);
      return;
    }
    
    setAmount(numAmount);
    
    // Check for payment_intent_client_secret in the URL, which indicates the payment is complete
    const paymentStatus = params.get('payment_intent_client_secret');
    if (paymentStatus) {
      setPaymentSuccess(true);
      setIsLoading(false);
      return;
    }

    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { amount: numAmount })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to create payment intent");
        }
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error creating payment intent:", err);
        setError("Failed to initialize payment. Please try again later.");
        setIsLoading(false);
        toast({
          title: "Payment Setup Failed",
          description: "There was an error setting up the payment. Please try again later.",
          variant: "destructive",
        });
      });
  }, [toast]);

  if (paymentSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your account has been credited with ${amount.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation("/billing")}>
              Return to Billing
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Add funds to your account balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => setLocation("/billing")}>
                Return to Billing
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-2">Order Summary</h3>
                <div className="flex justify-between py-2 border-b">
                  <span>Account Top-up</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Total</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
              </div>

              {clientSecret && (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#6366f1',
                      },
                    },
                  }}
                >
                  <CheckoutForm amount={amount} />
                </Elements>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}