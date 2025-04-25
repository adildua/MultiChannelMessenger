import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, count, desc, isNull } from "drizzle-orm";
import { z } from "zod";

// User-related functions
export async function getUserByUsername(username: string) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.username, username)
  });
  return user;
}

export async function getUserById(id: number) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, id)
  });
  return user;
}

export async function getUserPrimaryTenant(userId: number) {
  const userTenant = await db.query.userTenants.findFirst({
    where: eq(schema.userTenants.userId, userId),
    with: {
      tenant: true
    }
  });
  
  return userTenant?.tenant;
}

export async function getUserRoleInTenant(userId: number, tenantId: number) {
  const userTenant = await db.query.userTenants.findFirst({
    where: and(
      eq(schema.userTenants.userId, userId),
      eq(schema.userTenants.tenantId, tenantId)
    )
  });
  
  return userTenant?.role;
}

// Contact-related functions
export async function validateContactData(data: any) {
  return schema.insertContactSchema.parse(data);
}

export async function insertContact(data: z.infer<typeof schema.insertContactSchema> & { tenantId: number }) {
  const [contact] = await db.insert(schema.contacts).values(data).returning();
  return contact;
}

export async function updateContact(id: number, data: z.infer<typeof schema.insertContactSchema>) {
  const [updatedContact] = await db
    .update(schema.contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.contacts.id, id))
    .returning();
  
  return updatedContact;
}

export async function deleteContact(id: number) {
  await db.delete(schema.contacts).where(eq(schema.contacts.id, id));
}

export async function getContactStats(tenantId: number) {
  // Get total contacts count
  const totalResult = await db
    .select({ count: count() })
    .from(schema.contacts)
    .where(eq(schema.contacts.tenantId, tenantId));
  
  // Get active contacts count
  const activeResult = await db
    .select({ count: count() })
    .from(schema.contacts)
    .where(and(
      eq(schema.contacts.tenantId, tenantId),
      eq(schema.contacts.isActive, true)
    ));
  
  // Get segments count (not implemented yet, placeholder)
  const segments = 24;
  
  // Get lists count
  const listsResult = await db
    .select({ count: count() })
    .from(schema.contactLists)
    .where(eq(schema.contactLists.tenantId, tenantId));
  
  return {
    total: totalResult[0]?.count || 0,
    active: activeResult[0]?.count || 0,
    segments,
    lists: listsResult[0]?.count || 0
  };
}

// Template-related functions
export async function validateTemplateData(data: any) {
  return schema.insertTemplateSchema.parse(data);
}

export async function insertTemplate(data: z.infer<typeof schema.insertTemplateSchema> & { tenantId: number }) {
  const [template] = await db.insert(schema.templates).values(data).returning();
  return template;
}

export async function updateTemplate(id: number, data: z.infer<typeof schema.insertTemplateSchema>) {
  const [updatedTemplate] = await db
    .update(schema.templates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.templates.id, id))
    .returning();
  
  return updatedTemplate;
}

export async function deleteTemplate(id: number) {
  await db.delete(schema.templates).where(eq(schema.templates.id, id));
}

// Flow-related functions
export async function validateFlowData(data: any) {
  return schema.insertFlowSchema.parse(data);
}

export async function insertFlow(data: z.infer<typeof schema.insertFlowSchema> & { tenantId: number }) {
  const [flow] = await db.insert(schema.flows).values(data).returning();
  return flow;
}

export async function updateFlow(id: number, data: z.infer<typeof schema.insertFlowSchema>) {
  const [updatedFlow] = await db
    .update(schema.flows)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.flows.id, id))
    .returning();
  
  return updatedFlow;
}

// Campaign-related functions
export async function validateCampaignData(data: any) {
  return schema.insertCampaignSchema.parse(data);
}

export async function insertCampaign(data: z.infer<typeof schema.insertCampaignSchema> & { tenantId: number }) {
  const [campaign] = await db.insert(schema.campaigns).values(data).returning();
  return campaign;
}

// Tenant-related functions
export async function validateTenantData(data: any) {
  return schema.validatedTenantSchema.parse(data);
}

export async function insertTenant(data: z.infer<typeof schema.validatedTenantSchema> & { parentId?: number | null }) {
  const [tenant] = await db.insert(schema.tenants).values(data).returning();
  return tenant;
}

// API Integration-related functions
export const apiIntegrationSchema = z.object({
  channelId: z.number().min(1, "Channel is required"),
  name: z.string().min(1, "Name is required"),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  baseUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  settings: z.any().optional()
});

export async function validateApiIntegrationData(data: any) {
  return apiIntegrationSchema.parse(data);
}

export async function insertApiIntegration(data: z.infer<typeof apiIntegrationSchema> & { tenantId: number }) {
  const [integration] = await db.insert(schema.apiIntegrations).values(data).returning();
  return integration;
}

export const storage = {
  getUserByUsername,
  getUserById,
  getUserPrimaryTenant,
  getUserRoleInTenant,
  validateContactData,
  insertContact,
  updateContact,
  deleteContact,
  getContactStats,
  validateTemplateData,
  insertTemplate,
  updateTemplate,
  deleteTemplate,
  validateFlowData,
  insertFlow,
  updateFlow,
  validateCampaignData,
  insertCampaign,
  validateTenantData,
  insertTenant,
  validateApiIntegrationData,
  insertApiIntegration
};
