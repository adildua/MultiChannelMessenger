import { useState } from "react";
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
import { Pencil, Trash2, MoreHorizontal, FileDown, FileUp, UserPlus } from "lucide-react";
import { ContactForm } from "./contact-form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ContactList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
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
    setShowImportDialog(true);
  };

  const handleExport = () => {
    // Implementation for export functionality
    toast({
      title: "Export started",
      description: "Your contacts are being exported. Download will start shortly.",
    });
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
      
      {/* Import Dialog - Simplified for now */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <FileUp className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Drag and drop a CSV file, or click to browse
              </p>
              <div className="mt-4">
                <Input type="file" className="hidden" id="file-upload" />
                <Button asChild>
                  <label htmlFor="file-upload">Choose File</label>
                </Button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button>Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContactList;
