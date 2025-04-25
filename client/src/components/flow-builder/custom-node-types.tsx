import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Webhook, 
  StopCircle, 
  Phone, 
  Send, 
  MessageCircle,
  Play,
  Mail,
  Menu,
  File
} from 'lucide-react';

const baseNodeStyles = {
  padding: '10px',
  borderRadius: '5px',
  width: '180px',
};

// These are special styles for node types as seen in the screenshot
const nodeColors = {
  trigger: { bg: '#f3f4f6', border: '#3b82f6', icon: '#3b82f6' },
  stop: { bg: '#fee2e2', border: '#ef4444', icon: '#ef4444' },
  call: { bg: '#fee2e2', border: '#f59e0b', icon: '#f59e0b' },
  whatsapp: { bg: '#ecfccb', border: '#84cc16', icon: '#84cc16' },
  sms: { bg: '#dbeafe', border: '#3b82f6', icon: '#3b82f6' },
  function: { bg: '#f3f4f6', border: '#64748b', icon: '#64748b' },
};

// Trigger Nodes
const TriggerNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.trigger.bg,
        border: `2px solid ${nodeColors.trigger.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <div className="flex items-center">
        <Webhook className="mr-2 h-5 w-5" style={{ color: nodeColors.trigger.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.trigger.border }}
      />
    </div>
  );
});

const WebhookNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.trigger.bg,
        border: `2px solid ${nodeColors.trigger.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <div className="flex items-center">
        <Webhook className="mr-2 h-5 w-5" style={{ color: nodeColors.trigger.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.trigger.border }}
      />
    </div>
  );
});

// Stop Nodes
const StopNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.stop.bg,
        border: `2px solid ${nodeColors.stop.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.stop.border }}
      />
      <div className="flex items-center">
        <StopCircle className="mr-2 h-5 w-5" style={{ color: nodeColors.stop.border }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
    </div>
  );
});

// Call Nodes
const IncomingCallNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.call.bg,
        border: `2px solid ${nodeColors.call.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
      <div className="flex items-center">
        <Phone className="mr-2 h-5 w-5" style={{ color: nodeColors.call.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
    </div>
  );
});

const EndCallNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.stop.bg,
        border: `2px solid ${nodeColors.stop.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.stop.border }}
      />
      <div className="flex items-center">
        <StopCircle className="mr-2 h-5 w-5" style={{ color: nodeColors.stop.border }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
    </div>
  );
});

const CallForwardNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.call.bg,
        border: `2px solid ${nodeColors.call.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
      <div className="flex items-center">
        <Phone className="mr-2 h-5 w-5" style={{ color: nodeColors.call.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
    </div>
  );
});

const MakeCallNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.call.bg,
        border: `2px solid ${nodeColors.call.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
      <div className="flex items-center">
        <Phone className="mr-2 h-5 w-5" style={{ color: nodeColors.call.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
    </div>
  );
});

const IvrMenuNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.call.bg,
        border: `2px solid ${nodeColors.call.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
      <div className="flex items-center">
        <Menu className="mr-2 h-5 w-5" style={{ color: nodeColors.call.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
    </div>
  );
});

const PlayNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.call.bg,
        border: `2px solid ${nodeColors.call.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
      <div className="flex items-center">
        <Play className="mr-2 h-5 w-5" style={{ color: nodeColors.call.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.call.border }}
      />
    </div>
  );
});

// Communication Nodes
const SmsNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.sms.bg,
        border: `2px solid ${nodeColors.sms.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.sms.border }}
      />
      <div className="flex items-center">
        <Send className="mr-2 h-5 w-5" style={{ color: nodeColors.sms.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.sms.border }}
      />
    </div>
  );
});

const WhatsappNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.whatsapp.bg,
        border: `2px solid ${nodeColors.whatsapp.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.whatsapp.border }}
      />
      <div className="flex items-center">
        <MessageCircle className="mr-2 h-5 w-5" style={{ color: nodeColors.whatsapp.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.whatsapp.border }}
      />
    </div>
  );
});

const EmailNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.function.bg,
        border: `2px solid ${nodeColors.function.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.function.border }}
      />
      <div className="flex items-center">
        <Mail className="mr-2 h-5 w-5" style={{ color: nodeColors.function.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.function.border }}
      />
    </div>
  );
});

// Function Nodes
const CallbackNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div 
      style={{ 
        ...baseNodeStyles, 
        background: nodeColors.function.bg,
        border: `2px solid ${nodeColors.function.border}`,
        borderRadius: '8px',
        padding: '10px 15px'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: nodeColors.function.border }}
      />
      <div className="flex items-center">
        <File className="mr-2 h-5 w-5" style={{ color: nodeColors.function.icon }} />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ background: nodeColors.function.border }}
      />
    </div>
  );
});

export const CustomNodeTypes = {
  TriggerNode,
  WebhookNode,
  StopNode,
  IncomingCallNode,
  EndCallNode,
  CallForwardNode,
  MakeCallNode,
  IvrMenuNode,
  PlayNode,
  SmsNode,
  WhatsappNode,
  EmailNode,
  CallbackNode,
};