import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchIcon, Plus, Smartphone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WhatsAppTemplateSimulator from "@/components/templates/whatsapp-template-simulator";

export default function WhatsAppTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  // Get all WhatsApp templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['/api/templates'],
  });
  
  // Process templates data from API response
  const templates = (() => {
    if (!templatesData) return [];
    
    // Extract templates array based on response format
    let templatesList: any[] = [];
    
    if (Array.isArray(templatesData)) {
      templatesList = templatesData;
    } else if (templatesData.rows && Array.isArray(templatesData.rows)) {
      templatesList = templatesData.rows;
    }
    
    // Filter for WhatsApp templates only
    return templatesList.filter(t => t.type?.toLowerCase() === 'whatsapp');
  })();

  // Mutation for creating a template
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest('POST', '/api/templates', {
        ...templateData,
        type: 'whatsapp',
        isActive: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template created",
        description: "WhatsApp template has been created successfully.",
      });
      setShowSimulator(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating a template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, templateData }: { id: number; templateData: any }) => {
      return apiRequest('PUT', `/api/templates/${id}`, {
        ...templateData,
        type: 'whatsapp'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template updated",
        description: "WhatsApp template has been updated successfully.",
      });
      setShowSimulator(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowSimulator(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowSimulator(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await apiRequest('DELETE', `/api/templates/${id}`, undefined);
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
        toast({
          title: "Template deleted",
          description: "WhatsApp template has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete template. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveTemplate = (templateData: any) => {
    // Format template data for API
    const formattedData = {
      name: templateData.name,
      type: 'whatsapp',
      content: templateData.body,
      metadata: {
        category: templateData.category,
        language: templateData.language,
        headerType: templateData.headerType,
        footer: templateData.footer,
        variables: templateData.variables
      },
      isActive: true
    };

    if (selectedTemplate?.id) {
      updateTemplateMutation.mutate({ 
        id: selectedTemplate.id, 
        templateData: formattedData 
      });
    } else {
      createTemplateMutation.mutate(formattedData);
    }
  };

  // Filter templates based on search
  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">WhatsApp Templates</h1>
          <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New WhatsApp Template
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>WhatsApp Message Templates</CardTitle>
              <CardDescription>
                Create and manage templates for WhatsApp Business messaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search WhatsApp templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Templates Grid */}
              {isLoading ? (
                <div className="text-center py-10">Loading templates...</div>
              ) : filteredTemplates && filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white pb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-green-100">
                          WhatsApp Template
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="h-24 overflow-hidden mb-4">
                          <p className="text-sm text-gray-600 line-clamp-4">{template.content}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {template.metadata?.category && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {template.metadata.category}
                            </span>
                          )}
                          {template.metadata?.language && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {template.metadata.language}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Smartphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 
                      "No templates match your search criteria" : 
                      "No WhatsApp templates found. Create your first template."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleCreateTemplate}>
                      Create New WhatsApp Template
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* WhatsApp Template Simulator Dialog */}
      <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
        <DialogContent className="sm:max-w-[90vw] max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}</DialogTitle>
          </DialogHeader>
          <WhatsAppTemplateSimulator
            defaultTemplate={selectedTemplate ? {
              name: selectedTemplate.name,
              category: selectedTemplate.metadata?.category || "marketing",
              language: selectedTemplate.metadata?.language || "english",
              headerType: selectedTemplate.metadata?.headerType || "none",
              body: selectedTemplate.content,
              footer: selectedTemplate.metadata?.footer || ""
            } : undefined}
            onSave={handleSaveTemplate}
            onClose={() => setShowSimulator(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}