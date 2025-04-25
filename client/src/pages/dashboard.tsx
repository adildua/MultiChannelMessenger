import { useState } from "react";
import { useLocation } from "wouter";
import {
  MessageSquare,
  Phone,
  MessageCircle,
  MessageSquareDashed,
} from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import CampaignTable from "@/components/dashboard/campaign-table";
import ContactStats from "@/components/dashboard/contact-stats";
import ConversationQueue from "@/components/dashboard/conversation-queue";
import FlowBuilderPreview from "@/components/dashboard/flow-builder-preview";
import TemplateGallery from "@/components/dashboard/template-gallery";
import TenantManagement from "@/components/dashboard/tenant-management";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CampaignForm from "@/components/campaigns/campaign-form";
import TemplateEditor from "@/components/templates/template-editor";
import TenantForm from "@/components/tenants/tenant-form";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showTenantDialog, setShowTenantDialog] = useState(false);

  const handleNewCampaign = () => {
    setShowCampaignDialog(true);
  };

  const handleCreateFlow = () => {
    navigate("/flow-builder");
  };

  const handleNewTemplate = () => {
    setShowTemplateDialog(true);
  };

  const handleAddTenant = () => {
    setShowTenantDialog(true);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Dashboard Content */}
        <div className="py-4">
          {/* Channel Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={MessageSquare}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              title="SMS Campaigns"
              value="24"
              href="/campaigns?type=sms"
            />
            
            <StatCard
              icon={Phone}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              title="VOIP Campaigns"
              value="12"
              href="/campaigns?type=voip"
            />
            
            <StatCard
              icon={MessageCircle}
              iconColor="text-indigo-600"
              iconBgColor="bg-indigo-100"
              title="WhatsApp Campaigns"
              value="18"
              href="/campaigns?type=whatsapp"
            />
            
            <StatCard
              icon={MessageSquareDashed}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              title="RCS Campaigns"
              value="7"
              href="/campaigns?type=rcs"
            />
          </div>
          
          {/* Main Sections */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Campaigns */}
            <div className="lg:col-span-2">
              <CampaignTable onNewCampaign={handleNewCampaign} />
            </div>
            
            {/* Contact Stats and Conversation Queue */}
            <div className="space-y-6">
              <ContactStats />
              <ConversationQueue />
            </div>
          </div>
          
          {/* Additional Dashboard Sections */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FlowBuilderPreview onCreateFlow={handleCreateFlow} />
            <TemplateGallery onNewTemplate={handleNewTemplate} />
          </div>
          
          {/* Multi-Tenant Management */}
          <div className="mt-8">
            <TenantManagement onAddTenant={handleAddTenant} />
          </div>
        </div>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <CampaignForm onSuccess={() => setShowCampaignDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          <TemplateEditor onSuccess={() => setShowTemplateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Tenant Dialog */}
      <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
          </DialogHeader>
          <TenantForm onSuccess={() => setShowTenantDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
