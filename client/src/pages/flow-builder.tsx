import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flow } from "@shared/schema";
import { CustomFlowBuilder } from "@/components/flow-builder/custom-flow-builder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeftCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FlowBuilder() {
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { toast } = useToast();

  const { data: flows, isLoading } = useQuery<Flow[]>({
    queryKey: ['/api/flows'],
  });

  const handleSelectFlow = (flow: Flow) => {
    try {
      // Parse nodes and edges from JSON strings to objects
      const parsedFlow = {
        ...flow,
        nodes: flow.nodes ? JSON.parse(flow.nodes.toString()) : [],
        edges: flow.edges ? JSON.parse(flow.edges.toString()) : []
      };
      
      setSelectedFlow(parsedFlow);
      setIsCreatingNew(false);
    } catch (error) {
      toast({
        title: "Error loading flow",
        description: "Unable to parse flow data. The flow may be corrupted.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedFlow(null);
    setIsCreatingNew(true);
  };

  const handleBack = () => {
    setSelectedFlow(null);
    setIsCreatingNew(false);
  };

  // If a flow is selected or creating new, show the flow builder
  if (selectedFlow || isCreatingNew) {
    return (
      <div className="py-6 h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={handleBack} className="mr-2">
              <ArrowLeftCircle className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {selectedFlow ? `Edit Flow: ${selectedFlow.name}` : 'Create New Flow'}
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-[calc(100%-60px)]">
          <CustomFlowBuilder 
            flowId={selectedFlow?.id} 
            initialNodes={selectedFlow?.nodes || [] as any}
            initialEdges={selectedFlow?.edges || [] as any}
          />
        </div>
      </div>
    );
  }

  // Otherwise show the list of flows
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Flow Builder</h1>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Flow
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Flows</CardTitle>
              <CardDescription>
                Create and manage cross-channel communication workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">Loading flows...</div>
              ) : flows && flows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flows.map(flow => (
                    <Card key={flow.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectFlow(flow)}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{flow.name}</CardTitle>
                        {flow.description && (
                          <CardDescription className="text-sm truncate">
                            {flow.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${flow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {flow.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(flow.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-4">No flows found. Create your first communication flow.</p>
                  <Button onClick={handleCreateNew}>
                    Create New Flow
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
