import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "@db";
import { users, tenants, tenantLevels, contacts, contactLists, channels, templates, flows, campaigns, conversations, transactions, messages, apiIntegrations, channelRates } from "@shared/schema";
import { eq, and, gte, desc, asc, isNull } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import Stripe from "stripe";

// Helper function to safely get the user ID from the session or use a default
// This is only for development until proper authentication is implemented
const DEFAULT_USER_ID = 1;
function getUserId(req: Request): number {
  return (req as any).session?.userId || DEFAULT_USER_ID;
}

// Create a prefix for all API routes
const apiPrefix = "/api";

// Set up Stripe with dummy key for now
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil'
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post(`${apiPrefix}/auth/login`, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      return res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Error during login" });
    }
  });

  app.post(`${apiPrefix}/auth/logout`, (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });

  app.get(`${apiPrefix}/auth/me`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Error fetching user data" });
    }
  });

  // User routes
  app.get(`${apiPrefix}/user/balance`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      return res.json({ 
        balance: userTenant.balance,
        currency: userTenant.currencyCode
      });
    } catch (error) {
      console.error("Get user balance error:", error);
      return res.status(500).json({ message: "Error fetching user balance" });
    }
  });

  // Channel routes
  app.get(`${apiPrefix}/channels`, async (req, res) => {
    try {
      const channelsList = await db.query.channels.findMany();
      return res.json(channelsList);
    } catch (error) {
      console.error("Get channels error:", error);
      return res.status(500).json({ message: "Error fetching channels" });
    }
  });

  // Contact routes
  app.get(`${apiPrefix}/contacts`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const contactsList = await db.query.contacts.findMany({
        where: eq(contacts.tenantId, userTenant.id),
        orderBy: [desc(contacts.createdAt)]
      });
      
      return res.json(contactsList);
    } catch (error) {
      console.error("Get contacts error:", error);
      return res.status(500).json({ message: "Error fetching contacts" });
    }
  });

  app.post(`${apiPrefix}/contacts`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Validate the request data
      const contactData = await storage.validateContactData(req.body);
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to contact data
      const contactWithTenant = {
        ...contactData,
        tenantId: userTenant.id
      };
      
      // Insert the contact
      const newContact = await storage.insertContact(contactWithTenant);
      
      return res.status(201).json(newContact);
    } catch (error) {
      console.error("Create contact error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating contact" });
    }
  });

  app.get(`${apiPrefix}/contacts/:id`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const contact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.id, contactId),
          eq(contacts.tenantId, userTenant.id)
        )
      });
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      return res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);
      return res.status(500).json({ message: "Error fetching contact" });
    }
  });

  app.put(`${apiPrefix}/contacts/:id`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Validate the request data
      const contactData = await storage.validateContactData(req.body);
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the contact exists and belongs to the user's tenant
      const existingContact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.id, contactId),
          eq(contacts.tenantId, userTenant.id)
        )
      });
      
      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Update the contact
      const updatedContact = await storage.updateContact(contactId, contactData);
      
      return res.json(updatedContact);
    } catch (error) {
      console.error("Update contact error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating contact" });
    }
  });

  app.delete(`${apiPrefix}/contacts/:id`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the contact exists and belongs to the user's tenant
      const existingContact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.id, contactId),
          eq(contacts.tenantId, userTenant.id)
        )
      });
      
      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Delete the contact
      await storage.deleteContact(contactId);
      
      return res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Delete contact error:", error);
      return res.status(500).json({ message: "Error deleting contact" });
    }
  });
  
  app.get(`${apiPrefix}/contacts/stats`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const stats = await storage.getContactStats(userTenant.id);
      
      return res.json(stats);
    } catch (error) {
      console.error("Get contact stats error:", error);
      return res.status(500).json({ message: "Error fetching contact stats" });
    }
  });

  // Contact List routes
  app.get(`${apiPrefix}/contact-lists`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const lists = await db.query.contactLists.findMany({
        where: eq(contactLists.tenantId, userTenant.id),
        orderBy: [desc(contactLists.createdAt)]
      });
      
      return res.json(lists);
    } catch (error) {
      console.error("Get contact lists error:", error);
      return res.status(500).json({ message: "Error fetching contact lists" });
    }
  });

  // Template routes
  app.get(`${apiPrefix}/templates`, async (req, res) => {
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const templatesList = await db.query.templates.findMany({
        where: eq(templates.tenantId, userTenant.id),
        orderBy: [desc(templates.createdAt)]
      });
      
      return res.json(templatesList);
    } catch (error) {
      console.error("Get templates error:", error);
      return res.status(500).json({ message: "Error fetching templates" });
    }
  });

  app.post(`${apiPrefix}/templates`, async (req, res) => {
    try {
      // Validate the request data
      const templateData = await storage.validateTemplateData(req.body);
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to template data
      const templateWithTenant = {
        ...templateData,
        tenantId: userTenant.id
      };
      
      // Insert the template
      const newTemplate = await storage.insertTemplate(templateWithTenant);
      
      return res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Create template error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating template" });
    }
  });

  app.get(`${apiPrefix}/templates/:id`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const template = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, templateId),
          eq(templates.tenantId, userTenant.id)
        )
      });
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      return res.json(template);
    } catch (error) {
      console.error("Get template error:", error);
      return res.status(500).json({ message: "Error fetching template" });
    }
  });

  app.put(`${apiPrefix}/templates/:id`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Validate the request data
      const templateData = await storage.validateTemplateData(req.body);
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the template exists and belongs to the user's tenant
      const existingTemplate = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, templateId),
          eq(templates.tenantId, userTenant.id)
        )
      });
      
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Update the template
      const updatedTemplate = await storage.updateTemplate(templateId, templateData);
      
      return res.json(updatedTemplate);
    } catch (error) {
      console.error("Update template error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating template" });
    }
  });

  app.delete(`${apiPrefix}/templates/:id`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the template exists and belongs to the user's tenant
      const existingTemplate = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, templateId),
          eq(templates.tenantId, userTenant.id)
        )
      });
      
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Delete the template
      await storage.deleteTemplate(templateId);
      
      return res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      return res.status(500).json({ message: "Error deleting template" });
    }
  });

  // Flow routes
  app.get(`${apiPrefix}/flows`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const flowsList = await db.query.flows.findMany({
        where: eq(flows.tenantId, userTenant.id),
        orderBy: [desc(flows.createdAt)]
      });
      
      return res.json(flowsList);
    } catch (error) {
      console.error("Get flows error:", error);
      return res.status(500).json({ message: "Error fetching flows" });
    }
  });

  app.get(`${apiPrefix}/flows/active`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const activeFlows = await db.query.flows.findMany({
        where: and(
          eq(flows.tenantId, userTenant.id),
          eq(flows.isActive, true)
        ),
        orderBy: [desc(flows.createdAt)]
      });
      
      return res.json(activeFlows);
    } catch (error) {
      console.error("Get active flows error:", error);
      return res.status(500).json({ message: "Error fetching active flows" });
    }
  });

  app.post(`${apiPrefix}/flows`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Validate the request data
      const flowData = await storage.validateFlowData(req.body);
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to flow data
      const flowWithTenant = {
        ...flowData,
        tenantId: userTenant.id
      };
      
      // Insert the flow
      const newFlow = await storage.insertFlow(flowWithTenant);
      
      return res.status(201).json(newFlow);
    } catch (error) {
      console.error("Create flow error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flow data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating flow" });
    }
  });

  app.put(`${apiPrefix}/flows/:id`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const flowId = parseInt(req.params.id);
      if (isNaN(flowId)) {
        return res.status(400).json({ message: "Invalid flow ID" });
      }
      
      // Validate the request data
      const flowData = await storage.validateFlowData(req.body);
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the flow exists and belongs to the user's tenant
      const existingFlow = await db.query.flows.findFirst({
        where: and(
          eq(flows.id, flowId),
          eq(flows.tenantId, userTenant.id)
        )
      });
      
      if (!existingFlow) {
        return res.status(404).json({ message: "Flow not found" });
      }
      
      // Update the flow
      const updatedFlow = await storage.updateFlow(flowId, flowData);
      
      return res.json(updatedFlow);
    } catch (error) {
      console.error("Update flow error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flow data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating flow" });
    }
  });

  // Campaign routes
  app.get(`${apiPrefix}/campaigns`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const campaignsList = await db.query.campaigns.findMany({
        where: eq(campaigns.tenantId, userTenant.id),
        orderBy: [desc(campaigns.createdAt)],
        with: {
          channel: true
        }
      });
      
      return res.json(campaignsList);
    } catch (error) {
      console.error("Get campaigns error:", error);
      return res.status(500).json({ message: "Error fetching campaigns" });
    }
  });

  app.get(`${apiPrefix}/campaigns/recent`, async (req, res) => {
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const recentCampaigns = await db.query.campaigns.findMany({
        where: eq(campaigns.tenantId, userTenant.id),
        orderBy: [desc(campaigns.createdAt)],
        limit: 4,
        with: {
          channel: true
        }
      });
      
      return res.json(recentCampaigns);
    } catch (error) {
      console.error("Get recent campaigns error:", error);
      return res.status(500).json({ message: "Error fetching recent campaigns" });
    }
  });

  app.post(`${apiPrefix}/campaigns`, async (req, res) => {
    try {
      // Validate the request data
      const campaignData = await storage.validateCampaignData(req.body);
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to campaign data
      const campaignWithTenant = {
        ...campaignData,
        tenantId: userTenant.id
      };
      
      // Insert the campaign
      const newCampaign = await storage.insertCampaign(campaignWithTenant);
      
      return res.status(201).json(newCampaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating campaign" });
    }
  });

  // Conversation routes
  app.get(`${apiPrefix}/conversations/queue`, async (req, res) => {
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const queuedConversations = await db.query.conversations.findMany({
        where: and(
          eq(conversations.tenantId, userTenant.id),
          eq(conversations.status, 'open'),
          isNull(conversations.assignedTo)
        ),
        orderBy: [desc(conversations.lastMessageAt)],
        limit: 10,
        with: {
          contact: true,
          channel: true,
          messages: {
            limit: 1,
            orderBy: [desc(messages.createdAt)]
          }
        }
      });
      
      // Format the conversations for the frontend
      const formattedConversations = queuedConversations.map(convo => ({
        id: convo.id,
        contactName: `${convo.contact.firstName} ${convo.contact.lastName || ''}`.trim(),
        channelType: convo.channel.code.toLowerCase(),
        message: convo.messages.length > 0 ? convo.messages[0].content : '',
        timestamp: convo.lastMessageAt
      }));
      
      return res.json(formattedConversations);
    } catch (error) {
      console.error("Get queued conversations error:", error);
      return res.status(500).json({ message: "Error fetching queued conversations" });
    }
  });

  // Tenant routes
  app.get(`${apiPrefix}/tenants`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the user is authorized to view other tenants (admin or higher role)
      const userRole = await storage.getUserRoleInTenant(req.session.userId, userTenant.id);
      if (userRole !== 'admin' && userRole !== 'owner') {
        return res.status(403).json({ message: "Not authorized to view tenants" });
      }
      
      let tenantsList;
      
      // If the user is admin of a parent tenant, show all child tenants
      if (userTenant.parentId === null) {
        tenantsList = await db.query.tenants.findMany({
          where: eq(tenants.parentId, userTenant.id),
          with: {
            level: true
          },
          orderBy: [asc(tenants.name)]
        });
        
        // Include the parent tenant itself
        const parentTenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, userTenant.id),
          with: {
            level: true
          }
        });
        
        if (parentTenant) {
          tenantsList = [parentTenant, ...tenantsList];
        }
      } else {
        // If the user is not an admin of a parent tenant, only show their own tenant
        tenantsList = await db.query.tenants.findMany({
          where: eq(tenants.id, userTenant.id),
          with: {
            level: true
          }
        });
      }
      
      return res.json(tenantsList);
    } catch (error) {
      console.error("Get tenants error:", error);
      return res.status(500).json({ message: "Error fetching tenants" });
    }
  });

  app.post(`${apiPrefix}/tenants`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Validate the request data
      const tenantData = await storage.validateTenantData(req.body);
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the user is authorized to create tenants (admin or higher role)
      const userRole = await storage.getUserRoleInTenant(req.session.userId, userTenant.id);
      if (userRole !== 'admin' && userRole !== 'owner') {
        return res.status(403).json({ message: "Not authorized to create tenants" });
      }
      
      // Set the parent ID to the user's tenant
      const tenantWithParent = {
        ...tenantData,
        parentId: userTenant.id
      };
      
      // Insert the tenant
      const newTenant = await storage.insertTenant(tenantWithParent);
      
      return res.status(201).json(newTenant);
    } catch (error) {
      console.error("Create tenant error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tenant data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating tenant" });
    }
  });

  // API Integration routes
  app.get(`${apiPrefix}/api-integrations`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const integrationsList = await db.query.apiIntegrations.findMany({
        where: eq(apiIntegrations.tenantId, userTenant.id),
        with: {
          channel: true
        },
        orderBy: [asc(apiIntegrations.name)]
      });
      
      // Remove sensitive information
      const safeIntegrations = integrationsList.map(integration => ({
        ...integration,
        apiKey: integration.apiKey ? '********' : null,
        apiSecret: integration.apiSecret ? '********' : null,
        accountSid: integration.accountSid ? '********' : null,
        authToken: integration.authToken ? '********' : null
      }));
      
      return res.json(safeIntegrations);
    } catch (error) {
      console.error("Get API integrations error:", error);
      return res.status(500).json({ message: "Error fetching API integrations" });
    }
  });

  app.post(`${apiPrefix}/api-integrations`, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Validate the request data
      const integrationData = await storage.validateApiIntegrationData(req.body);
      
      // Get the tenant ID for the current user
      const userTenant = await storage.getUserPrimaryTenant(req.session.userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to integration data
      const integrationWithTenant = {
        ...integrationData,
        tenantId: userTenant.id
      };
      
      // Insert the API integration
      const newIntegration = await storage.insertApiIntegration(integrationWithTenant);
      
      // Remove sensitive information for response
      const safeIntegration = {
        ...newIntegration,
        apiKey: newIntegration.apiKey ? '********' : null,
        apiSecret: newIntegration.apiSecret ? '********' : null,
        accountSid: newIntegration.accountSid ? '********' : null,
        authToken: newIntegration.authToken ? '********' : null
      };
      
      return res.status(201).json(safeIntegration);
    } catch (error) {
      console.error("Create API integration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid API integration data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating API integration" });
    }
  });

  // Transaction routes
  app.get(`${apiPrefix}/transactions`, async (req, res) => {
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const transactionsList = await db.query.transactions.findMany({
        where: eq(transactions.tenantId, userTenant.id),
        orderBy: [desc(transactions.createdAt)]
      });
      
      return res.json(transactionsList);
    } catch (error) {
      console.error("Get transactions error:", error);
      return res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Analytics endpoints will be added later

  // Stripe payment routes
  app.post(`${apiPrefix}/create-payment-intent`, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: userTenant.currencyCode?.toLowerCase() || "usd",
        metadata: {
          userId: userId,
          tenantId: userTenant.id
        }
      });
      
      // Return the client secret to the client
      return res.json({ 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error) {
      console.error("Create payment intent error:", error);
      return res.status(500).json({ message: "Error creating payment" });
    }
  });
  
  app.post(`${apiPrefix}/record-payment`, async (req, res) => {
    try {
      const { paymentIntentId, amount } = req.body;
      
      if (!paymentIntentId || !amount) {
        return res.status(400).json({ message: "Payment intent ID and amount are required" });
      }
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Retrieve payment intent from Stripe to verify it succeeded
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment has not succeeded" });
      }
      
      // Record the payment in our database
      const transaction = await db.insert(transactions).values({
        tenantId: userTenant.id,
        amount: parseFloat(amount),
        type: "payment",
        status: "completed",
        currency: userTenant.currencyCode || "USD",
        metadata: {
          stripePaymentIntentId: paymentIntentId
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Update the tenant's balance
      // TODO: Implement balance update logic
      
      return res.status(201).json(transaction[0]);
    } catch (error) {
      console.error("Record payment error:", error);
      return res.status(500).json({ message: "Error recording payment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
