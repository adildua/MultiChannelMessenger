import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "@db";
import { users, tenants, tenantLevels, contacts, contactLists, channels, templates, flows, campaigns, conversations, transactions, messages, apiIntegrations, channelRates } from "@shared/schema";
import { eq, and, gte, desc, asc, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import Stripe from "stripe";
import * as crypto from "crypto";
import { aiService } from "./ai-service";
import multer from "multer";
import csv from "csv-parser";
import * as xlsx from "xlsx";
import * as fs from "fs";
import path from "path";
import { createObjectCsvWriter } from "csv-writer";

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
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
  
  // Export contacts as CSV
  app.get(`${apiPrefix}/contacts/export`, async (req, res) => {
    try {
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      const contactsList = await db.query.contacts.findMany({
        where: eq(contacts.tenantId, userTenant.id),
        orderBy: [desc(contacts.createdAt)]
      });
      
      // Create CSV headers
      let csv = "First Name,Last Name,Email,Phone,WhatsApp,Status\n";
      
      // Add each contact as a row
      contactsList.forEach(contact => {
        // Escape any commas in the fields
        const row = [
          contact.firstName.includes(',') ? `"${contact.firstName}"` : contact.firstName,
          contact.lastName ? (contact.lastName.includes(',') ? `"${contact.lastName}"` : contact.lastName) : '',
          contact.email ? (contact.email.includes(',') ? `"${contact.email}"` : contact.email) : '',
          contact.phone ? (contact.phone.includes(',') ? `"${contact.phone}"` : contact.phone) : '',
          contact.whatsapp ? (contact.whatsapp.includes(',') ? `"${contact.whatsapp}"` : contact.whatsapp) : '',
          contact.isActive ? 'Active' : 'Inactive'
        ];
        csv += row.join(',') + '\n';
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
      res.status(200).send(csv);
    } catch (error) {
      console.error("Export contacts error:", error);
      return res.status(500).json({ message: "Error exporting contacts" });
    }
  });
  
  // Import contacts from CSV
  app.post(`${apiPrefix}/contacts/import`, async (req, res) => {
    try {
      const csvData = req.body.data;
      
      if (!csvData) {
        return res.status(400).json({ message: "No CSV data provided" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Parse CSV data (very simple parser)
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      // Check required headers
      const requiredHeaders = ['First Name'];
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.trim().toLowerCase() === header.toLowerCase())
      );
      
      if (missingHeaders.length > 0) {
        return res.status(400).json({ 
          message: `Missing required headers: ${missingHeaders.join(', ')}` 
        });
      }
      
      // Get indexes of each column
      const firstNameIdx = headers.findIndex(h => h.trim().toLowerCase() === 'first name');
      const lastNameIdx = headers.findIndex(h => h.trim().toLowerCase() === 'last name');
      const emailIdx = headers.findIndex(h => h.trim().toLowerCase() === 'email');
      const phoneIdx = headers.findIndex(h => h.trim().toLowerCase() === 'phone');
      const whatsappIdx = headers.findIndex(h => h.trim().toLowerCase() === 'whatsapp');
      const statusIdx = headers.findIndex(h => h.trim().toLowerCase() === 'status');
      
      // Process each line (skip header)
      const contacts = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',');
        
        // Simple validation
        if (!values[firstNameIdx]?.trim()) {
          errors.push(`Line ${i+1}: First Name is required`);
          continue;
        }
        
        const contact = {
          tenantId: userTenant.id,
          firstName: values[firstNameIdx]?.trim() || '',
          lastName: lastNameIdx >= 0 ? values[lastNameIdx]?.trim() || null : null,
          email: emailIdx >= 0 ? values[emailIdx]?.trim() || null : null,
          phone: phoneIdx >= 0 ? values[phoneIdx]?.trim() || null : null,
          whatsapp: whatsappIdx >= 0 ? values[whatsappIdx]?.trim() || null : null,
          isActive: statusIdx >= 0 ? values[statusIdx]?.trim().toLowerCase() === 'active' : true
        };
        
        try {
          // Validate the contact data
          const validContact = await storage.validateContactData(contact);
          contacts.push(validContact);
        } catch (err) {
          errors.push(`Line ${i+1}: ${err.message}`);
        }
      }
      
      // Insert valid contacts
      let inserted = 0;
      for (const contact of contacts) {
        try {
          await storage.insertContact(contact);
          inserted++;
        } catch (err) {
          errors.push(`Error inserting contact ${contact.firstName}: ${err.message}`);
        }
      }
      
      return res.status(200).json({
        success: true,
        imported: inserted,
        errors: errors.length > 0 ? errors : null
      });
    } catch (error) {
      console.error("Import contacts error:", error);
      return res.status(500).json({ message: "Error importing contacts" });
    }
  });
  
  app.get(`${apiPrefix}/contacts/stats`, async (req, res) => {
    try {
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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

  app.post(`${apiPrefix}/contacts`, async (req, res) => {
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to contact data before validation
      const contactDataWithTenant = {
        ...req.body,
        tenantId: userTenant.id
      };
      
      // Validate the request data with tenant ID
      const validatedContactData = await storage.validateContactData(contactDataWithTenant);
      
      // Insert the contact
      const newContact = await storage.insertContact(validatedContactData);
      
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
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
      
      // Add tenant ID to request data before validation
      const contactDataWithTenant = {
        ...req.body,
        tenantId: userTenant.id
      };
      
      // Validate the contact data with tenant ID
      const validatedContactData = await storage.validateContactData(contactDataWithTenant);
      
      // Update the contact
      const updatedContact = await storage.updateContact(contactId, validatedContactData);
      
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
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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

  // Contact List routes
  app.get(`${apiPrefix}/contact-lists`, async (req, res) => {
    try {
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
      
      // Use SQL query to get templates while we're updating schema
      const templatesList = await db.execute(sql`
        SELECT id, tenant_id as "tenantId", name, type, content, 
               variables, preview_data as "previewData", metadata, 
               is_active as "isActive", created_at as "createdAt", 
               updated_at as "updatedAt" 
        FROM templates 
        WHERE tenant_id = ${userTenant.id} 
        ORDER BY created_at DESC
      `);
      
      return res.json(templatesList);
    } catch (error) {
      console.error("Get templates error:", error);
      return res.status(500).json({ message: "Error fetching templates" });
    }
  });

  app.post(`${apiPrefix}/templates`, async (req, res) => {
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to request data before validation
      const templateDataWithTenant = {
        ...req.body,
        tenantId: userTenant.id
      };
      
      // Validate the template data with tenant ID
      const validatedTemplateData = await storage.validateTemplateData(templateDataWithTenant);
      
      // Insert the template
      const newTemplate = await storage.insertTemplate(validatedTemplateData);
      
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
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
      
      // Add tenant ID to request data before validation
      const templateDataWithTenant = {
        ...req.body,
        tenantId: userTenant.id
      };
      
      // Validate the template data with tenant ID
      const validatedTemplateData = await storage.validateTemplateData(templateDataWithTenant);
      
      // Update the template
      const updatedTemplate = await storage.updateTemplate(templateId, validatedTemplateData);
      
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
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
    try {
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to request data before validation
      const flowDataWithTenant = {
        ...req.body,
        tenantId: userTenant.id
      };
      
      // Validate the flow data with tenant ID
      const validatedFlowData = await storage.validateFlowData(flowDataWithTenant);
      
      // Insert the flow
      const newFlow = await storage.insertFlow(validatedFlowData);
      
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
    try {
      const flowId = parseInt(req.params.id);
      if (isNaN(flowId)) {
        return res.status(400).json({ message: "Invalid flow ID" });
      }
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
      
      // Add tenant ID to request data before validation
      const flowDataWithTenant = {
        ...req.body,
        tenantId: userTenant.id
      };
      
      // Validate the flow data with tenant ID
      const validatedFlowData = await storage.validateFlowData(flowDataWithTenant);
      
      // Update the flow
      const updatedFlow = await storage.updateFlow(flowId, validatedFlowData);
      
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
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Add tenant ID to request data before validation
      const campaignDataWithTenant = {
        ...req.body,
        tenantId: userTenant.id
      };
      
      // Validate the campaign data with tenant ID
      const validatedCampaignData = await storage.validateCampaignData(campaignDataWithTenant);
      
      // Insert the campaign
      const newCampaign = await storage.insertCampaign(validatedCampaignData);
      
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
  app.get(`${apiPrefix}/conversations`, async (req, res) => {
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Get filter parameter (default to all)
      const status = req.query.status as string || 'all';
      
      // Build where clause
      let whereClause = and(eq(conversations.tenantId, userTenant.id));
      if (status !== 'all') {
        whereClause = and(whereClause, eq(conversations.status, status));
      }
      
      const allConversations = await db.query.conversations.findMany({
        where: whereClause,
        orderBy: [desc(conversations.lastMessageAt)],
        with: {
          contact: true,
          channel: true,
          messages: {
            limit: 1,
            orderBy: [desc(messages.createdAt)]
          }
        }
      });
      
      // Always return mock data for development purposes
      if (true) {
        // Create mock data with proper shape for UI development
        const mockConversations = [
          {
            id: 1,
            tenantId: userTenant.id,
            contactId: 1,
            channelId: 1,
            status: 'open',
            assignedTo: null,
            lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            contact: {
              id: 1,
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@example.com',
              phone: '+1234567890',
              whatsapp: '+1234567890'
            },
            channel: {
              id: 1,
              code: 'WHATSAPP',
              name: 'WhatsApp',
            },
            lastMessage: {
              content: 'I need help with my order #12345'
            }
          },
          {
            id: 2,
            tenantId: userTenant.id,
            contactId: 2,
            channelId: 2,
            status: 'open',
            assignedTo: null,
            lastMessageAt: new Date(Date.now() - 12 * 60 * 1000),
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            contact: {
              id: 2,
              firstName: 'Sarah',
              lastName: 'Johnson',
              email: 'sarah.j@example.com',
              phone: '+1987654321',
              whatsapp: '+1987654321'
            },
            channel: {
              id: 2,
              code: 'SMS',
              name: 'SMS',
            },
            lastMessage: {
              content: 'When will my package arrive?'
            }
          },
          {
            id: 3,
            tenantId: userTenant.id,
            contactId: 3,
            channelId: 1,
            status: 'assigned',
            assignedTo: 1,
            lastMessageAt: new Date(Date.now() - 35 * 60 * 1000),
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            contact: {
              id: 3,
              firstName: 'Michael',
              lastName: 'Brown',
              email: 'michael.b@example.com',
              phone: '+1122334455',
              whatsapp: '+1122334455'
            },
            channel: {
              id: 4,
              code: 'RCS',
              name: 'RCS',
            },
            lastMessage: {
              content: "I'd like to change my subscription plan."
            }
          },
          {
            id: 4,
            tenantId: userTenant.id,
            contactId: 4,
            channelId: 1,
            status: 'closed',
            assignedTo: 1,
            lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            contact: {
              id: 4,
              firstName: 'Emma',
              lastName: 'Davis',
              email: 'emma.d@example.com',
              phone: '+1555555555',
              whatsapp: '+1555555555'
            },
            channel: {
              id: 3,
              code: 'VOIP',
              name: 'VOIP',
            },
            lastMessage: {
              content: 'Thank you for your help!'
            }
          }
        ];
        
        return res.json(mockConversations);
      }
      
      return res.json(allConversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ message: "Error fetching conversations" });
    }
  });
  
  // Get conversation messages
  app.get(`${apiPrefix}/conversations/:id/messages`, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // This would normally fetch messages from the database
      // For now, return mock data for development
      const mockMessages = [
        {
          id: 1,
          content: "Hello! I need help with my recent order #12345.",
          direction: "inbound",
          sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          content: "Hi there! I'd be happy to help you with your order. Could you please provide more details about the issue you're experiencing?",
          direction: "outbound",
          sentAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
          sender: { name: "Alex Morgan" }
        },
        {
          id: 3,
          content: "I ordered a product last week, but it hasn't arrived yet. The tracking number doesn't show any updates for 3 days.",
          direction: "inbound",
          sentAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
        {
          id: 4,
          content: "I understand your concern. Let me check the status of your order right away. This might take a few minutes.",
          direction: "outbound",
          sentAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
          sender: { name: "Alex Morgan" }
        },
        {
          id: 5,
          content: "Thank you, I'll wait.",
          direction: "inbound",
          sentAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        }
      ];
      
      return res.json(mockMessages);
    } catch (error) {
      console.error("Get conversation messages error:", error);
      return res.status(500).json({ message: "Error fetching conversation messages" });
    }
  });
  
  // Send a message in a conversation
  app.post(`${apiPrefix}/conversations/:id/messages`, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Get the user ID
      const userId = getUserId(req);
      
      console.log(`Received message from user ${userId} for conversation ${conversationId}: ${content}`);
      
      // In a real implementation, we would save the message to the database
      // and potentially send it through the appropriate channel
      
      // Mock response for development
      const newMessage = {
        id: Math.floor(Math.random() * 1000) + 100,
        conversationId,
        content,
        direction: "outbound",
        sentAt: new Date().toISOString(),
        sender: { name: "Support Agent" }
      };
      
      // Add a short delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return res.status(201).json(newMessage);
    } catch (error) {
      console.error("Send message error:", error);
      return res.status(500).json({ message: "Error sending message" });
    }
  });
  
  // Assign a conversation to a user
  app.put(`${apiPrefix}/conversations/:id/assign`, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // In a real implementation, we would update the conversation in the database
      
      return res.status(200).json({ message: "Conversation assigned successfully" });
    } catch (error) {
      console.error("Assign conversation error:", error);
      return res.status(500).json({ message: "Error assigning conversation" });
    }
  });
  
  // Close a conversation
  app.put(`${apiPrefix}/conversations/:id/close`, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // In a real implementation, we would update the conversation in the database
      
      return res.status(200).json({ message: "Conversation closed successfully" });
    } catch (error) {
      console.error("Close conversation error:", error);
      return res.status(500).json({ message: "Error closing conversation" });
    }
  });
  
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
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the user is authorized to view other tenants (admin or higher role)
      const userRole = await storage.getUserRoleInTenant(userId, userTenant.id);
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
    try {
      // Convert balance to string if it's a number
      const requestData = { ...req.body };
      if (typeof requestData.balance === 'number') {
        requestData.balance = requestData.balance.toString();
      }
      
      // Validate the request data
      const tenantData = await storage.validateTenantData(requestData);
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Check if the user is authorized to create tenants (admin or higher role)
      const userRole = await storage.getUserRoleInTenant(userId, userTenant.id);
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
    try {
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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
    try {
      // Validate the request data
      const integrationData = await storage.validateApiIntegrationData(req.body);
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
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

  // Add direct balance endpoint for testing
  app.post(`${apiPrefix}/direct-topup`, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Update the tenant's balance
      const currentBalance = parseFloat(userTenant.balance || "0");
      const topupAmount = parseFloat(amount);
      const updatedBalance = currentBalance + topupAmount;
      
      // Update the tenant record
      await db.update(tenants)
        .set({ 
          balance: updatedBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(tenants.id, userTenant.id));
      
      // Create a transaction record
      const transaction = await db.insert(transactions).values({
        tenantId: userTenant.id,
        amount: amount.toString(),
        type: "topup",
        status: "completed",
        description: "Direct topup",
        currency: userTenant.currencyCode || "USD",
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return res.status(201).json({
        transaction: transaction[0],
        balance: updatedBalance
      });
    } catch (error) {
      console.error("Direct topup error:", error);
      return res.status(500).json({ message: "Error processing topup" });
    }
  });

  // Get user balance endpoint
  app.get(`${apiPrefix}/user/balance`, async (req, res) => {
    try {
      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Extract balance and currency from tenant
      return res.json({
        balance: parseFloat(userTenant.balance || "0"),
        currency: userTenant.currencyCode || "USD"
      });
    } catch (error) {
      console.error("Get user balance error:", error);
      return res.status(500).json({ message: "Error fetching user balance" });
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
        amount: amount.toString(), // Use string for amount to match schema
        type: "topup", // Change from "payment" to "topup" for clarity
        status: "completed",
        currency: userTenant.currencyCode || "USD",
        metadata: {
          stripePaymentIntentId: paymentIntentId
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Update the tenant's balance
      const currentBalance = parseFloat(userTenant.balance || "0");
      const updatedBalance = currentBalance + parseFloat(amount);
      
      // Update the tenant's balance in the database
      await db.update(tenants)
        .set({ 
          balance: updatedBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(tenants.id, userTenant.id));
      
      return res.status(201).json(transaction[0]);
    } catch (error) {
      console.error("Record payment error:", error);
      return res.status(500).json({ message: "Error recording payment" });
    }
  });
  
  // AI Message Optimization API
  app.post(`${apiPrefix}/optimize-message`, async (req, res) => {
    try {
      const { message, channel, audience, tone, goal } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      if (!channel) {
        return res.status(400).json({ message: "Communication channel is required" });
      }
      
      // Get the tenant ID for the current user (or default user for development)
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }
      
      // Call the AI service to optimize the message
      const optimization = await aiService.optimizeMessage(message, {
        channel,
        audience,
        tone,
        goal
      });
      
      return res.json(optimization);
    } catch (error) {
      console.error("Message optimization error:", error);
      return res.status(500).json({ 
        message: "Error optimizing message",
        error: error.message
      });
    }
  });

  // Setup multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // File upload route for contacts
  app.post(`${apiPrefix}/contacts/upload`, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get the tenant ID for the current user
      const userId = getUserId(req);
      const userTenant = await storage.getUserPrimaryTenant(userId);
      if (!userTenant) {
        return res.status(404).json({ message: "No tenant found for user" });
      }

      const fileBuffer = req.file.buffer;
      const filename = req.file.originalname.toLowerCase();
      
      // Process based on file type
      let contacts = [];
      let errors = [];
      
      if (filename.endsWith('.csv')) {
        // Parse CSV
        const rows = [];
        
        // Convert buffer to string and process line by line
        const csvString = fileBuffer.toString('utf8');
        const lines = csvString.split('\n');
        
        if (lines.length < 2) {
          return res.status(400).json({ message: "CSV file is empty or has no data rows" });
        }
        
        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Check for required headers
        const firstNameIdx = headers.findIndex(h => h === 'first name' || h === 'firstname');
        if (firstNameIdx === -1) {
          return res.status(400).json({ message: "CSV must include a 'First Name' column" });
        }
        
        // Map other headers
        const lastNameIdx = headers.findIndex(h => h === 'last name' || h === 'lastname');
        const emailIdx = headers.findIndex(h => h === 'email');
        const phoneIdx = headers.findIndex(h => h === 'phone');
        const whatsappIdx = headers.findIndex(h => h === 'whatsapp');
        const statusIdx = headers.findIndex(h => h === 'status');
        
        // Process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          const values = line.split(',').map(v => v.trim());
          
          if (!values[firstNameIdx]) {
            errors.push(`Line ${i+1}: First Name is required`);
            continue;
          }
          
          try {
            const contact = {
              tenantId: userTenant.id,
              firstName: values[firstNameIdx] || '',
              lastName: lastNameIdx >= 0 ? values[lastNameIdx] || null : null,
              email: emailIdx >= 0 ? values[emailIdx] || null : null,
              phone: phoneIdx >= 0 ? values[phoneIdx] || null : null,
              whatsapp: whatsappIdx >= 0 ? values[whatsappIdx] || null : null,
              isActive: statusIdx >= 0 ? values[statusIdx]?.toLowerCase() === 'active' : true
            };
            
            // Validate contact
            const validContact = await storage.validateContactData(contact);
            contacts.push(validContact);
          } catch (error) {
            errors.push(`Line ${i+1}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        // Parse Excel file
        try {
          const workbook = xlsx.read(fileBuffer);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            return res.status(400).json({ message: "Excel file is empty or has no data rows" });
          }
          
          // Get headers (first row)
          const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase());
          
          // Check for required headers
          const firstNameIdx = headers.findIndex((h: string) => h === 'first name' || h === 'firstname');
          if (firstNameIdx === -1) {
            return res.status(400).json({ message: "Excel file must include a 'First Name' column" });
          }
          
          // Map other headers
          const lastNameIdx = headers.findIndex((h: string) => h === 'last name' || h === 'lastname');
          const emailIdx = headers.findIndex((h: string) => h === 'email');
          const phoneIdx = headers.findIndex((h: string) => h === 'phone');
          const whatsappIdx = headers.findIndex((h: string) => h === 'whatsapp');
          const statusIdx = headers.findIndex((h: string) => h === 'status');
          
          // Process data rows
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            if (!row || !row[firstNameIdx]) {
              if (row && row.length > 0) {
                errors.push(`Row ${i+1}: First Name is required`);
              }
              continue; // Skip empty rows
            }
            
            try {
              const contact = {
                tenantId: userTenant.id,
                firstName: row[firstNameIdx] ? String(row[firstNameIdx]).trim() : '',
                lastName: lastNameIdx >= 0 && row[lastNameIdx] ? String(row[lastNameIdx]).trim() : null,
                email: emailIdx >= 0 && row[emailIdx] ? String(row[emailIdx]).trim() : null,
                phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : null,
                whatsapp: whatsappIdx >= 0 && row[whatsappIdx] ? String(row[whatsappIdx]).trim() : null,
                isActive: statusIdx >= 0 && row[statusIdx] ? String(row[statusIdx]).toLowerCase() === 'active' : true
              };
              
              // Validate contact
              const validContact = await storage.validateContactData(contact);
              contacts.push(validContact);
            } catch (error) {
              errors.push(`Row ${i+1}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        } catch (error) {
          return res.status(400).json({ 
            message: "Failed to parse Excel file", 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        return res.status(400).json({ 
          message: "Unsupported file format. Please upload a CSV or Excel file."
        });
      }
      
      // Insert validated contacts
      let inserted = 0;
      for (const contact of contacts) {
        try {
          await storage.insertContact(contact);
          inserted++;
        } catch (error) {
          errors.push(`Error inserting contact ${contact.firstName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      return res.status(200).json({
        success: true,
        imported: inserted,
        total: contacts.length,
        errors: errors.length > 0 ? errors : null
      });
    } catch (error) {
      console.error("Contact upload error:", error);
      return res.status(500).json({ 
        message: "Error processing file upload",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
