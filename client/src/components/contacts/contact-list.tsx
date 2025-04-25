import { useState, useRef, ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Pencil, Trash2, MoreHorizontal, FileDown, FileUp, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { ContactForm } from "./contact-form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ContactList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importResults, setImportResults] = useState<{imported: number, errors: string[] | null}>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { data: contacts, isLoading, isError } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredContacts = contacts?.filter(contact => {
    const searchRegex = new RegExp(searchTerm, 'i');
    return (
      searchRegex.test(contact.firstName) ||
      searchRegex.test(contact.lastName || '') ||
      searchRegex.test(contact.email || '') ||
      searchRegex.test(contact.phone || '')
    );
  });

  const handleAddContact = () => {
    setSelectedContact(undefined);
    setShowAddEditDialog(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowAddEditDialog(true);
  };

  const handleDeleteContact = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/contacts/${id}`, undefined);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact deleted",
        description: "Contact has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    // Reset import state
    setImportFile(null);
    setImportProgress(0);
    setImportStatus('idle');
    setImportResults(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowImportDialog(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const processImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setImportStatus('loading');
    setImportProgress(10);

    try {
      // Create FormData with the file
      const formData = new FormData();
      formData.append('file', importFile);
      setImportProgress(30);

      // Send to API using the correct endpoint
      // We need to use fetch directly instead of apiRequest because we're sending FormData
      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      });
      setImportProgress(90);
      
      const result = await response.json();
      setImportProgress(100);
      
      if (result.success) {
        setImportStatus('success');
        setImportResults({
          imported: result.imported,
          errors: result.errors
        });
        
        // Refresh contacts list
        queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
        
        if (!result.errors) {
          toast({
            title: "Import successful",
            description: `${result.imported} contacts were imported successfully.`,
          });
        }
      } else {
        setImportStatus('error');
        toast({
          title: "Import failed",
          description: result.message || "Failed to import contacts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setImportStatus('error');
      toast({
        title: "Import error",
        description: "An error occurred while importing contacts.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    toast({
      title: "Export started",
      description: "Your contacts are being exported. Download will start shortly.",
    });
    
    try {
      // Use fetch directly since we need the raw response
      const response = await fetch('/api/contacts/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get the content
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'contacts.csv';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export complete",
        description: "Your contacts have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting contacts.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading contacts...</div>;
  }

  if (isError) {
    return <div className="text-center text-red-500 p-8">Error loading contacts</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Input
            type="search"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleImport} className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddContact} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts && filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="font-medium">{`${contact.firstName} ${contact.lastName || ''}`}</div>
                  </TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{contact.whatsapp || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${contact.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Add/Edit Contact Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          </DialogHeader>
          <ContactForm 
            contact={selectedContact} 
            onSuccess={() => setShowAddEditDialog(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importStatus === 'idle' && (
              <>
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <FileUp className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    {importFile ? importFile.name : "Drag and drop a CSV file, or click to browse"}
                  </p>
                  <div className="mt-4">
                    <Input 
                      type="file" 
                      className="hidden" 
                      id="file-upload" 
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button asChild>
                      <label htmlFor="file-upload">Choose File</label>
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Your CSV file should include these headers:
                  </p>
                  <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                    First Name,Last Name,Email,Phone,WhatsApp,Status
                  </div>
                </div>
              </>
            )}

            {importStatus === 'loading' && (
              <div className="space-y-4 py-6">
                <p className="text-center font-medium">Importing contacts...</p>
                <Progress value={importProgress} className="w-full" />
                <p className="text-center text-sm text-gray-500">
                  {importProgress < 30 && "Preparing file..."}
                  {importProgress >= 30 && importProgress < 90 && "Processing contacts..."}
                  {importProgress >= 90 && "Finalizing import..."}
                </p>
              </div>
            )}

            {importStatus === 'success' && importResults && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    Successfully imported {importResults.imported} contacts.
                  </AlertDescription>
                </Alert>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-amber-600">
                      The following issues were encountered:
                    </p>
                    <div className="max-h-[200px] overflow-y-auto border rounded p-2 bg-gray-50">
                      <ul className="list-disc list-inside space-y-1">
                        {importResults.errors.map((error, index) => (
                          <li key={index} className="text-sm text-gray-700">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {importStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Failed</AlertTitle>
                <AlertDescription>
                  An error occurred while importing contacts. Please check your file format and try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              {importStatus === 'idle' && (
                <>
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={processImport} disabled={!importFile}>
                    Import
                  </Button>
                </>
              )}
              
              {(importStatus === 'success' || importStatus === 'error') && (
                <Button onClick={() => setShowImportDialog(false)}>
                  Close
                </Button>
              )}
              
              {importStatus === 'loading' && (
                <Button disabled>
                  Importing...
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContactList;
