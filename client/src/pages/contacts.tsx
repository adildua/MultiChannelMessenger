import { useState, useRef } from "react";
import { ContactList } from "@/components/contacts/contact-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload, Download, AlertCircle, CheckCircle, FileType, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function Contacts() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    imported?: number;
    total?: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const handleAddContact = () => {
    setShowAddDialog(true);
  };
  
  const handleImportDialog = () => {
    // Reset import state
    setImportStatus('idle');
    setUploadProgress(0);
    setImportResult(null);
    setShowImportDialog(true);
  };
  
  const handleExportContacts = async () => {
    try {
      // Create a link to download the CSV file
      const link = document.createElement('a');
      link.href = '/api/contacts/export';
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export started",
        description: "Your contacts are being exported to CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your contacts",
        variant: "destructive",
      });
    }
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Verify file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'xlsx' && extension !== 'xls') {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }
    
    // Set initial upload state
    setImportStatus('uploading');
    setUploadProgress(10);
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      
      // Upload file
      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import contacts');
      }
      
      const result = await response.json();
      
      // Update status based on result
      if (result.success) {
        setImportStatus('success');
        setImportResult({
          imported: result.imported,
          total: result.total,
          errors: result.errors || [],
        });
        
        // Refresh contact list
        queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
        
        if (!result.errors || result.errors.length === 0) {
          setTimeout(() => {
            setShowImportDialog(false);
          }, 2000);
        }
      } else {
        setImportStatus('error');
        setImportResult({
          errors: [result.message || 'Unknown error occurred'],
        });
      }
    } catch (error) {
      setUploadProgress(100);
      setImportStatus('error');
      setImportResult({
        errors: [error instanceof Error ? error.message : 'An unknown error occurred'],
      });
      console.error("Import error:", error);
    }
  };
  
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    setTimeout(() => {
      setImportStatus('idle');
      setUploadProgress(0);
      setImportResult(null);
    }, 300);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleImportDialog}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportContacts}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleAddContact} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Contact Management</CardTitle>
                  <CardDescription>
                    Manage your contacts and contact lists
                  </CardDescription>
                </div>
                <Tabs
                  defaultValue="contacts"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-[400px]"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="lists">Lists</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} className="hidden">
                <TabsContent value="contacts" className="mt-0">
                  <ContactList />
                </TabsContent>
                <TabsContent value="lists" className="mt-0">
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <h3 className="text-lg font-medium mb-2">Contact Lists Coming Soon</h3>
                    <p className="text-gray-500 mb-4">
                      This feature is currently under development. You will soon be able to
                      create and manage contact lists for your campaigns.
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("contacts")}>
                      Go back to Contacts
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <ContactForm onSuccess={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Import Contacts Dialog */}
      <Dialog open={showImportDialog} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
          </DialogHeader>
          
          {importStatus === 'idle' && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-500">
                Upload a CSV or Excel file with your contacts. The file should have the following columns:
              </p>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <p className="font-medium">Required columns:</p>
                <p>First Name</p>
                <p className="mt-2 font-medium">Optional columns:</p>
                <p>Last Name, Email, Phone, WhatsApp, Status</p>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-center">
                  <label 
                    htmlFor="file-upload" 
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none"
                  >
                    <span className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg p-10">
                      <FileType className="w-8 h-8 text-gray-400" />
                      <span className="text-center">
                        <span className="block text-sm font-medium text-gray-900">
                          Click to select a file
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          or drag and drop
                        </span>
                        <span className="block text-xs text-gray-500 mt-2">
                          CSV, Excel (.xlsx, .xls)
                        </span>
                      </span>
                    </span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file"
                      className="sr-only"
                      accept=".csv,.xlsx,.xls"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>
              
              <div className="mt-2">
                <a 
                  href="/api/contacts/export" 
                  download="contacts_template.csv"
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Download a sample template
                </a>
              </div>
            </div>
          )}
          
          {importStatus === 'uploading' && (
            <div className="space-y-4 py-6">
              <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p className="text-center font-medium">Uploading and processing your contacts...</p>
              <Progress value={uploadProgress} className="w-full h-2" />
              <p className="text-center text-sm text-gray-500">
                This may take a moment depending on the file size.
              </p>
            </div>
          )}
          
          {importStatus === 'success' && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-center font-medium">
                Successfully imported {importResult?.imported} of {importResult?.total} contacts
              </p>
              
              {importResult?.errors && importResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-amber-600">Warnings ({importResult.errors.length}):</p>
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    <ul className="list-disc pl-5 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="text-sm text-gray-600">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {importStatus === 'error' && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-center font-medium">Failed to import contacts</p>
              
              {importResult?.errors && importResult.errors.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {importResult.errors[0]}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImportStatus('idle');
                    resetFileInput();
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseImportDialog}
              className="mt-2"
            >
              {importStatus === 'success' ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
