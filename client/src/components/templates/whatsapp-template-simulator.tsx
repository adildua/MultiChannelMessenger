import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface WhatsAppTemplateSimulatorProps {
  defaultTemplate?: {
    name?: string;
    category?: string;
    language?: string;
    headerType?: string;
    body?: string;
    footer?: string;
  };
  onSave?: (template: any) => void;
  onClose?: () => void;
}

export function WhatsAppTemplateSimulator({
  defaultTemplate,
  onSave,
  onClose,
}: WhatsAppTemplateSimulatorProps) {
  const [template, setTemplate] = useState({
    name: defaultTemplate?.name || "",
    category: defaultTemplate?.category || "marketing",
    language: defaultTemplate?.language || "english",
    headerType: defaultTemplate?.headerType || "none",
    body: defaultTemplate?.body || "Hi {{1}}, this is a test message from {{2}}",
    footer: defaultTemplate?.footer || "Footer text",
    variables: {
      "1": "John",
      "2": "Campaign Manager",
    },
  });
  
  const [activeTab, setActiveTab] = useState<string>("edit");

  const handleChange = (field: string, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVariableChange = (key: string, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value,
      },
    }));
  };

  const getVariablesFromBody = () => {
    const regex = /{{([0-9]+)}}/g;
    let matches: RegExpExecArray | null;
    const results: string[] = [];
    
    while ((matches = regex.exec(template.body)) !== null) {
      if (matches[1] && !results.includes(matches[1])) {
        results.push(matches[1]);
      }
    }
    
    return results;
  };
  
  const replaceVariablesInText = (text: string) => {
    return text.replace(/{{([0-9]+)}}/g, (match, number) => {
      return template.variables[number as keyof typeof template.variables] || match;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(template);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left side - Template Editor */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Template</TabsTrigger>
            <TabsTrigger value="test">Test Variables</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="template-name">Give your message template a name</Label>
              <Input
                id="template-name"
                value={template.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="E.g., Welcome Message"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Category</Label>
              <p className="text-sm text-gray-500 mb-2">Choose what type of message template you want to create</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className={cn(
                    "cursor-pointer hover:border-primary transition-colors", 
                    template.category === "marketing" ? "border-primary bg-primary/5" : ""
                  )}
                  onClick={() => handleChange("category", "marketing")}
                >
                  <CardHeader className="py-3">
                    <h3 className="text-sm font-medium">Marketing</h3>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xs text-gray-500">
                      Send promo, offers, product offers and more to increase awareness and engagement.
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={cn(
                    "cursor-pointer hover:border-primary transition-colors",
                    template.category === "utility" ? "border-primary bg-primary/5" : ""
                  )}
                  onClick={() => handleChange("category", "utility")}
                >
                  <CardHeader className="py-3">
                    <h3 className="text-sm font-medium">Utility</h3>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xs text-gray-500">
                      Send account updates, order updates, alerts and more to share important information.
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={cn(
                    "cursor-pointer hover:border-primary transition-colors",
                    template.category === "authentication" ? "border-primary bg-primary/5" : ""
                  )}
                  onClick={() => handleChange("category", "authentication")}
                >
                  <CardHeader className="py-3">
                    <h3 className="text-sm font-medium">Authentication</h3>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xs text-gray-500">
                      Send codes that allow your customers to access their accounts.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div>
              <Label htmlFor="language">Language</Label>
              <Select 
                value={template.language} 
                onValueChange={(value) => handleChange("language", value)}
              >
                <SelectTrigger id="language" className="mt-1">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="mandarin">Mandarin</SelectItem>
                  <SelectItem value="arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="header-type">Header</Label>
              <Select 
                value={template.headerType} 
                onValueChange={(value) => handleChange("headerType", value)}
              >
                <SelectTrigger id="header-type" className="mt-1">
                  <SelectValue placeholder="Select Header Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={template.body}
                onChange={(e) => handleChange("body", e.target.value)}
                placeholder="Enter the text for your message in the language you have selected."
                className="mt-1 min-h-[120px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {`{{number}}`} to add variables. Example: Hi {`{{1}}`}, your order #{`{{2}}`} has been shipped.
              </p>
            </div>
            
            <div>
              <Label htmlFor="footer">Footer Text</Label>
              <Input
                id="footer"
                value={template.footer}
                onChange={(e) => handleChange("footer", e.target.value)}
                placeholder="Footer text"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a 60 character footer to your message. Variables are not supported in the footer.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="test" className="space-y-4 pt-4">
            <div>
              <h3 className="font-medium mb-2">Test Variables</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enter test values for the variables in your template to see how it will look.
              </p>
              
              {getVariablesFromBody().length > 0 ? (
                <div className="space-y-3">
                  {getVariablesFromBody().map((varNum) => (
                    <div key={varNum}>
                      <Label htmlFor={`var-${varNum}`}>Variable {`{{${varNum}}}`}:</Label>
                      <Input
                        id={`var-${varNum}`}
                        value={template.variables[varNum as keyof typeof template.variables] || ""}
                        onChange={(e) => handleVariableChange(varNum, e.target.value)}
                        placeholder={`Value for variable {{${varNum}}}`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed rounded-md">
                  <p className="text-gray-500">No variables found in your template.</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add variables using {`{{number}}`} format in the body text.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Template
          </Button>
        </div>
      </div>
      
      {/* Right side - Template Preview */}
      <div className="h-full">
        <div className="sticky top-24">
          <h3 className="font-medium mb-4">Template Preview</h3>
          <div className="border rounded-md p-6 bg-gray-50 max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* WhatsApp style message preview */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 text-white">
                <h3 className="font-medium">WhatsApp Preview</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {template.headerType !== "none" && (
                  <div className="bg-gray-100 rounded-md p-3 text-center text-gray-500">
                    {template.headerType === "text" && <p>Text Header</p>}
                    {template.headerType === "image" && <p>Image Header</p>}
                    {template.headerType === "video" && <p>Video Header</p>}
                    {template.headerType === "document" && <p>Document Header</p>}
                  </div>
                )}
                
                <div className="bg-gray-100 rounded-lg p-3 relative ml-2">
                  <div className="absolute top-3 left-0 w-0 h-0 transform -translate-x-full 
                    border-t-8 border-r-8 border-b-8 
                    border-transparent border-r-gray-100 border-b-transparent">
                  </div>
                  <p className="whitespace-pre-wrap">{replaceVariablesInText(template.body)}</p>
                </div>
                
                {template.footer && (
                  <div className="text-gray-500 text-xs px-3">
                    {template.footer}
                  </div>
                )}
              </div>
              
              <div className="border-t p-3 flex justify-between items-center bg-gray-50">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Category:</span> {template.category}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Language:</span> {template.language}
                </div>
              </div>
              
              <CardFooter className="bg-white border-t p-3">
                <div className="text-xs text-gray-500 w-full">
                  <p><span className="font-medium">Name:</span> {template.name || "Untitled Template"}</p>
                  <p className="mt-1"><span className="font-medium">Variables:</span> {getVariablesFromBody().map(v => `{{${v}}}`).join(", ")}</p>
                </div>
              </CardFooter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppTemplateSimulator;