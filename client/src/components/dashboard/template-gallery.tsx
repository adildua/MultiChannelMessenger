import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { Link } from "wouter";

interface TemplateGalleryProps {
  onNewTemplate: () => void;
}

export function TemplateGallery({ onNewTemplate }: TemplateGalleryProps) {
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  // Mock templates for initial UI
  const mockTemplates = [
    {
      id: 1,
      name: "Welcome Message",
      type: "SMS, WhatsApp",
    },
    {
      id: 2,
      name: "Product Announcement",
      type: "RCS, WhatsApp",
    },
    {
      id: 3,
      name: "Feedback Request",
      type: "SMS, VOIP",
    },
    {
      id: 4,
      name: "Appointment Reminder",
      type: "WhatsApp, SMS",
    }
  ];

  const templatesToDisplay = templates || mockTemplates;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Template Gallery</CardTitle>
        <Button onClick={onNewTemplate}>
          New Template
        </Button>
      </CardHeader>
      <CardContent className="border-t border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-4">
          {templatesToDisplay.map(template => (
            <div key={template.id} className="border border-gray-200 rounded-md overflow-hidden hover:shadow-md cursor-pointer">
              <div className="h-32 bg-gray-100 flex items-center justify-center p-4 overflow-hidden">
                {template.name === "Welcome Message" && (
                  <div className="p-2 w-full h-full bg-white rounded border border-gray-200 flex flex-col">
                    <div className="h-4 w-3/4 mb-2 bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/2 mb-1 bg-gray-200 rounded"></div>
                    <div className="h-3 w-full mb-1 bg-gray-200 rounded"></div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
                  </div>
                )}
                
                {template.name === "Product Announcement" && (
                  <div className="p-2 w-full h-full bg-white rounded border border-gray-200 flex flex-col">
                    <div className="flex mb-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200 mr-2"></div>
                      <div className="flex-1">
                        <div className="h-4 w-3/4 mb-1 bg-gray-200 rounded"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-12 w-full bg-gray-200 rounded"></div>
                  </div>
                )}
                
                {template.name === "Feedback Request" && (
                  <div className="p-2 w-full h-full bg-white rounded border border-gray-200 flex flex-col">
                    <div className="h-4 w-1/2 mb-2 bg-gray-200 rounded"></div>
                    <div className="h-8 w-full mb-2 bg-gray-200 rounded"></div>
                    <div className="flex justify-between">
                      <div className="h-6 w-5/12 bg-gray-200 rounded"></div>
                      <div className="h-6 w-5/12 bg-blue-200 rounded"></div>
                    </div>
                  </div>
                )}
                
                {template.name === "Appointment Reminder" && (
                  <div className="p-2 w-full h-full bg-white rounded border border-gray-200 flex flex-col">
                    <div className="h-4 w-3/4 mb-2 bg-gray-200 rounded"></div>
                    <div className="h-3 w-full mb-1 bg-gray-200 rounded"></div>
                    <div className="h-3 w-full mb-1 bg-gray-200 rounded"></div>
                    <div className="flex justify-between mt-2">
                      <div className="h-5 w-1/4 bg-green-200 rounded"></div>
                      <div className="h-5 w-1/4 bg-red-200 rounded"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-3 py-2">
                <h4 className="text-sm font-medium text-gray-900 truncate">{template.name}</h4>
                <p className="text-xs text-gray-500">{template.type}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
        <Link href="/templates" className="text-sm font-medium text-primary hover:text-primary/80">
          Browse all templates
        </Link>
      </CardFooter>
    </Card>
  );
}

export default TemplateGallery;
