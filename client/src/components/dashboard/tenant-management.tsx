import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Tenant } from "@shared/schema";
import { Link } from "wouter";

interface TenantManagementProps {
  onAddTenant: () => void;
}

export function TenantManagement({ onAddTenant }: TenantManagementProps) {
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['/api/tenants'],
  });

  // Function to get tenant level class
  const getLevelClass = (level: any) => {
    const levelId = typeof level === 'object' && level !== null ? level.id : level;
    
    switch (levelId) {
      case 1:
        return 'bg-blue-100 text-blue-800';
      case 2:
        return 'bg-purple-100 text-purple-800';
      case 3:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get status badge class
  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  // Mock tenants for initial UI
  const mockTenants = [
    {
      id: 1,
      name: "Acme Corporation",
      email: "acme@example.com",
      level: 1,
      contacts: 4238,
      balance: 3500,
      currency: "USD",
      isActive: true
    },
    {
      id: 2,
      name: "TechSolutions Inc.",
      email: "tech@example.com",
      level: 2,
      contacts: 2156,
      balance: 1890,
      currency: "USD",
      isActive: true
    },
    {
      id: 3,
      name: "Global Services LLC",
      email: "global@example.com",
      level: 3,
      contacts: 982,
      balance: 750,
      currency: "USD",
      isActive: false
    }
  ];

  const tenantsToDisplay = tenants || mockTenants;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Tenant Management</CardTitle>
        <Button onClick={onAddTenant}>
          Add Tenant
        </Button>
      </CardHeader>
      <CardContent className="border-t border-gray-200 p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacts</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenantsToDisplay.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getLevelClass(tenant.level)}`}>
                      {typeof tenant.level === 'object' && tenant.level !== null 
                        ? tenant.level.name 
                        : `Level ${tenant.level || 'N/A'}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.contacts ? tenant.contacts.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tenant.balance 
                      ? new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: tenant.currencyCode || tenant.currency || 'USD' 
                        }).format(Number(tenant.balance))
                      : 'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tenant.isActive)}`}>
                      {tenant.isActive ? 'Active' : 'Trial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-primary hover:text-primary/80">Manage</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
        <Link href="/tenant-management" className="text-sm font-medium text-primary hover:text-primary/80">
          View all tenants
        </Link>
      </CardFooter>
    </Card>
  );
}

export default TenantManagement;
