import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NodeTypes as CustomNodeTypes } from './node-types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

const nodeTypes: NodeTypes = {
  smsNode: CustomNodeTypes.SmsNode,
  voipNode: CustomNodeTypes.VoipNode,
  whatsappNode: CustomNodeTypes.WhatsappNode,
  rcsNode: CustomNodeTypes.RcsNode,
  decisionNode: CustomNodeTypes.DecisionNode,
  waitNode: CustomNodeTypes.WaitNode,
};

interface FlowBuilderProps {
  flowId?: number;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

export function FlowBuilder({ flowId, initialNodes = [], initialEdges = [] }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [flowName, setFlowName] = useState<string>(flowId ? '' : 'New Flow');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => 
        addEdge(
          {
            ...connection,
            type: 'custom',
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }, 
          eds
        )
      );
    },
    [setEdges]
  );

  // Add new node function
  const addNode = (type: string) => {
    const position = {
      x: Math.random() * 300,
      y: Math.random() * 300,
    };

    let newNode: Node = {
      id: `${type}-${nodes.length + 1}`,
      type: `${type}Node`,
      position,
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        content: ''
      },
    };

    setNodes([...nodes, newNode]);
  };

  // Save flow function
  const saveFlow = async () => {
    if (!flowName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a flow name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const method = flowId ? 'PUT' : 'POST';
      const url = flowId ? `/api/flows/${flowId}` : '/api/flows';
      
      await apiRequest(method, url, {
        name: flowName,
        nodes,
        edges,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/flows'] });
      
      toast({
        title: 'Success',
        description: `Flow ${flowId ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save flow',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle>Flow Builder</CardTitle>
          <div className="flex items-center gap-4">
            <Input
              className="w-64"
              placeholder="Flow Name"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
            />
            <Button 
              onClick={saveFlow}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Flow'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col h-full pt-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" onClick={() => addNode('sms')}>Add SMS Node</Button>
          <Button variant="outline" onClick={() => addNode('voip')}>Add VOIP Node</Button>
          <Button variant="outline" onClick={() => addNode('whatsapp')}>Add WhatsApp Node</Button>
          <Button variant="outline" onClick={() => addNode('rcs')}>Add RCS Node</Button>
          <Button variant="outline" onClick={() => addNode('decision')}>Add Decision Node</Button>
          <Button variant="outline" onClick={() => addNode('wait')}>Add Wait Node</Button>
        </div>
        
        <div className="flex-1 border border-gray-200 rounded-md overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}

export default FlowBuilder;
