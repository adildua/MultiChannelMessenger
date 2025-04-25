import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Conversation } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserCheck, Users } from "lucide-react";
import { ConversationList } from "@/components/conversations/conversation-list";
import { ConversationDetail } from "@/components/conversations/conversation-detail";

export default function Conversations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("open");

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations', activeTab],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
  };

  const filteredConversations = conversations?.filter(conversation => {
    // Filter by search term (if implemented on backend, this would be handled there)
    const matchesSearch = searchTerm === "" || 
      conversation.id.toString().includes(searchTerm);
    
    // Filter by status
    const matchesStatus = activeTab === "all" || 
      (activeTab === "open" && conversation.status === "open") ||
      (activeTab === "assigned" && conversation.status === "assigned") ||
      (activeTab === "closed" && conversation.status === "closed");
    
    return matchesSearch && matchesStatus;
  });

  // Get selected conversation details
  const selectedConversation = conversations?.find(
    convo => convo.id === selectedConversationId
  );

  return (
    <div className="py-6 h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Conversations</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-[calc(100%-60px)]">
        <div className="py-4 h-full">
          <div className="flex h-full">
            {/* Conversations List Panel */}
            <Card className="w-1/3 mr-4 overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Messages</CardTitle>
                  <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="open">Open</TabsTrigger>
                      <TabsTrigger value="assigned">Assigned</TabsTrigger>
                      <TabsTrigger value="closed">Closed</TabsTrigger>
                      <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  {activeTab === "open" && "Unassigned conversations waiting for response"}
                  {activeTab === "assigned" && "Conversations currently being handled"}
                  {activeTab === "closed" && "Resolved conversations"}
                  {activeTab === "all" && "All conversations"}
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>
              <CardContent className="flex-1 overflow-auto p-0">
                <ConversationList 
                  conversations={filteredConversations || []}
                  isLoading={isLoading}
                  selectedId={selectedConversationId}
                  onSelect={handleSelectConversation}
                />
              </CardContent>
            </Card>

            {/* Conversation Detail Panel */}
            <Card className="flex-1 overflow-hidden flex flex-col">
              {selectedConversation ? (
                <ConversationDetail 
                  conversation={selectedConversation} 
                  onBack={() => setSelectedConversationId(null)} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Conversation Selected</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Select a conversation from the list to view and respond to messages.
                  </p>
                  {activeTab !== "open" && (
                    <Button variant="outline" onClick={() => setActiveTab("open")}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      View Open Conversations
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
