import { apiRequest } from "./queryClient";

// API client for campaigns
export const campaignsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/campaigns", undefined);
    return res.json();
  },
  
  getById: async (id: number) => {
    const res = await apiRequest("GET", `/api/campaigns/${id}`, undefined);
    return res.json();
  },
  
  create: async (campaignData: any) => {
    const res = await apiRequest("POST", "/api/campaigns", campaignData);
    return res.json();
  },
  
  update: async (id: number, campaignData: any) => {
    const res = await apiRequest("PUT", `/api/campaigns/${id}`, campaignData);
    return res.json();
  },
  
  delete: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/campaigns/${id}`, undefined);
    return res.json();
  }
};

// API client for contacts
export const contactsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/contacts", undefined);
    return res.json();
  },
  
  getById: async (id: number) => {
    const res = await apiRequest("GET", `/api/contacts/${id}`, undefined);
    return res.json();
  },
  
  create: async (contactData: any) => {
    const res = await apiRequest("POST", "/api/contacts", contactData);
    return res.json();
  },
  
  update: async (id: number, contactData: any) => {
    const res = await apiRequest("PUT", `/api/contacts/${id}`, contactData);
    return res.json();
  },
  
  delete: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/contacts/${id}`, undefined);
    return res.json();
  },
  
  importContacts: async (fileData: FormData) => {
    const res = await fetch("/api/contacts/import", {
      method: "POST",
      body: fileData,
      credentials: "include"
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
    
    return res.json();
  },
  
  exportContacts: async () => {
    window.location.href = "/api/contacts/export";
    return true;
  }
};

// API client for templates
export const templatesApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/templates", undefined);
    return res.json();
  },
  
  getById: async (id: number) => {
    const res = await apiRequest("GET", `/api/templates/${id}`, undefined);
    return res.json();
  },
  
  create: async (templateData: any) => {
    const res = await apiRequest("POST", "/api/templates", templateData);
    return res.json();
  },
  
  update: async (id: number, templateData: any) => {
    const res = await apiRequest("PUT", `/api/templates/${id}`, templateData);
    return res.json();
  },
  
  delete: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/templates/${id}`, undefined);
    return res.json();
  }
};

// API client for flows
export const flowsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/flows", undefined);
    return res.json();
  },
  
  getActive: async () => {
    const res = await apiRequest("GET", "/api/flows/active", undefined);
    return res.json();
  },
  
  getById: async (id: number) => {
    const res = await apiRequest("GET", `/api/flows/${id}`, undefined);
    return res.json();
  },
  
  create: async (flowData: any) => {
    const res = await apiRequest("POST", "/api/flows", flowData);
    return res.json();
  },
  
  update: async (id: number, flowData: any) => {
    const res = await apiRequest("PUT", `/api/flows/${id}`, flowData);
    return res.json();
  },
  
  delete: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/flows/${id}`, undefined);
    return res.json();
  }
};

// API client for conversations
export const conversationsApi = {
  getAll: async (status?: string) => {
    const url = status 
      ? `/api/conversations?status=${status}` 
      : "/api/conversations";
    
    const res = await apiRequest("GET", url, undefined);
    return res.json();
  },
  
  getById: async (id: number) => {
    const res = await apiRequest("GET", `/api/conversations/${id}`, undefined);
    return res.json();
  },
  
  getMessages: async (conversationId: number) => {
    const res = await apiRequest("GET", `/api/conversations/${conversationId}/messages`, undefined);
    return res.json();
  },
  
  sendMessage: async (conversationId: number, message: string) => {
    const res = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, { content: message });
    return res.json();
  },
  
  assignConversation: async (conversationId: number, userId: number) => {
    const res = await apiRequest("PUT", `/api/conversations/${conversationId}/assign`, { userId });
    return res.json();
  },
  
  closeConversation: async (conversationId: number) => {
    const res = await apiRequest("PUT", `/api/conversations/${conversationId}/close`, undefined);
    return res.json();
  }
};

// API client for tenants
export const tenantsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/tenants", undefined);
    return res.json();
  },
  
  getById: async (id: number) => {
    const res = await apiRequest("GET", `/api/tenants/${id}`, undefined);
    return res.json();
  },
  
  create: async (tenantData: any) => {
    const res = await apiRequest("POST", "/api/tenants", tenantData);
    return res.json();
  },
  
  update: async (id: number, tenantData: any) => {
    const res = await apiRequest("PUT", `/api/tenants/${id}`, tenantData);
    return res.json();
  },
  
  delete: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/tenants/${id}`, undefined);
    return res.json();
  },
  
  getTenantLevels: async () => {
    const res = await apiRequest("GET", "/api/tenant-levels", undefined);
    return res.json();
  }
};

// API client for billing
export const billingApi = {
  getTransactions: async () => {
    const res = await apiRequest("GET", "/api/transactions", undefined);
    return res.json();
  },
  
  getBalance: async () => {
    const res = await apiRequest("GET", "/api/user/balance", undefined);
    return res.json();
  },
  
  topUp: async (amount: number, currency: string, paymentMethodId: string) => {
    const res = await apiRequest("POST", "/api/transactions/topup", {
      amount,
      currency,
      paymentMethodId
    });
    return res.json();
  },
  
  getChannelRates: async () => {
    const res = await apiRequest("GET", "/api/channel-rates", undefined);
    return res.json();
  }
};

// API client for API integrations
export const apiIntegrationsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/api-integrations", undefined);
    return res.json();
  },
  
  getById: async (id: number) => {
    const res = await apiRequest("GET", `/api/api-integrations/${id}`, undefined);
    return res.json();
  },
  
  create: async (integrationData: any) => {
    const res = await apiRequest("POST", "/api/api-integrations", integrationData);
    return res.json();
  },
  
  update: async (id: number, integrationData: any) => {
    const res = await apiRequest("PUT", `/api/api-integrations/${id}`, integrationData);
    return res.json();
  },
  
  delete: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/api-integrations/${id}`, undefined);
    return res.json();
  },
  
  toggleStatus: async (id: number, isActive: boolean) => {
    const res = await apiRequest("PUT", `/api/api-integrations/${id}/toggle`, { isActive });
    return res.json();
  }
};

// API client for AI message optimization
export const aiApi = {
  optimizeMessage: async (data: {
    message: string; 
    channel: string; 
    audience?: string;
    tone?: string;
    goal?: string;
  }) => {
    const res = await apiRequest("POST", "/api/optimize-message", data);
    return res.json();
  }
};

// API client for user
export const userApi = {
  getCurrentUser: async () => {
    const res = await apiRequest("GET", "/api/auth/me", undefined);
    return res.json();
  },
  
  updateProfile: async (profileData: any) => {
    const res = await apiRequest("PUT", "/api/user/profile", profileData);
    return res.json();
  },
  
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiRequest("PUT", "/api/user/password", {
      currentPassword,
      newPassword
    });
    return res.json();
  },
  
  updateNotifications: async (notificationSettings: any) => {
    const res = await apiRequest("PUT", "/api/user/notifications", notificationSettings);
    return res.json();
  }
};
