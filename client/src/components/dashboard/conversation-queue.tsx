import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Conversation } from "@shared/schema";
import { MessageSquare, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConversationQueue() {
  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations/queue'],
  });

  // Function to determine the icon based on channel type
  const getChannelIcon = (channelType: string) => {
    switch (channelType?.toLowerCase()) {
      case 'whatsapp':
        return <MessageCircle className="text-xl text-green-500" />;
      case 'sms':
        return <MessageSquare className="text-xl text-blue-500" />;
      default:
        return <MessageSquare className="text-xl text-gray-500" />;
    }
  };

  // Function to format time (e.g., "5m ago")
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "now";
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Mock conversations for initial UI
  const mockConversations = [
    {
      id: 1,
      contactName: "John Smith",
      message: "I need help with my order #12345",
      channelType: "whatsapp",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      contactName: "Sarah Johnson",
      message: "When will my package arrive?",
      channelType: "sms",
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString()
    }
  ];

  const conversationsToDisplay = conversations || mockConversations;
  const waitingCount = conversationsToDisplay.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Conversation Queue</CardTitle>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          {waitingCount} Waiting
        </span>
      </CardHeader>
      <CardContent className="border-t border-gray-200 p-0">
        <ul className="divide-y divide-gray-200">
          {conversationsToDisplay.map((convo) => (
            <li key={convo.id}>
              <a href="#" className="block hover:bg-gray-50">
                <div className="px-4 py-4 flex items-center">
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0">
                      {getChannelIcon(convo.channelType)}
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{convo.contactName}</p>
                      <p className="text-sm text-gray-500 truncate">{convo.message}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{formatTime(convo.timestamp)}</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-gray-50 text-right">
        <a href="/conversations" className="text-sm font-medium text-primary hover:text-primary/80">View all</a>
      </CardFooter>
    </Card>
  );
}

export default ConversationQueue;
