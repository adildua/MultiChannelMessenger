import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { ChannelPerformance } from "@/components/analytics/channel-performance";
import { CampaignStats } from "@/components/analytics/campaign-stats";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

export default function Analytics() {
  // Date range state for filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  // Selected channel for filtering
  const [channelFilter, setChannelFilter] = useState<string>("all");
  
  // Selected tenant for filtering in multi-tenant setups
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Query for analytics data - would be paginated and filtered in a real app
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/analytics', activeTab, channelFilter, tenantFilter, dateRange],
    // Disable automatic refetching since we'll do it manually
    enabled: false,
  });

  // Mock tenants for UI
  const tenants = [
    { id: "all", name: "All Tenants" },
    { id: "1", name: "Acme Corporation" },
    { id: "2", name: "TechSolutions Inc." },
    { id: "3", name: "Global Services LLC" },
  ];

  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
  };

  // Handle export button click
  const handleExport = () => {
    // In a real app, this would generate a CSV or PDF report
    alert("This would export your analytics data as a CSV file");
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Filters Card */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Analytics Filters</CardTitle>
              <CardDescription>
                Filter your analytics data by date, channel, and tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Date Range</label>
                  <DatePickerWithRange
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Channel</label>
                  <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="voip">VOIP</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="rcs">RCS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Tenant</label>
                  <Select value={tenantFilter} onValueChange={setTenantFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Analytics Content */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>
                    Insights across your communication channels
                  </CardDescription>
                </div>
                <Tabs
                  defaultValue="overview"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-[400px]"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="channels">Channels</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="overview" className="mt-0">
                {/* Overview Tab */}
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Messages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">124,578</div>
                        <div className="text-xs text-green-500 flex items-center mt-1">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            18.2%
                          </span>
                          <span className="text-gray-400 ml-1">vs last period</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Delivery Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">97.8%</div>
                        <div className="text-xs text-green-500 flex items-center mt-1">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            2.1%
                          </span>
                          <span className="text-gray-400 ml-1">vs last period</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Response Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">24.3%</div>
                        <div className="text-xs text-red-500 flex items-center mt-1">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            1.8%
                          </span>
                          <span className="text-gray-400 ml-1">vs last period</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Avg. Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">$0.018</div>
                        <div className="text-xs text-green-500 flex items-center mt-1">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            0.3%
                          </span>
                          <span className="text-gray-400 ml-1">vs last period</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Message Volume Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ChannelPerformance />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="channels" className="mt-0">
                <ChannelPerformance />
              </TabsContent>
              <TabsContent value="campaigns" className="mt-0">
                <CampaignStats />
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
