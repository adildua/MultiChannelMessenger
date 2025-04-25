import { Conversation } from "@shared/schema";
import { 
  MessageSquare, 
  MessageCircle, 
  Phone, 
  MessageSquareDashed,
  Clock,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ConversationList({ conversations, isLoading, selectedId, onSelect }: ConversationListProps) {
  // Function to get the appropriate icon based on channel type
  const getChannelIcon = (channel?: { code: string }) => {
    if (!channel) return <MessageSquare className="h-5 w-5 text-gray-400" />;
    
    switch (channel.code.toLowerCase()) {
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'voip':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5 text-indigo-500" />;
      case 'rcs':
        return <MessageSquareDashed className="h-5 w-5 text-purple-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-400" />;
    }
  };

  // Function to format time (e.g., "5m ago")
  const formatTime = (timestamp?: string | Date) => {
    if (!timestamp) return "now";
    
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "unknown";
    }
  };

  // Function to get status icon
  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'assigned':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'closed':
        return <MessageSquare className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  // Use conversations from props
  const conversationsToShow = conversations;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {conversationsToShow.map((conversation) => (
        <li 
          key={conversation.id}
          className={cn(
            "cursor-pointer hover:bg-gray-50 transition-colors",
            selectedId === conversation.id && "bg-gray-100"
          )}
          onClick={() => onSelect(conversation.id)}
        >
          <div className="px-4 py-4 flex items-start">
            <div className="min-w-0 flex-1 flex items-start">
              <div className="flex-shrink-0 mr-3">
                {getChannelIcon(conversation.channel)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                    {getStatusIcon(conversation.status)}
                    <span className="ml-1">
                      {conversation.contact?.firstName} {conversation.contact?.lastName}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTime(conversation.lastMessageAt)}
                  </p>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {conversation.lastMessage?.content || "No messages"}
                </p>
              </div>
            </div>
          </div>
        </li>
      ))}
      {conversationsToShow.length === 0 && (
        <li className="px-4 py-8 text-center text-gray-500">
          No conversations found
        </li>
      )}
    </ul>
  );
}
