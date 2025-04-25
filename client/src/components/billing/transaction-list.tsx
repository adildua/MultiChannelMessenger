import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define a Transaction interface based on our app's needs
interface Transaction {
  id: number;
  type: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string | Date;
  tenantId: number;
  metadata?: any;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const [filter, setFilter] = useState<string>("all");
  
  // Filter transactions based on the selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true;
    return transaction.type === filter;
  });

  // Function to format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Function to format amount with currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={filter === "payment" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("payment")}
          >
            Payments
          </Button>
          <Button 
            variant={filter === "charge" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("charge")}
          >
            Charges
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          No transactions found.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className={cn(
                      "p-2 rounded-full mr-2",
                      transaction.type === "payment" ? "bg-green-100" : "bg-blue-100"
                    )}>
                      {transaction.type === "payment" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <span className="capitalize">{transaction.type}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                <TableCell>{transaction.description || (
                  transaction.type === "payment" 
                    ? "Account Top-up" 
                    : "Channel Usage"
                )}</TableCell>
                <TableCell className="text-right">
                  <span className={transaction.type === "payment" ? "text-green-600" : ""}>
                    {transaction.type === "payment" ? "+" : ""}
                    {formatAmount(transaction.amount, transaction.currency)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    transaction.status === "completed" ? "bg-green-100 text-green-800" :
                    transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  )}>
                    {transaction.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}