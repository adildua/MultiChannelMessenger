import { useState, useRef, useEffect } from "react";
import { Conversation } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  MessageSquare,
  Phone,
  MessageCircle,
  MessageSquareDashed,
  ArrowLeft,
  MoreVertical,
  Send,
  User,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ConversationDetailProps {
  conversation: Conversation;
  onBack: () => void;
}

interface Message {
  id: number;
  content: string;
  direction: string;
  sentAt: string;
  sender?: {
    name: string;
  };
}

export function ConversationDetail({ conversation, onBack }: ConversationDetailProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch messages for this conversation
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversation.id}/messages`],
  });

  // Fetch users for assignment
  const { data: users } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await apiRequest('POST', `/api/conversations/${conversation.id}/messages`, { 
        content: messageInput 
      });
      
      // Invalidate messages query to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversation.id}/messages`] });
      
      setMessageInput("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Assign conversation to a user
  const handleAssign = async (userId: string) => {
    try {
      await apiRequest('PUT', `/api/conversations/${conversation.id}/assign`, { 
        userId: parseInt(userId) 
      });
      
      // Invalidate conversation queries to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversation.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      toast({
        title: "Conversation assigned",
        description: "The conversation has been assigned successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Close conversation
  const handleClose = async () => {
    try {
      await apiRequest('PUT', `/api/conversations/${conversation.id}/close`, undefined);
      
      // Invalidate conversation queries to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversation.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      toast({
        title: "Conversation closed",
        description: "The conversation has been closed successfully.",
      });

      // Go back to conversation list
      onBack();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get appropriate icon based on channel
  const getChannelIcon = (channel?: { code: string }) => {
    if (!channel) return <MessageSquare className="h-5 w-5" />;
    
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
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  // Mock messages for UI demonstration if no messages returned yet
  const mockMessages = [
    {
      id: 1,
      content: "Hello! I need help with my recent order #12345.",
      direction: "inbound",
      sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      content: "Hi there! I'd be happy to help you with your order. Could you please provide more details about the issue you're experiencing?",
      direction: "outbound",
      sentAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      sender: { name: "Alex Morgan" }
    },
    {
      id: 3,
      content: "I ordered a product last week, but it hasn't arrived yet. The tracking number doesn't show any updates for 3 days.",
      direction: "inbound",
      sentAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      content: "I understand your concern. Let me check the status of your order right away. This might take a few minutes.",
      direction: "outbound",
      sentAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      sender: { name: "Alex Morgan" }
    },
    {
      id: 5,
      content: "Thank you, I'll wait.",
      direction: "inbound",
      sentAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    }
  ];

  // Format time for messages
  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "unknown time";
    }
  };

  // Use mock messages if no messages available
  const messagesToShow = messages && messages.length > 0 ? messages : mockMessages;

  // Mock users for UI if none available
  const mockUsers = [
    { id: 1, name: "Alex Morgan" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "John Doe" }
  ];

  const usersToShow = users && users.length > 0 ? users : mockUsers;

  return (
    <>
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>
                  {conversation.contact?.firstName?.charAt(0)}
                  {conversation.contact?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-medium">
                  {conversation.contact?.firstName} {conversation.contact?.lastName}
                </h3>
                <div className="flex items-center text-xs text-gray-500">
                  {getChannelIcon(conversation.channel)}
                  <span className="ml-1 capitalize">{conversation.channel?.code.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {conversation.status !== 'closed' && (
              <Select onValueChange={handleAssign}>
                <SelectTrigger className="w-[180px] mr-2 text-xs h-8">
                  <SelectValue placeholder="Assign conversation" />
                </SelectTrigger>
                <SelectContent>
                  {usersToShow.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {conversation.status !== 'closed' && (
                  <DropdownMenuItem onClick={handleClose}>
                    Close Conversation
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>View Contact Info</DropdownMenuItem>
                <DropdownMenuItem>View History</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Messages area */}
      <CardContent className="p-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messagesToShow.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.direction === 'outbound' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.direction === 'outbound' && message.sender && (
                    <div className="text-xs opacity-75 mb-1 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {message.sender.name}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={`text-xs mt-1 text-right ${
                    message.direction === 'outbound' 
                      ? 'text-primary-foreground/70' 
                      : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.sentAt)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Message input */}
      {conversation.status !== 'closed' && (
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardFooter>
      )}

      {/* Closed conversation notice */}
      {conversation.status === 'closed' && (
        <CardFooter className="p-4 border-t text-center text-sm text-gray-500">
          This conversation is closed. Reopen it to send messages.
        </CardFooter>
      )}
    </>
  );
}
