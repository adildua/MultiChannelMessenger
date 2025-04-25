import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Template } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  content: z.string().min(1, "Content is required"),
  variables: z.array(z.string()).optional().default([]),
  previewData: z.record(z.string()).optional().default({}),
  isActive: z.boolean().default(true),
});

interface TemplateEditorProps {
  template?: Template;
  onSuccess?: () => void;
}

export function TemplateEditor({ template, onSuccess }: TemplateEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [variablesInput, setVariablesInput] = useState("");
  const [previewDataInput, setPreviewDataInput] = useState("");
  const { toast } = useToast();

  // Parse variables and previewData if they exist
  useEffect(() => {
    if (template) {
      try {
        const parsedVariables = template.variables ? JSON.parse(template.variables.toString()) : [];
        setVariablesInput(parsedVariables.join(", "));
      } catch (e) {
        setVariablesInput("");
      }

      try {
        const parsedPreviewData = template.previewData ? JSON.parse(template.previewData.toString()) : {};
        setPreviewDataInput(JSON.stringify(parsedPreviewData, null, 2));
      } catch (e) {
        setPreviewDataInput("{}");
      }
    }
  }, [template]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      type: template?.type || "sms",
      content: template?.content || "",
      variables: template?.variables ? JSON.parse(template.variables.toString()) : [],
      previewData: template?.previewData ? JSON.parse(template.previewData.toString()) : {},
      isActive: template?.isActive !== undefined ? template.isActive : true,
    },
  });

  // Process variables from comma-separated string to array
  const processVariables = (input: string): string[] => {
    return input
      .split(",")
      .map(v => v.trim())
      .filter(v => v !== "");
  };

  // Process preview data from JSON string to object
  const processPreviewData = (input: string): Record<string, string> => {
    try {
      return JSON.parse(input);
    } catch (e) {
      return {};
    }
  };

  // Replace variables in content with preview data
  const previewContent = (content: string, data: Record<string, string>): string => {
    let result = content;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value);
    });
    return result;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Process variables and preview data
      const processedValues = {
        ...values,
        variables: JSON.stringify(values.variables),
        previewData: JSON.stringify(values.previewData),
      };
      
      if (template?.id) {
        // Update existing template
        await apiRequest('PUT', `/api/templates/${template.id}`, processedValues);
        toast({
          title: "Template updated",
          description: "Template has been updated successfully.",
        });
      } else {
        // Create new template
        await apiRequest('POST', '/api/templates', processedValues);
        toast({
          title: "Template created",
          description: "New template has been created successfully.",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form when variables or preview data inputs change
  useEffect(() => {
    form.setValue("variables", processVariables(variablesInput));
  }, [variablesInput, form]);

  useEffect(() => {
    try {
      form.setValue("previewData", processPreviewData(previewDataInput));
    } catch (e) {
      // Invalid JSON, don't update the form
    }
  }, [previewDataInput, form]);

  const content = form.watch("content");
  const previewData = form.watch("previewData");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{template ? `Edit Template: ${template.name}` : "Create New Template"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Welcome Message" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="voip">VOIP</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="rcs">RCS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Template Content</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "Edit Mode" : "Preview Mode"}
                </Button>
              </div>
              
              {previewMode ? (
                <div className="min-h-[200px] border rounded-md p-4 bg-gray-50">
                  <div className="whitespace-pre-wrap">
                    {previewContent(content, previewData)}
                  </div>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Enter template content with {{variables}}"
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <FormLabel>Variables (comma-separated)</FormLabel>
                  <Input
                    placeholder="name, company, date"
                    value={variablesInput}
                    onChange={(e) => setVariablesInput(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use double curly braces in content like: {'{{variable}}'}
                  </p>
                </div>
                
                <div>
                  <FormLabel>Preview Data (JSON)</FormLabel>
                  <Textarea
                    placeholder='{"name": "John", "company": "Acme Inc."}'
                    value={previewDataInput}
                    onChange={(e) => setPreviewDataInput(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-primary rounded"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="m-0">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : template?.id ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default TemplateEditor;
