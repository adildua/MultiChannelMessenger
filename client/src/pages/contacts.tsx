import { useState } from "react";
import { ContactList } from "@/components/contacts/contact-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function Contacts() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");

  const handleAddContact = () => {
    setShowAddDialog(true);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <Button onClick={handleAddContact} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Button>
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
    </div>
  );
}
