import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiIntegration, Channel } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema depends on the channel type
const baseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  channelId: z.coerce.number().min(1, "Channel type is required"),
  baseUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Additional fields based on channel type
const smsFormSchema = baseFormSchema.extend({
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});

const voipFormSchema = baseFormSchema.extend({
  accountSid: z.string().min(1, "Account SID is required"),
  authToken: z.string().min(1, "Auth token is required"),
});

const whatsappFormSchema = baseFormSchema.extend({
  apiKey: z.string().min(1, "API key is required"),
  accountSid: z.string().optional(),
});

const rcsFormSchema = baseFormSchema.extend({
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().optional(),
});

interface ApiIntegrationFormProps {
  integration?: ApiIntegration;
  onSuccess?: () => void;
}

export function ApiIntegrationForm({ integration, onSuccess }: ApiIntegrationFormProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<number>(integration?.channelId || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
  });

  // Get dynamic form schema based on selected channel
  const getFormSchema = (channelId: number) => {
    if (!channels) return baseFormSchema;
    
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return baseFormSchema;
    
    switch (channel.code.toLowerCase()) {
      case 'sms':
        return smsFormSchema;
      case 'voip':
        return voipFormSchema;
      case 'whatsapp':
        return whatsappFormSchema;
      case 'rcs':
        return rcsFormSchema;
      default:
        return baseFormSchema;
    }
  };

  // Create form with schema based on selected channel or existing integration
  const form = useForm<any>({
    resolver: zodResolver(getFormSchema(selectedChannelId)),
    defaultValues: {
      name: integration?.name || "",
      channelId: integration?.channelId || "",
      baseUrl: integration?.baseUrl || "",
      apiKey: integration?.apiKey || "",
      apiSecret: integration?.apiSecret || "",
      accountSid: integration?.accountSid || "",
      authToken: integration?.authToken || "",
      isActive: integration?.isActive !== undefined ? integration.isActive : true,
    },
  });

  // Update form schema when channel changes
  const handleChannelChange = (value: string) => {
    const channelId = parseInt(value);
    setSelectedChannelId(channelId);
    form.clearErrors();
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (integration?.id) {
        // Update existing integration
        await apiRequest('PUT', `/api/api-integrations/${integration.id}`, data);
        toast({
          title: "Integration updated",
          description: "API integration has been updated successfully.",
        });
      } else {
        // Create new integration
        await apiRequest('POST', '/api/api-integrations', data);
        toast({
          title: "Integration created",
          description: "New API integration has been created successfully.",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/api-integrations'] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get channel name by id
  const getChannelName = (channelId: number) => {
    if (!channels) return "";
    const channel = channels.find(c => c.id === channelId);
    return channel ? channel.code.toLowerCase() : "";
  };

  // Current channel type
  const currentChannelType = getChannelName(selectedChannelId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Integration Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Twilio SMS" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="channelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Channel Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleChannelChange(value);
                  }} 
                  defaultValue={field.value.toString()}
                  disabled={!!integration} // Disable changing channel for existing integrations
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {channels?.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id.toString()}>
                        {channel.name}
                      </SelectItem>
                    )) || (
                      <>
                        <SelectItem value="1">SMS</SelectItem>
                        <SelectItem value="2">VOIP</SelectItem>
                        <SelectItem value="3">WhatsApp</SelectItem>
                        <SelectItem value="4">RCS</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://api.example.com" {...field} />
              </FormControl>
              <FormDescription>
                The base URL for this API integration. Leave empty to use default provider URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Dynamic fields based on selected channel */}
        
        {/* SMS & Whatsapp & RCS API Key */}
        {(currentChannelType === 'sms' || currentChannelType === 'whatsapp' || currentChannelType === 'rcs') && (
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input placeholder="Enter API key" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* SMS & RCS API Secret */}
        {(currentChannelType === 'sms' || currentChannelType === 'rcs') && (
          <FormField
            control={form.control}
            name="apiSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Secret</FormLabel>
                <FormControl>
                  <Input placeholder="Enter API secret" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* VOIP & Whatsapp Account SID */}
        {(currentChannelType === 'voip' || currentChannelType === 'whatsapp') && (
          <FormField
            control={form.control}
            name="accountSid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account SID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter account SID" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* VOIP Auth Token */}
        {currentChannelType === 'voip' && (
          <FormField
            control={form.control}
            name="authToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auth Token</FormLabel>
                <FormControl>
                  <Input placeholder="Enter auth token" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Additional settings - could be expanded in a real app */}
        <FormField
          control={form.control}
          name="settings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Settings (Optional - JSON)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='{
  "webhook_url": "https://your-webhook.example.com",
  "timeout_seconds": 30
}'
                  className="font-mono text-xs"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Additional JSON configuration for this integration.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Enable or disable this integration
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => onSuccess?.()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : integration?.id ? 'Update Integration' : 'Create Integration'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
