import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Phone, MessageCircle, MessageSquareDashed, Split, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const baseNodeStyles = {
  padding: '10px',
  borderRadius: '5px',
  minWidth: '180px',
  minHeight: '80px',
};

const SmsNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div style={{ ...baseNodeStyles }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card className="border-blue-500 border-2">
        <CardHeader className="p-3 pb-0 flex flex-row items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-sm font-medium">SMS</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Textarea
            className="min-h-[60px] text-sm"
            placeholder="Enter SMS message..."
            value={data.content}
            onChange={(e) => data.onChange?.(e.target.value)}
          />
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
      />
    </div>
  );
});

const VoipNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div style={{ ...baseNodeStyles }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card className="border-green-500 border-2">
        <CardHeader className="p-3 pb-0 flex flex-row items-center gap-2">
          <Phone className="h-5 w-5 text-green-500" />
          <CardTitle className="text-sm font-medium">VOIP Call</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Textarea
            className="min-h-[60px] text-sm"
            placeholder="Enter call script..."
            value={data.content}
            onChange={(e) => data.onChange?.(e.target.value)}
          />
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
      />
    </div>
  );
});

const WhatsappNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div style={{ ...baseNodeStyles }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card className="border-indigo-500 border-2">
        <CardHeader className="p-3 pb-0 flex flex-row items-center gap-2">
          <MessageCircle className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Textarea
            className="min-h-[60px] text-sm"
            placeholder="Enter WhatsApp message..."
            value={data.content}
            onChange={(e) => data.onChange?.(e.target.value)}
          />
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
      />
    </div>
  );
});

const RcsNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div style={{ ...baseNodeStyles }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card className="border-purple-500 border-2">
        <CardHeader className="p-3 pb-0 flex flex-row items-center gap-2">
          <MessageSquareDashed className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-sm font-medium">RCS</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Textarea
            className="min-h-[60px] text-sm"
            placeholder="Enter RCS message..."
            value={data.content}
            onChange={(e) => data.onChange?.(e.target.value)}
          />
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
      />
    </div>
  );
});

const DecisionNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div style={{ ...baseNodeStyles }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card className="border-amber-500 border-2">
        <CardHeader className="p-3 pb-0 flex flex-row items-center gap-2">
          <Split className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-sm font-medium">Decision</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Textarea
            className="min-h-[60px] text-sm"
            placeholder="Enter condition..."
            value={data.content}
            onChange={(e) => data.onChange?.(e.target.value)}
          />
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '25%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '75%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

const WaitNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div style={{ ...baseNodeStyles }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card className="border-gray-500 border-2">
        <CardHeader className="p-3 pb-0 flex flex-row items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <CardTitle className="text-sm font-medium">Wait</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Textarea
            className="min-h-[60px] text-sm"
            placeholder="Enter wait duration..."
            value={data.content}
            onChange={(e) => data.onChange?.(e.target.value)}
          />
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
      />
    </div>
  );
});

export const NodeTypes = {
  SmsNode,
  VoipNode,
  WhatsappNode,
  RcsNode,
  DecisionNode,
  WaitNode,
};
