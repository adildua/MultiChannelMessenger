import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, foreignKey, primaryKey, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table - for authentication and account management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tenant Levels
export const tenantLevels = pgTable("tenant_levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  maxContacts: integer("max_contacts").notNull(),
  maxCampaigns: integer("max_campaigns").notNull(),
  maxTemplates: integer("max_templates").notNull(),
  maxUsers: integer("max_users").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tenants (Organizations)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  levelId: integer("level_id").references(() => tenantLevels.id).notNull(),
  parentId: integer("parent_id").references(() => tenants.id),
  // Changed from decimal to text to fix type conversion issues in API
  balance: text("balance").notNull().default("0"),
  currencyCode: text("currency_code").notNull().default("USD"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User-Tenant Association
export const userTenants = pgTable("user_tenants", {
  userId: integer("user_id").references(() => users.id).notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, table => {
  return {
    pk: primaryKey({ columns: [table.userId, table.tenantId] })
  };
});

// Contacts
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Contact Lists
export const contactLists = pgTable("contact_lists", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Contact List Members
export const contactListMembers = pgTable("contact_list_members", {
  listId: integer("list_id").references(() => contactLists.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, table => {
  return {
    pk: primaryKey({ columns: [table.listId, table.contactId] })
  };
});

// Communication Channels
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  basePrice: decimal("base_price", { precision: 10, scale: 6 }).notNull()
});

// API Integrations
export const apiIntegrations = pgTable("api_integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  accountSid: text("account_sid"),
  authToken: text("auth_token"),
  baseUrl: text("base_url"),
  isActive: boolean("is_active").notNull().default(true),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Communication Templates
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // sms, whatsapp, voice, rcs
  content: text("content").notNull(),
  variables: jsonb("variables"),
  previewData: jsonb("preview_data"),
  metadata: jsonb("metadata"), // For WhatsApp template specific data (category, language, headerType, footer)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Communication Flows
export const flows = pgTable("flows", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  flowId: integer("flow_id").references(() => flows.id),
  templateId: integer("template_id").references(() => templates.id),
  listId: integer("list_id").references(() => contactLists.id),
  status: text("status").notNull().default("draft"), // draft, scheduled, active, paused, completed
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Campaign Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed
  statusDetail: text("status_detail"),
  externalId: text("external_id"),
  direction: text("direction").notNull().default("outbound"), // inbound, outbound
  cost: decimal("cost", { precision: 10, scale: 6 }),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Conversations (for two-way communications)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  status: text("status").notNull().default("open"), // open, assigned, closed
  assignedTo: integer("assigned_to").references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Conversation Messages
export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  senderId: integer("sender_id").references(() => users.id),
  direction: text("direction").notNull(), // inbound, outbound
  read: boolean("read").notNull().default(false),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Transactions (for billing/balance tracking)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  type: text("type").notNull(), // topup, charge, refund
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currencyCode: text("currency_code").notNull().default("USD"),
  description: text("description"),
  reference: text("reference"),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Channel Billing Rates
export const channelRates = pgTable("channel_rates", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  tenantLevelId: integer("tenant_level_id").references(() => tenantLevels.id).notNull(),
  countryCode: text("country_code").notNull().default("ALL"),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  currencyCode: text("currency_code").notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, table => {
  return {
    unq: uniqueIndex("channel_rate_idx").on(
      table.channelId, 
      table.tenantLevelId, 
      table.countryCode
    )
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userTenants: many(userTenants),
  conversationsAssigned: many(conversations, { relationName: "assignedConversations" })
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  level: one(tenantLevels, { fields: [tenants.levelId], references: [tenantLevels.id] }),
  parent: one(tenants, { fields: [tenants.parentId], references: [tenants.id] }),
  userTenants: many(userTenants),
  contacts: many(contacts),
  contactLists: many(contactLists),
  apiIntegrations: many(apiIntegrations),
  templates: many(templates),
  flows: many(flows),
  campaigns: many(campaigns),
  conversations: many(conversations),
  transactions: many(transactions)
}));

export const tenantLevelsRelations = relations(tenantLevels, ({ many }) => ({
  tenants: many(tenants),
  channelRates: many(channelRates)
}));

export const userTenantsRelations = relations(userTenants, ({ one }) => ({
  user: one(users, { fields: [userTenants.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [userTenants.tenantId], references: [tenants.id] })
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  tenant: one(tenants, { fields: [contacts.tenantId], references: [tenants.id] }),
  listMemberships: many(contactListMembers),
  messages: many(messages),
  conversations: many(conversations)
}));

export const contactListsRelations = relations(contactLists, ({ one, many }) => ({
  tenant: one(tenants, { fields: [contactLists.tenantId], references: [tenants.id] }),
  members: many(contactListMembers),
  campaigns: many(campaigns)
}));

export const contactListMembersRelations = relations(contactListMembers, ({ one }) => ({
  list: one(contactLists, { fields: [contactListMembers.listId], references: [contactLists.id] }),
  contact: one(contacts, { fields: [contactListMembers.contactId], references: [contacts.id] })
}));

export const channelsRelations = relations(channels, ({ many }) => ({
  apiIntegrations: many(apiIntegrations),
  campaigns: many(campaigns),
  messages: many(messages),
  conversations: many(conversations),
  rates: many(channelRates)
}));

export const apiIntegrationsRelations = relations(apiIntegrations, ({ one }) => ({
  tenant: one(tenants, { fields: [apiIntegrations.tenantId], references: [tenants.id] }),
  channel: one(channels, { fields: [apiIntegrations.channelId], references: [channels.id] })
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [templates.tenantId], references: [tenants.id] }),
  campaigns: many(campaigns)
}));

export const flowsRelations = relations(flows, ({ one, many }) => ({
  tenant: one(tenants, { fields: [flows.tenantId], references: [tenants.id] }),
  campaigns: many(campaigns)
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [campaigns.tenantId], references: [tenants.id] }),
  channel: one(channels, { fields: [campaigns.channelId], references: [channels.id] }),
  flow: one(flows, { fields: [campaigns.flowId], references: [flows.id] }),
  template: one(templates, { fields: [campaigns.templateId], references: [templates.id] }),
  contactList: one(contactLists, { fields: [campaigns.listId], references: [contactLists.id] }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  campaign: one(campaigns, { fields: [messages.campaignId], references: [campaigns.id] }),
  contact: one(contacts, { fields: [messages.contactId], references: [contacts.id] }),
  channel: one(channels, { fields: [messages.channelId], references: [channels.id] })
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [conversations.tenantId], references: [tenants.id] }),
  contact: one(contacts, { fields: [conversations.contactId], references: [contacts.id] }),
  channel: one(channels, { fields: [conversations.channelId], references: [channels.id] }),
  assignedUser: one(users, { 
    fields: [conversations.assignedTo], 
    references: [users.id],
    relationName: "assignedConversations"
  }),
  messages: many(conversationMessages)
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationMessages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [conversationMessages.senderId], references: [users.id] })
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  tenant: one(tenants, { fields: [transactions.tenantId], references: [tenants.id] })
}));

export const channelRatesRelations = relations(channelRates, ({ one }) => ({
  channel: one(channels, { fields: [channelRates.channelId], references: [channels.id] }),
  tenantLevel: one(tenantLevels, { fields: [channelRates.tenantLevelId], references: [tenantLevels.id] })
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
  email: (schema) => schema.email("Must provide a valid email")
});

export const insertTenantSchema = createInsertSchema(tenants, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email")
});

export const insertContactSchema = createInsertSchema(contacts, {
  firstName: (schema) => schema.min(1, "First name is required")
});

export const insertTemplateSchema = createInsertSchema(templates, {
  name: (schema) => schema.min(1, "Name is required"),
  content: (schema) => schema.min(1, "Content is required")
});

export const insertCampaignSchema = createInsertSchema(campaigns, {
  name: (schema) => schema.min(1, "Name is required")
});

export const insertFlowSchema = createInsertSchema(flows, {
  name: (schema) => schema.min(1, "Name is required")
});

export type User = typeof users.$inferSelect;
export type UserInsert = z.infer<typeof insertUserSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type TenantInsert = z.infer<typeof insertTenantSchema>;
export type Contact = typeof contacts.$inferSelect;
export type ContactInsert = z.infer<typeof insertContactSchema>;
export type Template = typeof templates.$inferSelect & {
  metadata?: {
    category?: string;
    language?: string;
    headerType?: string;
    footer?: string;
    variables?: Record<string, string>;
  };
};
export type TemplateInsert = z.infer<typeof insertTemplateSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignInsert = z.infer<typeof insertCampaignSchema>;
export type Flow = typeof flows.$inferSelect;
export type FlowInsert = z.infer<typeof insertFlowSchema>;
export type Channel = typeof channels.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ApiIntegration = typeof apiIntegrations.$inferSelect;
export type ContactList = typeof contactLists.$inferSelect;
export type TenantLevel = typeof tenantLevels.$inferSelect;
