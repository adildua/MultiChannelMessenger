import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Campaign, Channel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Phone,
  MessageCircle,
  MessageSquareDashed,
  Plus,
  Search,
  Filter,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CampaignForm from "@/components/campaigns/campaign-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();

  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateCampaign = () => {
    setSelectedCampaign(null);
    setShowCreateDialog(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCreateDialog(true);
  };

  const handleDeleteCampaign = async (id: number) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        await apiRequest('DELETE', `/api/campaigns/${id}`, undefined);
        queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
        toast({
          title: "Campaign deleted",
          description: "Campaign has been deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete campaign",
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const { id, createdAt, updatedAt, ...campaignData } = campaign;
      const newCampaign = {
        ...campaignData,
        name: `Copy of ${campaign.name}`,
        status: "draft",
      };
      
      await apiRequest('POST', '/api/campaigns', newCampaign);
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign duplicated",
        description: "Campaign has been duplicated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate campaign",
        variant: "destructive",
      });
    }
  };

  // Function to get channel name based on ID
  const getChannelName = (channelId: number) => {
    if (!channels) return "Unknown";
    const channel = channels.find(c => c.id === channelId);
    return channel ? channel.name : "Unknown";
  };

  // Function to get channel icon
  const getChannelIcon = (channelCode: string) => {
    switch (channelCode?.toLowerCase()) {
      case 'sms':
        return <MessageSquare className="text-blue-500 mr-2" />;
      case 'voip':
        return <Phone className="text-green-500 mr-2" />;
      case 'whatsapp':
        return <MessageCircle className="text-indigo-500 mr-2" />;
      case 'rcs':
        return <MessageSquareDashed className="text-purple-500 mr-2" />;
      default:
        return <MessageSquare className="text-gray-500 mr-2" />;
    }
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter campaigns based on search term and filters
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = searchTerm === "" || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || statusFilter === "" || campaign.status === statusFilter;
    
    const matchesChannel = channelFilter === "all" || channelFilter === "" || campaign.channelId.toString() === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Campaigns</CardTitle>
                  <CardDescription>Manage your communication campaigns</CardDescription>
                </div>
                <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-1 gap-4">
                  <div className="w-full md:w-1/2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Filter size={18} />
                          <SelectValue placeholder="Filter by status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-1/2">
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Filter size={18} />
                          <SelectValue placeholder="Filter by channel" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        {channels?.map(channel => (
                          <SelectItem key={channel.id} value={channel.id.toString()}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Campaigns Table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCampaigns ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          Loading campaigns...
                        </TableCell>
                      </TableRow>
                    ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map(campaign => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div className="font-medium">{campaign.name}</div>
                            {campaign.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {campaign.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getChannelIcon(getChannelName(campaign.channelId))}
                              <span>{getChannelName(campaign.channelId)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditCampaign(campaign)}>
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDuplicateCampaign(campaign)}>
                                Duplicate
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteCampaign(campaign.id)}>
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          {searchTerm || statusFilter || channelFilter ? 
                            "No campaigns match your search criteria" : 
                            "No campaigns found. Create your first campaign."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          </DialogHeader>
          <CampaignForm 
            campaign={selectedCampaign || undefined}
            onSuccess={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
