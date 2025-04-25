import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tenant, TenantLevel } from "@shared/schema";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Users,
  Building,
  Building2,
  Store,
  PieChart,
  Pencil,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TenantForm } from "@/components/tenants/tenant-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TenantManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const { data: tenants, isLoading: isLoadingTenants } = useQuery<Tenant[]>({
    queryKey: ['/api/tenants'],
  });

  const { data: tenantLevels } = useQuery<TenantLevel[]>({
    queryKey: ['/api/tenant-levels'],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddTenant = () => {
    setSelectedTenant(null);
    setShowTenantDialog(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowTenantDialog(true);
  };

  const handleManageTenant = (tenant: Tenant) => {
    // For now, just edit the tenant - in a more complex app, this could navigate to a tenant dashboard
    handleEditTenant(tenant);
  };

  const handleAddUsers = (tenantId: number) => {
    toast({
      title: "Feature in development",
      description: "The ability to add users to tenants is coming soon.",
    });
  };

  const handleManageBalance = (tenantId: number) => {
    // This would navigate to the tenant-specific billing page
    toast({
      title: "Navigating to billing",
      description: "This would navigate to tenant-specific billing in a full implementation.",
    });
  };

  // Get tenant level name
  const getTenantLevelName = (levelId: number) => {
    if (!tenantLevels) return "Unknown";
    const level = tenantLevels.find(l => l.id === levelId);
    return level ? level.name : "Unknown";
  };

  // Get tenant level icon
  const getTenantLevelIcon = (level: string | number) => {
    const levelName = typeof level === 'number' ? getTenantLevelName(level) : level;
    
    switch (levelName.toLowerCase()) {
      case 'enterprise':
        return <Building className="text-primary" />;
      case 'business':
        return <Building2 className="text-secondary" />;
      case 'starter':
        return <Store className="text-accent" />;
      default:
        return <Building className="text-gray-500" />;
    }
  };

  // Get tenant level class
  const getTenantLevelClass = (level: string | number) => {
    const levelName = typeof level === 'number' ? getTenantLevelName(level) : level;
    
    switch (levelName.toLowerCase()) {
      case 'enterprise':
        return 'tenant-level-1';
      case 'business':
        return 'tenant-level-2';
      case 'starter':
        return 'tenant-level-3';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter tenants based on search
  const filteredTenants = tenants?.filter(tenant => {
    return searchTerm === "" || 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Tenant Management</h1>
          <Button onClick={handleAddTenant} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Tenants</CardTitle>
              <CardDescription>
                Manage your multi-tenant hierarchy and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative w-full md:w-1/3 mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>

              {/* Tenants Table */}
              {isLoadingTenants ? (
                <div className="text-center py-10">Loading tenants...</div>
              ) : filteredTenants && filteredTenants.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map(tenant => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.email}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getTenantLevelClass(tenant.levelId)}`}>
                            {getTenantLevelIcon(tenant.levelId)}
                            <span>{getTenantLevelName(tenant.levelId)}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          {tenant.contacts?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: tenant.currencyCode || 'USD' 
                          }).format(tenant.balance)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {tenant.isActive ? 'Active' : 'Trial'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleAddUsers(tenant.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">Users</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleManageBalance(tenant.id)}
                            >
                              <Wallet className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">Balance</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleEditTenant(tenant)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManageTenant(tenant)}
                            >
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {searchTerm ? 
                      "No tenants match your search criteria." : 
                      "You haven't created any tenants yet. Add your first tenant to get started."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleAddTenant}>
                      Add First Tenant
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Tenant Dialog */}
      <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}
            </DialogTitle>
          </DialogHeader>
          <TenantForm
            tenant={selectedTenant || undefined}
            onSuccess={() => setShowTenantDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
