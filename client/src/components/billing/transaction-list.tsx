import { Transaction } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  CreditCard,
  BanknoteIcon,
} from "lucide-react";
import { format } from "date-fns";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  // Function to format currency amount
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Function to get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case 'charge':
        return <ArrowDownRight className="h-5 w-5 text-red-500" />;
      case 'refund':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      default:
        return <BanknoteIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Mock transactions data for UI demonstration
  const mockTransactions = [
    {
      id: 1,
      type: 'topup',
      amount: 500,
      currencyCode: 'USD',
      description: 'Account credit via credit card',
      reference: 'CC-1234567',
      balanceBefore: 100,
      balanceAfter: 600,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: 'charge',
      amount: 25.50,
      currencyCode: 'USD',
      description: 'SMS campaign: Summer Sale',
      reference: 'CAM-7654321',
      balanceBefore: 600,
      balanceAfter: 574.50,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: 'charge',
      amount: 58.20,
      currencyCode: 'USD',
      description: 'VOIP campaign: Customer Feedback',
      reference: 'CAM-8765432',
      balanceBefore: 574.50,
      balanceAfter: 516.30,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      type: 'refund',
      amount: 10.00,
      currencyCode: 'USD',
      description: 'Refund for failed messages',
      reference: 'REF-9876543',
      balanceBefore: 516.30,
      balanceAfter: 526.30,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      type: 'topup',
      amount: 200,
      currencyCode: 'USD',
      description: 'Account credit via bank transfer',
      reference: 'BT-1234567',
      balanceBefore: 526.30,
      balanceAfter: 726.30,
      createdAt: new Date().toISOString()
    }
  ];

  // Use mock data if no transactions available
  const transactionsToShow = transactions.length > 0 ? transactions : mockTransactions;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactionsToShow.length > 0 ? (
            transactionsToShow.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center">
                    {getTransactionIcon(transaction.type)}
                    <span className="ml-2 capitalize">{transaction.type}</span>
                  </div>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.reference}</TableCell>
                <TableCell className={transaction.type === 'charge' ? 'text-red-600' : transaction.type === 'topup' ? 'text-green-600' : ''}>
                  {transaction.type === 'charge' ? '- ' : transaction.type === 'topup' ? '+ ' : ''}
                  {formatCurrency(transaction.amount, transaction.currencyCode)}
                </TableCell>
                <TableCell>
                  {formatCurrency(transaction.balanceAfter, transaction.currencyCode)}
                </TableCell>
                <TableCell>{formatDate(transaction.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10">
                <div className="flex flex-col items-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
