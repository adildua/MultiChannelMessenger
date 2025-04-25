import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Smartphone, Copy, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface SmsTemplateSimulatorProps {
  defaultTemplate?: {
    name: string;
    type: string;
    senderId: string;
    content: string;
    variables?: Record<string, string>;
  };
  onSave: (templateData: any) => void;
  onClose: () => void;
}

export default function SmsTemplateSimulator({ 
  defaultTemplate, 
  onSave, 
  onClose 
}: SmsTemplateSimulatorProps) {
  const { toast } = useToast();
  const [name, setName] = useState(defaultTemplate?.name || "");
  const [type, setType] = useState(defaultTemplate?.type || "transactional");
  const [senderId, setSenderId] = useState(defaultTemplate?.senderId || "");
  const [content, setContent] = useState(defaultTemplate?.content || "");
  const [variables, setVariables] = useState<Record<string, string>>(defaultTemplate?.variables || {});
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);
  const [previewContent, setPreviewContent] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  
  // Available sender IDs for selection
  const availableSenderIds = [
    { id: "INFO", name: "INFO" },
    { id: "ALERT", name: "ALERT" },
    { id: "NOTIFY", name: "NOTIFY" },
    { id: "COMPANY", name: "COMPANY" },
    { id: "SUPPORT", name: "SUPPORT" },
  ];

  // Extract variables from content and update preview
  useEffect(() => {
    // Extract variables
    const regex = /\{([^}]+)\}/g;
    let matches: RegExpExecArray | null;
    const vars: string[] = [];
    
    // Use exec in a loop instead of matchAll for better compatibility
    while ((matches = regex.exec(content)) !== null) {
      if (matches[1]) {
        vars.push(matches[1]);
      }
    }
    
    // Use Array.from for Set conversion for better compatibility
    const uniqueVars = Array.from(new Set(vars));
    setExtractedVariables(uniqueVars);
    
    // Create variable fields if they don't exist
    const newVariables = { ...variables };
    uniqueVars.forEach(v => {
      if (!newVariables[v]) {
        newVariables[v] = `[${v}]`;
      }
    });
    setVariables(newVariables);
    
    // Update preview
    let preview = content;
    Object.entries(newVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    setPreviewContent(preview);
    
    // Calculate character count and segments
    setCharCount(preview.length);
    
    // SMS segments logic (160 chars for single, 153 chars per segment for multi)
    if (preview.length <= 160) {
      setSegmentCount(1);
    } else {
      setSegmentCount(Math.ceil(preview.length / 153));
    }
  }, [content, variables]);

  const handleVariableChange = (varName: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const handleSave = () => {
    if (!name) {
      toast({
        title: "Missing information",
        description: "Please enter a template name",
        variant: "destructive"
      });
      return;
    }
    
    if (!content) {
      toast({
        title: "Missing information",
        description: "Please enter template content",
        variant: "destructive"
      });
      return;
    }
    
    if (!senderId) {
      toast({
        title: "Missing information",
        description: "Please select a sender ID",
        variant: "destructive"
      });
      return;
    }
    
    onSave({
      name,
      type,
      senderId,
      content,
      variables
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewContent).then(() => {
      toast({
        title: "Copied!",
        description: "Template content copied to clipboard",
      });
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Template Editor */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>SMS Template Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input 
              id="name" 
              placeholder="Enter template name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-gray-500">A descriptive name for your template</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Template Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="otp">OTP</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {type === 'transactional' && 'For important service updates and transactional messages'}
              {type === 'promotional' && 'For marketing and promotional campaigns'}
              {type === 'otp' && 'For one-time passwords and verification codes'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sender">Sender ID</Label>
            <Select value={senderId} onValueChange={setSenderId}>
              <SelectTrigger id="sender">
                <SelectValue placeholder="Select sender ID" />
              </SelectTrigger>
              <SelectContent>
                {availableSenderIds.map(sid => (
                  <SelectItem key={sid.id} value={sid.id}>{sid.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">The name that will appear as the sender</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="content">Template Content</Label>
              <div className="text-xs text-gray-500">
                {charCount} characters | {segmentCount} segment{segmentCount !== 1 ? 's' : ''}
              </div>
            </div>
            <Textarea 
              id="content" 
              placeholder="Enter your SMS content here. Use {variable} syntax for dynamic content." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="font-mono"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info size={12} />
              Use curly braces to define variables, e.g. {'{customername}'}
            </p>
          </div>
          
          {extractedVariables.length > 0 && (
            <div className="space-y-3 border rounded-md p-3 bg-gray-50">
              <h3 className="text-sm font-medium">Variable Values for Preview</h3>
              {extractedVariables.map(varName => (
                <div key={varName} className="grid grid-cols-2 gap-2">
                  <Label htmlFor={`var-${varName}`} className="text-xs flex items-center">
                    {varName}
                  </Label>
                  <Input 
                    id={`var-${varName}`}
                    value={variables[varName] || ""}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Value for ${varName}`}
                    size={20}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Template</Button>
        </CardFooter>
      </Card>
      
      {/* Preview Simulator */}
      <Card className="h-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>SMS Preview</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="w-64 h-[500px] bg-gray-100 rounded-[32px] border-8 border-gray-800 relative overflow-hidden shadow-xl">
              {/* Phone Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-lg z-10"></div>
              
              {/* Status Bar */}
              <div className="pt-7 px-3 bg-gray-900 text-white text-[10px] flex justify-between items-center h-14">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
              </div>
              
              {/* Messages Screen */}
              <div className="bg-gray-200 h-[calc(100%-3.5rem)] overflow-y-auto py-3 px-2">
                <div className="flex flex-col gap-2">
                  <div className="text-[8px] text-center text-gray-500">Today 9:41 AM</div>
                  
                  {/* Sender Info */}
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-bold text-gray-700">{senderId || 'SENDER'}</div>
                    
                    {/* Message Bubble */}
                    <div className="bg-white rounded-lg p-2 shadow-sm text-[11px] text-gray-800">
                      {previewContent || 'Your message preview will appear here'}
                      
                      {charCount > 0 && (
                        <div className="flex justify-end items-center gap-1 mt-1 text-[8px] text-gray-500">
                          <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <CheckCircle size={8} className="text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                <Smartphone className="inline-block mr-1" size={16} />
                SMS Preview Simulator
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Estimated cost: ${(segmentCount * 0.01).toFixed(2)} USD
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}