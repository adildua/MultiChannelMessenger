import { useState, useEffect } from "react";
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
import { 
  Image, 
  Video, 
  FileText, 
  Upload, 
  X, 
  Paperclip, 
  VideoIcon, 
  FileImage,
  FileVideo,
  FilePlus,
  File,
  Phone,
  Link,
  MessageSquare
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WhatsAppTemplateSimulatorProps {
  defaultTemplate?: {
    name?: string;
    category?: string;
    language?: string;
    headerType?: string;
    headerContent?: string;
    body?: string;
    footer?: string;
    buttons?: any[];
    includeButtons?: boolean;
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
    headerContent: defaultTemplate?.headerContent || "",
    headerImage: null as string | null, // Base64 content for image preview
    headerVideo: null as string | null, // Base64 content for video preview
    headerDocument: null as { name: string; type: string; size: number } | null,
    headerImageFilename: "",
    headerVideoFilename: "",
    headerDocumentFilename: "",
    body: defaultTemplate?.body || "Hi {{1}}, this is a test message from {{2}}",
    footer: defaultTemplate?.footer || "Footer text",
    includeButtons: defaultTemplate?.includeButtons || false,
    buttons: defaultTemplate?.buttons || [],
    variables: {
      "1": "John",
      "2": "Campaign Manager",
    },
  });
  
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [activeMediaTab, setActiveMediaTab] = useState<string>("image");

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

  // Handle file uploads for different media types
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, mediaType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size - WhatsApp limits (approximate)
    const isOversize = (
      (mediaType === 'image' && file.size > 5 * 1024 * 1024) || // 5MB for images
      (mediaType === 'video' && file.size > 16 * 1024 * 1024) || // 16MB for videos
      (mediaType === 'document' && file.size > 100 * 1024 * 1024) // 100MB for documents
    );

    if (isOversize) {
      alert(`File too large. WhatsApp ${mediaType} size limits: Images: 5MB, Videos: 16MB, Documents: 100MB`);
      return;
    }

    // Set file name for display
    if (mediaType === 'image') {
      setTemplate(prev => ({ ...prev, headerImageFilename: file.name }));
    } else if (mediaType === 'video') {
      setTemplate(prev => ({ ...prev, headerVideoFilename: file.name }));
    } else if (mediaType === 'document') {
      setTemplate(prev => ({ 
        ...prev, 
        headerDocumentFilename: file.name,
        headerDocument: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      }));
    }

    // For images and videos, create previews
    if (mediaType === 'image' || mediaType === 'video') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (mediaType === 'image') {
          setTemplate(prev => ({ ...prev, headerImage: result }));
        } else if (mediaType === 'video') {
          setTemplate(prev => ({ ...prev, headerVideo: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing a media file
  const handleRemoveFile = (mediaType: string) => {
    if (mediaType === 'image') {
      setTemplate(prev => ({ ...prev, headerImage: null, headerImageFilename: '' }));
    } else if (mediaType === 'video') {
      setTemplate(prev => ({ ...prev, headerVideo: null, headerVideoFilename: '' }));
    } else if (mediaType === 'document') {
      setTemplate(prev => ({ 
        ...prev, 
        headerDocument: null, 
        headerDocumentFilename: '' 
      }));
    }
  };

  // Add a new button to the template
  const addButton = (type: 'url' | 'phone' | 'quick_reply') => {
    setTemplate(prev => {
      const newButton = {
        type,
        text: type === 'url' ? 'Visit Website' : 
              type === 'phone' ? 'Call Us' : 'Yes, proceed',
        value: type === 'url' ? 'https://example.com' : 
               type === 'phone' ? '+1234567890' : ''
      };
      
      return {
        ...prev,
        buttons: [...prev.buttons, newButton]
      };
    });
  };

  // Remove a button from the template
  const removeButton = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  // Update button properties
  const updateButton = (index: number, field: string, value: string) => {
    setTemplate(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) => {
        if (i === index) {
          return { ...button, [field]: value };
        }
        return button;
      })
    }));
  };

  // Handle including buttons in the template
  const handleToggleButtons = (includeButtons: boolean) => {
    setTemplate(prev => ({
      ...prev,
      includeButtons,
      buttons: includeButtons ? prev.buttons.length ? prev.buttons : [{ type: 'quick_reply', text: 'Yes, proceed', value: '' }] : []
    }));
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

              {/* Conditional header content based on type */}
              {template.headerType === 'text' && (
                <div className="mt-3">
                  <Label htmlFor="header-text">Header Text</Label>
                  <Input
                    id="header-text"
                    value={template.headerContent}
                    onChange={(e) => handleChange("headerContent", e.target.value)}
                    placeholder="Enter header text (max 60 characters)"
                    className="mt-1"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Characters: {template.headerContent.length}/60
                  </p>
                </div>
              )}

              {template.headerType === 'image' && (
                <div className="mt-3 space-y-3">
                  <Label>Header Image</Label>
                  <div className="border rounded-md p-4 bg-gray-50">
                    {template.headerImage ? (
                      <div className="space-y-3">
                        <AspectRatio ratio={16/9} className="bg-muted overflow-hidden rounded-md">
                          <img 
                            src={template.headerImage} 
                            alt="Preview" 
                            className="object-cover w-full h-full"
                          />
                        </AspectRatio>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 truncate max-w-[200px]">
                            {template.headerImageFilename}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRemoveFile('image')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileImage className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">Upload an image for your header</p>
                        <Label 
                          htmlFor="header-image-upload" 
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Label>
                        <input
                          id="header-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'image')}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Recommended: JPG or PNG, max 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {template.headerType === 'video' && (
                <div className="mt-3 space-y-3">
                  <Label>Header Video</Label>
                  <div className="border rounded-md p-4 bg-gray-50">
                    {template.headerVideo ? (
                      <div className="space-y-3">
                        <AspectRatio ratio={16/9} className="bg-muted overflow-hidden rounded-md">
                          <video 
                            src={template.headerVideo} 
                            controls
                            className="object-cover w-full h-full"
                          />
                        </AspectRatio>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 truncate max-w-[200px]">
                            {template.headerVideoFilename}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRemoveFile('video')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileVideo className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">Upload a video for your header</p>
                        <Label 
                          htmlFor="header-video-upload" 
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Video
                        </Label>
                        <input
                          id="header-video-upload"
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, 'video')}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Recommended: MP4, max 16MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {template.headerType === 'document' && (
                <div className="mt-3 space-y-3">
                  <Label>Header Document</Label>
                  <div className="border rounded-md p-4 bg-gray-50">
                    {template.headerDocument ? (
                      <div className="space-y-3">
                        <div className="bg-white border rounded-md p-3 flex items-center gap-3">
                          <div className="bg-gray-100 rounded-md p-2">
                            <File className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{template.headerDocument.name}</p>
                            <p className="text-xs text-gray-500">
                              {template.headerDocument.type.split('/')[1] || 'file'} · {(template.headerDocument.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRemoveFile('document')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FilePlus className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">Upload a document for your header</p>
                        <Label 
                          htmlFor="header-document-upload" 
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Label>
                        <input
                          id="header-document-upload"
                          type="file"
                          accept=".pdf,.docx,.xlsx,.pptx"
                          onChange={(e) => handleFileUpload(e, 'document')}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Supported: PDF, DOCX, XLSX, PPTX, max 100MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

            {/* Interactive Buttons Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="include-buttons" className="text-base font-medium">
                  Interactive Buttons
                </Label>
                <Switch
                  id="include-buttons"
                  checked={template.includeButtons}
                  onCheckedChange={handleToggleButtons}
                />
              </div>

              {template.includeButtons && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Add up to 3 interactive buttons to your template. WhatsApp supports call-to-action, quick reply, and URL buttons.
                  </p>

                  {/* Button List */}
                  <ScrollArea className="h-[240px] rounded-md border p-4">
                    {template.buttons.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No buttons added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {template.buttons.map((button, index) => (
                          <div key={index} className="border rounded-md p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {button.type === 'url' && <Link className="h-4 w-4 text-blue-500" />}
                                {button.type === 'phone' && <Phone className="h-4 w-4 text-green-500" />}
                                {button.type === 'quick_reply' && <MessageSquare className="h-4 w-4 text-purple-500" />}
                                <h4 className="text-sm font-medium">
                                  {button.type === 'url' ? 'URL Button' : 
                                   button.type === 'phone' ? 'Call Button' : 
                                   'Quick Reply Button'}
                                </h4>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeButton(index)}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <Label htmlFor={`button-text-${index}`} className="text-xs">
                                  Button Text
                                </Label>
                                <Input
                                  id={`button-text-${index}`}
                                  value={button.text}
                                  onChange={(e) => updateButton(index, 'text', e.target.value)}
                                  placeholder="Enter button text"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {button.type !== 'quick_reply' && (
                                <div>
                                  <Label htmlFor={`button-value-${index}`} className="text-xs">
                                    {button.type === 'url' ? 'URL' : 'Phone Number'}
                                  </Label>
                                  <Input
                                    id={`button-value-${index}`}
                                    value={button.value}
                                    onChange={(e) => updateButton(index, 'value', e.target.value)}
                                    placeholder={button.type === 'url' ? 'https://example.com' : '+1234567890'}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Add Button Controls */}
                  {template.buttons.length < 3 && (
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addButton('quick_reply')}
                        className="bg-purple-50"
                      >
                        <MessageSquare className="h-4 w-4 mr-2 text-purple-500" />
                        Add Quick Reply
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addButton('url')}
                        className="bg-blue-50"
                      >
                        <Link className="h-4 w-4 mr-2 text-blue-500" />
                        Add URL Button
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addButton('phone')}
                        className="bg-green-50"
                      >
                        <Phone className="h-4 w-4 mr-2 text-green-500" />
                        Add Call Button
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Note: WhatsApp has a limit of 3 buttons per template and 25 characters per button text.
                  </p>
                </div>
              )}
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
                {/* Header Section */}
                {template.headerType !== "none" && (
                  <div className="rounded-md overflow-hidden border border-gray-200">
                    {template.headerType === "text" && (
                      <div className="bg-gray-100 p-3 text-center">
                        <p className="font-medium">{template.headerContent || "Text Header"}</p>
                      </div>
                    )}
                    
                    {template.headerType === "image" && (
                      <div className="bg-gray-100">
                        {template.headerImage ? (
                          <AspectRatio ratio={16/9}>
                            <img 
                              src={template.headerImage}
                              alt="Header Image" 
                              className="object-cover w-full h-full"
                            />
                          </AspectRatio>
                        ) : (
                          <div className="bg-gray-200 h-32 flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}

                    {template.headerType === "video" && (
                      <div className="bg-gray-100">
                        {template.headerVideo ? (
                          <AspectRatio ratio={16/9}>
                            <video 
                              src={template.headerVideo}
                              controls
                              className="object-cover w-full h-full"
                            />
                          </AspectRatio>
                        ) : (
                          <div className="bg-gray-200 h-32 flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}

                    {template.headerType === "document" && (
                      <div className="bg-white p-3">
                        {template.headerDocument ? (
                          <div className="bg-white flex items-center gap-3">
                            <div className="bg-gray-100 rounded-md p-2">
                              <File className="h-6 w-6 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {template.headerDocument.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {template.headerDocument.type.split('/')[1] || 'file'} · {(template.headerDocument.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 rounded-md p-2">
                              <FileText className="h-6 w-6 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Document</p>
                              <p className="text-xs text-gray-500">PDF · Sample Document</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Message Body */}
                <div className="bg-gray-100 rounded-lg p-3 relative ml-2">
                  <div className="absolute top-3 left-0 w-0 h-0 transform -translate-x-full 
                    border-t-8 border-r-8 border-b-8 
                    border-transparent border-r-gray-100 border-b-transparent">
                  </div>
                  <p className="whitespace-pre-wrap">{replaceVariablesInText(template.body)}</p>
                </div>
                
                {/* Footer */}
                {template.footer && (
                  <div className="text-gray-500 text-xs px-3">
                    {template.footer}
                  </div>
                )}

                {/* Interactive Buttons */}
                {template.includeButtons && template.buttons.length > 0 && (
                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <div className="grid grid-cols-1 gap-2">
                      {template.buttons.map((button, index) => (
                        <button 
                          key={index}
                          className={cn(
                            "w-full py-2 px-3 rounded-md text-center text-sm font-medium transition-colors",
                            button.type === 'url' ? "bg-blue-50 text-blue-600 hover:bg-blue-100" :
                            button.type === 'phone' ? "bg-green-50 text-green-600 hover:bg-green-100" :
                            "bg-purple-50 text-purple-600 hover:bg-purple-100"
                          )}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {button.type === 'url' && <Link className="h-3.5 w-3.5" />}
                            {button.type === 'phone' && <Phone className="h-3.5 w-3.5" />}
                            {button.text || (
                              button.type === 'url' ? 'Visit Website' : 
                              button.type === 'phone' ? 'Call Us' : 'Reply'
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
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