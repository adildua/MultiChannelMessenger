import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface ContactStatsData {
  total: number;
  active: number;
  segments: number;
  lists: number;
}

export function ContactStats() {
  const { data: stats, isLoading } = useQuery<ContactStatsData>({
    queryKey: ['/api/contacts/stats'],
  });

  // Default stats for UI rendering
  const defaultStats = {
    total: 12458,
    active: 8743,
    segments: 24,
    lists: 16
  };

  const displayStats = stats || defaultStats;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6">
        <CardTitle className="text-lg font-medium">Contact Stats</CardTitle>
      </CardHeader>
      <CardContent className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Total Contacts</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{displayStats.total.toLocaleString()}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Active Contacts</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{displayStats.active.toLocaleString()}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Segments</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{displayStats.segments}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Lists</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{displayStats.lists}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/contacts'}
          >
            Manage Contacts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContactStats;
