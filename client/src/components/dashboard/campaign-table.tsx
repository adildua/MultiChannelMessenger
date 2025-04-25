import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import { 
  MessageSquare, 
  Phone, 
  MessageCircle, 
  MessageSquareDashed 
} from "lucide-react";

interface CampaignTableProps {
  onNewCampaign: () => void;
}

export function CampaignTable({ onNewCampaign }: CampaignTableProps) {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns/recent'],
  });

  // Function to get the icon based on campaign type/channel
  const getChannelIcon = (channelType: string) => {
    switch (channelType?.toLowerCase()) {
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

  // Mock campaigns for initial UI
  const mockCampaigns = [
    {
      id: 1,
      name: 'Summer Sale Promotion',
      channelType: 'sms',
      status: 'active',
      performance: 85,
      date: 'Aug 10, 2023'
    },
    {
      id: 2,
      name: 'Welcome Calls',
      channelType: 'voip',
      status: 'active',
      performance: 72,
      date: 'Aug 8, 2023'
    },
    {
      id: 3,
      name: 'Customer Feedback',
      channelType: 'whatsapp',
      status: 'scheduled',
      performance: 0,
      date: 'Aug 15, 2023'
    },
    {
      id: 4,
      name: 'Product Launch',
      channelType: 'rcs',
      status: 'completed',
      performance: 100,
      date: 'Aug 5, 2023'
    }
  ];

  const campaignsToDisplay = campaigns || mockCampaigns;

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Recent Campaigns</CardTitle>
        <Button onClick={onNewCampaign}>
          New Campaign
        </Button>
      </CardHeader>
      <CardContent className="border-t border-gray-200 p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignsToDisplay.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getChannelIcon(campaign.channelType)}
                      <span className="text-sm text-gray-500">{campaign.channelType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className={`${campaign.performance === 100 ? 'bg-blue-500' : 'bg-green-500'} h-2.5 rounded-full`} 
                          style={{ width: `${campaign.performance}%` }}
                        ></div>
                      </div>
                      <span>{campaign.performance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignTable;
