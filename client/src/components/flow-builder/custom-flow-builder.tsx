import { useCallback, useState, useRef } from 'react';
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
  MarkerType,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Add proper import for the node types
import { CustomNodeTypes } from "@/components/flow-builder/custom-node-types";
import type { BackgroundVariant } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  ChevronDown, 
  ChevronRight, 
  MessageCircle, 
  Search, 
  Webhook, 
  Phone, 
  StopCircle, 
  Menu, 
  Send, 
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  triggerNode: CustomNodeTypes.TriggerNode,
  webhookNode: CustomNodeTypes.WebhookNode,
  stopNode: CustomNodeTypes.StopNode,
  incomingCallNode: CustomNodeTypes.IncomingCallNode,
  endCallNode: CustomNodeTypes.EndCallNode,
  callForwardNode: CustomNodeTypes.CallForwardNode,
  makeCallNode: CustomNodeTypes.MakeCallNode,
  ivrMenuNode: CustomNodeTypes.IvrMenuNode,
  playNode: CustomNodeTypes.PlayNode,
  smsNode: CustomNodeTypes.SmsNode,
  whatsappNode: CustomNodeTypes.WhatsappNode,
  emailNode: CustomNodeTypes.EmailNode,
  callbackNode: CustomNodeTypes.CallbackNode,
};

interface FlowBuilderProps {
  flowId?: number;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

type CategoryType = 'trigger' | 'stop' | 'call' | 'communication' | 'function';

interface CategoryItem {
  id: string;
  label: string;
  nodeType: string;
  icon: React.ReactNode;
}

interface Category {
  id: CategoryType;
  label: string;
  items: CategoryItem[];
}

export function CustomFlowBuilder({ flowId, initialNodes = [], initialEdges = [] }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [flowName, setFlowName] = useState<string>(flowId ? 'Chatbot username' : 'Chatbot username');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<CategoryType[]>(['trigger']);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { toast } = useToast();

  const categories: Category[] = [
    {
      id: 'trigger',
      label: 'Trigger',
      items: [
        { id: 'webhook', label: 'Webhook', nodeType: 'webhookNode', icon: <Webhook className="h-4 w-4" /> },
      ]
    },
    {
      id: 'stop',
      label: 'Stop',
      items: [
        { id: 'stop', label: 'Stop', nodeType: 'stopNode', icon: <StopCircle className="h-4 w-4 text-red-500" /> },
      ]
    },
    {
      id: 'call',
      label: 'Call',
      items: [
        { id: 'incoming-call', label: 'Incoming Call', nodeType: 'incomingCallNode', icon: <Phone className="h-4 w-4" /> },
        { id: 'end-call', label: 'End Call', nodeType: 'endCallNode', icon: <StopCircle className="h-4 w-4 text-red-500" /> },
        { id: 'call-forward', label: 'Call Forward', nodeType: 'callForwardNode', icon: <Phone className="h-4 w-4" /> },
        { id: 'make-call', label: 'Make Call', nodeType: 'makeCallNode', icon: <Phone className="h-4 w-4" /> },
        { id: 'ivr-menu', label: 'IVR Menu', nodeType: 'ivrMenuNode', icon: <Menu className="h-4 w-4" /> },
        { id: 'play', label: 'Play', nodeType: 'playNode', icon: <FileSpreadsheet className="h-4 w-4" /> },
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      items: [
        { id: 'sms', label: 'SMS', nodeType: 'smsNode', icon: <Send className="h-4 w-4 text-blue-500" /> },
        { id: 'whatsapp', label: 'Whatsapp', nodeType: 'whatsappNode', icon: <MessageCircle className="h-4 w-4 text-green-500" /> },
        { id: 'email', label: 'Send Email', nodeType: 'emailNode', icon: <Send className="h-4 w-4" /> },
      ]
    },
    {
      id: 'function',
      label: 'Function',
      items: [
        { id: 'callback', label: 'Callback', nodeType: 'callbackNode', icon: <Phone className="h-4 w-4" /> },
      ]
    }
  ];

  const toggleCategory = (category: CategoryType) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => 
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5 5' },
            animated: true
          }, 
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('nodeName', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const nodeName = event.dataTransfer.getData('nodeName');
      
      if (!type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeId = `${type}-${nodes.length + 1}`;
      const newNode: Node = {
        id: nodeId,
        type,
        position,
        data: { 
          label: nodeName,
          content: ''
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes, setNodes]
  );

  const filteredCategories = categories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

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
    <div className="flex h-full border border-gray-200 bg-white">
      {/* Left sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <div className="p-3 border-b border-gray-200">
          <Input 
            placeholder="Search nodes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
            // Remove prefix which is causing an issue
            
          />
        </div>
        <div className="py-2">
          {filteredCategories.map(category => (
            <div key={category.id} className="mb-1">
              <button 
                className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => toggleCategory(category.id)}
              >
                {category.label}
                {expandedCategories.includes(category.id) ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
              {expandedCategories.includes(category.id) && (
                <div className="pl-4 pr-2 pb-1">
                  {category.items.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 cursor-grab"
                      draggable
                      onDragStart={(event) => onDragStart(event, item.nodeType, item.label)}
                    >
                      <div className="mr-2 flex-shrink-0">{item.icon}</div>
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Flow canvas */}
      <div className="flex-1 flex flex-col h-full">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="text-lg font-medium text-gray-900">{flowName}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Back</Button>
            <Button variant="outline" size="sm">Refresh</Button>
            <Button size="sm" onClick={saveFlow} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Flow'}
            </Button>
          </div>
        </div>
        <div 
          className="flex-1" 
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            fitView
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { strokeWidth: 2, stroke: '#94a3b8' },
            }}
          >
            <Controls />
            <MiniMap 
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
            <Background gap={16} color="#f1f5f9" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default CustomFlowBuilder;