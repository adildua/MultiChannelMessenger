import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
  Search,
  ArrowUpDown,
} from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "amount-high" | "amount-low">("newest");

  // Filter transactions based on type and search
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesFilter = filter === "all" || transaction.type === filter;
    const matchesSearch = search === "" || 
      (transaction.description && transaction.description.toLowerCase().includes(search.toLowerCase())) ||
      transaction.reference?.toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sort === "amount-high") {
      return parseFloat(b.amount as string) - parseFloat(a.amount as string);
    } else if (sort === "amount-low") {
      return parseFloat(a.amount as string) - parseFloat(b.amount as string);
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex space-x-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="topup">Top Ups</SelectItem>
              <SelectItem value="charge">Charges</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sort} onValueChange={(val) => setSort(val as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="amount-high">Amount (high-low)</SelectItem>
              <SelectItem value="amount-low">Amount (low-high)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : sortedTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-2">
            <CreditCard className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No transactions found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {search || filter !== "all" 
              ? "Try changing your search or filter criteria" 
              : "Your transaction history will appear here"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end">
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Amount
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {transaction.type === "topup" ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-500" />
                    ) : transaction.type === "refund" ? (
                      <ArrowUpCircle className="h-5 w-5 text-blue-500" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(transaction.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{transaction.description || "Transaction"}</span>
                      <Badge 
                        variant={
                          transaction.type === "topup" 
                            ? "success" 
                            : transaction.type === "refund" 
                            ? "secondary" 
                            : "destructive"
                        }
                        className="w-fit capitalize text-xs mt-1"
                      >
                        {transaction.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {transaction.reference || "-"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap font-medium">
                    <span className={
                      transaction.type === "topup" || transaction.type === "refund"
                        ? "text-green-600"
                        : "text-red-600"
                    }>
                      {transaction.type === "topup" || transaction.type === "refund" ? "+" : "-"}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: transaction.currency || "USD",
                      }).format(parseFloat(transaction.amount as string))}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}