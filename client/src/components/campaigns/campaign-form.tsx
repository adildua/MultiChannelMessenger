import { useState, useEffect } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Campaign, Channel, ContactList, Template, Flow } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageOptimizer } from "@/components/message-optimizer";

const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  channelId: z.coerce.number().min(1, "Channel is required"),
  flowId: z.coerce.number().optional(),
  templateId: z.coerce.number().optional(),
  listId: z.coerce.number().min(1, "Contact list is required"),
  status: z.string().min(1, "Status is required"),
  scheduledAt: z.date().optional(),
});

interface CampaignFormProps {
  campaign?: Campaign;
  onSuccess?: () => void;
}

export function CampaignForm({ campaign, onSuccess }: CampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { data: channels } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
  });
  
  const { data: contactLists } = useQuery<ContactList[]>({
    queryKey: ['/api/contact-lists'],
  });
  
  const { data: templates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });
  
  const { data: flows } = useQuery<Flow[]>({
    queryKey: ['/api/flows'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: campaign?.name || "",
      description: campaign?.description || "",
      channelId: campaign?.channelId || 0,
      flowId: campaign?.flowId || 0,
      templateId: campaign?.templateId || 0,
      listId: campaign?.listId || 0,
      status: campaign?.status || "draft",
      scheduledAt: campaign?.scheduledAt ? new Date(campaign.scheduledAt) : undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (campaign?.id) {
        // Update existing campaign
        await apiRequest('PUT', `/api/campaigns/${campaign.id}`, values);
        toast({
          title: "Campaign updated",
          description: "Campaign has been updated successfully.",
        });
      } else {
        // Create new campaign
        await apiRequest('POST', '/api/campaigns', values);
        toast({
          title: "Campaign created",
          description: "New campaign has been created successfully.",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Name</FormLabel>
                <FormControl>
                  <Input placeholder="Summer Sale Promotion" {...field} />
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
                <FormLabel>Channel</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a channel" />
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
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <div className="flex justify-between items-center">
                  <FormLabel>Description</FormLabel>
                  <MessageOptimizer 
                    initialMessage={field.value || ''} 
                    onOptimized={(optimizedText) => field.onChange(optimizedText)}
                  />
                </div>
                <FormControl>
                  <Textarea 
                    placeholder="Campaign description..." 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="listId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact List</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact list" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contactLists?.map((list) => (
                      <SelectItem key={list.id} value={list.id.toString()}>
                        {list.name}
                      </SelectItem>
                    )) || (
                      <>
                        <SelectItem value="1">All Customers</SelectItem>
                        <SelectItem value="2">New Subscribers</SelectItem>
                        <SelectItem value="3">VIP Customers</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    )) || (
                      <>
                        <SelectItem value="1">Welcome Message</SelectItem>
                        <SelectItem value="2">Promotional Offer</SelectItem>
                        <SelectItem value="3">Feedback Request</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="flowId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flow</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a flow" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {flows?.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id.toString()}>
                        {flow.name}
                      </SelectItem>
                    )) || (
                      <>
                        <SelectItem value="1">Welcome Sequence</SelectItem>
                        <SelectItem value="2">Product Launch</SelectItem>
                        <SelectItem value="3">Follow-up Sequence</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Schedule Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : campaign?.id ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default CampaignForm;
