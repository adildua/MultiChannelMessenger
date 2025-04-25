import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  DollarSign,
  PiggyBank,
  BarChart3,
  RefreshCw,
  MessageSquare,
  Phone,
  MessageCircle,
  MessageSquareDashed,
} from "lucide-react";
import { TransactionList } from "@/components/billing/transaction-list";
import { TopupForm } from "@/components/billing/topup-form";
import { BalanceWidget } from "@/components/billing/balance-widget";

export default function Billing() {
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: balance } = useQuery<{ balance: number; currency: string }>({
    queryKey: ['/api/user/balance'],
  });

  const { data: channelRates } = useQuery<any[]>({
    queryKey: ['/api/channel-rates'],
  });

  // Calculate statistics
  const calculateStats = () => {
    if (!transactions) return { total: 0, spend: 0, topup: 0 };

    const total = transactions.length;
    const spend = transactions
      .filter(t => t.type === 'charge')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const topup = transactions
      .filter(t => t.type === 'topup')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { total, spend, topup };
  };

  const stats = calculateStats();

  // Mock channel rates for UI if API hasn't returned data yet
  const mockChannelRates = [
    { channel: "SMS", rate: 0.01, currency: "USD" },
    { channel: "VOIP", rate: 0.03, currency: "USD" },
    { channel: "WhatsApp", rate: 0.02, currency: "USD" },
    { channel: "RCS", rate: 0.015, currency: "USD" }
  ];

  const ratesData = channelRates || mockChannelRates;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Billing & Balance</h1>
          <Button onClick={() => setShowTopupDialog(true)} className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Add Credit
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Balance and Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {/* Current Balance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-primary mr-2" />
                  <div className="text-2xl font-bold">
                    {balance ? new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: balance.currency 
                    }).format(balance.balance) : "$0.00"}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowTopupDialog(true)}>
                  Add Funds
                </Button>
              </CardFooter>
            </Card>

            {/* Total Transactions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-blue-500 mr-2" />
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                All-time transaction count
              </CardFooter>
            </Card>

            {/* Total Spend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ArrowDownRight className="h-8 w-8 text-red-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: balance?.currency || 'USD'
                    }).format(stats.spend)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                All-time campaign expenditure
              </CardFooter>
            </Card>

            {/* Total Topup */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Topup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ArrowUpRight className="h-8 w-8 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: balance?.currency || 'USD'
                    }).format(stats.topup)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                All-time account credits
              </CardFooter>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Management</CardTitle>
              <CardDescription>
                View transaction history and manage your balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="transactions"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="rates">Channel Rates</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions" className="mt-6">
                  <TransactionList 
                    transactions={transactions || []}
                    isLoading={isLoadingTransactions}
                  />
                </TabsContent>
                <TabsContent value="rates" className="mt-6">
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Rate</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Rate</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ratesData.map((rate, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {rate.channel === "SMS" && <MessageSquare className="h-5 w-5 text-blue-500 mr-2" />}
                                {rate.channel === "VOIP" && <Phone className="h-5 w-5 text-green-500 mr-2" />}
                                {rate.channel === "WhatsApp" && <MessageCircle className="h-5 w-5 text-indigo-500 mr-2" />}
                                {rate.channel === "RCS" && <MessageSquareDashed className="h-5 w-5 text-purple-500 mr-2" />}
                                <span>{rate.channel}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {rate.rate.toFixed(4)} per message
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-green-600 font-medium">{(rate.rate * 0.9).toFixed(4)}</span>
                              {' '}
                              <span className="text-xs text-gray-500">(10% discount)</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {rate.currency || "USD"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>* Rates may vary based on destination country and volume. Contact support for custom pricing.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Topup Dialog */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Credit to Account</DialogTitle>
          </DialogHeader>
          <TopupForm onSuccess={() => setShowTopupDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}