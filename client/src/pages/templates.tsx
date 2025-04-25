import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { TemplateEditor } from "@/components/templates/template-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Phone,
  MessageCircle,
  MessageSquareDashed,
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await apiRequest('DELETE', `/api/templates/${id}`, undefined);
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
        toast({
          title: "Template deleted",
          description: "Template has been deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { id, createdAt, updatedAt, ...templateData } = template;
      const newTemplate = {
        ...templateData,
        name: `Copy of ${template.name}`,
      };
      
      await apiRequest('POST', '/api/templates', newTemplate);
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template duplicated",
        description: "Template has been duplicated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  // Get the appropriate icon for the template type
  const getTemplateIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sms':
        return <MessageSquare className="h-10 w-10 text-blue-500" />;
      case 'voip':
        return <Phone className="h-10 w-10 text-green-500" />;
      case 'whatsapp':
        return <MessageCircle className="h-10 w-10 text-indigo-500" />;
      case 'rcs':
        return <MessageSquareDashed className="h-10 w-10 text-purple-500" />;
      default:
        return <MessageSquare className="h-10 w-10 text-gray-400" />;
    }
  };

  // Filter templates based on search and type filter
  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = searchTerm === "" || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "" || template.type.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
          <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>
                Create and manage templates for different communication channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:w-2/3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="voip">VOIP</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="rcs">RCS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Templates Grid */}
              {isLoading ? (
                <div className="text-center py-10">Loading templates...</div>
              ) : filteredTemplates && filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow border border-gray-200">
                      <div className="p-4 flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getTemplateIcon(template.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{template.name}</h3>
                          <p className="text-sm text-gray-500 uppercase">{template.type}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 h-24 overflow-hidden">
                        <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-3 bg-white flex justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicateTemplate(template)}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Duplicate</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-4">
                    {searchTerm || typeFilter ? 
                      "No templates match your search criteria" : 
                      "No templates found. Create your first template."}
                  </p>
                  {!(searchTerm || typeFilter) && (
                    <Button onClick={handleCreateTemplate}>
                      Create New Template
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          </DialogHeader>
          <TemplateEditor
            template={selectedTemplate || undefined}
            onSuccess={() => setShowEditor(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
