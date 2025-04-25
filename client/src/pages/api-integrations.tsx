import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiIntegration, Channel } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  MessageSquare,
  Phone,
  MessageCircle,
  MessageSquareDashed,
  AlertCircle,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { ApiIntegrationForm } from "@/components/api-integrations/api-integration-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function ApiIntegrations() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
  const { toast } = useToast();

  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery<ApiIntegration[]>({
    queryKey: ['/api/api-integrations'],
  });

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
  });

  const handleCreateIntegration = () => {
    setSelectedIntegration(null);
    setShowFormDialog(true);
  };

  const handleEditIntegration = (integration: ApiIntegration) => {
    setSelectedIntegration(integration);
    setShowFormDialog(true);
  };

  const handleDeleteIntegration = async (id: number) => {
    if (confirm("Are you sure you want to delete this integration?")) {
      try {
        await apiRequest('DELETE', `/api/api-integrations/${id}`, undefined);
        queryClient.invalidateQueries({ queryKey: ['/api/api-integrations'] });
        toast({
          title: "Integration deleted",
          description: "API integration has been deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete API integration",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (integration: ApiIntegration) => {
    try {
      await apiRequest('PUT', `/api/api-integrations/${integration.id}/toggle`, {
        isActive: !integration.isActive
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-integrations'] });
      toast({
        title: integration.isActive ? "Integration disabled" : "Integration enabled",
        description: `API integration has been ${integration.isActive ? 'disabled' : 'enabled'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update API integration status",
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
  const getChannelIcon = (channelName: string) => {
    switch (channelName.toLowerCase()) {
      case 'sms':
        return <MessageSquare className="text-blue-500" />;
      case 'voip':
        return <Phone className="text-green-500" />;
      case 'whatsapp':
        return <MessageCircle className="text-indigo-500" />;
      case 'rcs':
        return <MessageSquareDashed className="text-purple-500" />;
      default:
        return <AlertCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">API Integrations</h1>
          <Button onClick={handleCreateIntegration} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Integration
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Integrations</CardTitle>
              <CardDescription>
                Connect your communication channels to external APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingIntegrations ? (
                <div className="text-center py-10">Loading API integrations...</div>
              ) : integrations && integrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>API Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrations.map(integration => (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <div className="font-medium">{integration.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getChannelIcon(getChannelName(integration.channelId))}
                            <span>{getChannelName(integration.channelId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {integration.baseUrl && (
                              <div className="truncate max-w-xs">
                                <span className="font-medium">URL:</span> {integration.baseUrl}
                              </div>
                            )}
                            {integration.apiKey && (
                              <div>
                                <span className="font-medium">API Key:</span> {integration.apiKey}
                              </div>
                            )}
                            {integration.accountSid && (
                              <div>
                                <span className="font-medium">Account:</span> {integration.accountSid}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={integration.isActive}
                            onCheckedChange={() => handleToggleStatus(integration)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditIntegration(integration)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteIntegration(integration.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No API Integrations</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    You haven't set up any API integrations yet. Connect your communication channels to external services to start sending messages.
                  </p>
                  <Button onClick={handleCreateIntegration}>
                    Set Up First Integration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Integration Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedIntegration ? 'Edit API Integration' : 'Create New API Integration'}
            </DialogTitle>
          </DialogHeader>
          <ApiIntegrationForm
            integration={selectedIntegration || undefined}
            onSuccess={() => setShowFormDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
