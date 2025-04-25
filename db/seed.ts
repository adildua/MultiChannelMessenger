import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if tenant levels exist
    const existingLevels = await db.query.tenantLevels.findMany();
    if (existingLevels.length === 0) {
      console.log("Seeding tenant levels...");
      await db.insert(schema.tenantLevels).values([
        {
          name: "Enterprise",
          description: "Top tier with unlimited features",
          maxContacts: 100000,
          maxCampaigns: 1000,
          maxTemplates: 500,
          maxUsers: 50
        },
        {
          name: "Business",
          description: "Mid-tier with advanced features",
          maxContacts: 25000,
          maxCampaigns: 250,
          maxTemplates: 100,
          maxUsers: 15
        },
        {
          name: "Starter",
          description: "Entry level with basic features",
          maxContacts: 5000,
          maxCampaigns: 50,
          maxTemplates: 25,
          maxUsers: 5
        }
      ]);
    }

    // Check if channels exist
    const existingChannels = await db.query.channels.findMany();
    if (existingChannels.length === 0) {
      console.log("Seeding communication channels...");
      await db.insert(schema.channels).values([
        {
          code: "SMS",
          name: "SMS",
          description: "Short Message Service",
          icon: "message-square",
          basePrice: 0.01
        },
        {
          code: "VOIP",
          name: "VOIP",
          description: "Voice over IP",
          icon: "phone",
          basePrice: 0.03
        },
        {
          code: "WHATSAPP",
          name: "WhatsApp",
          description: "WhatsApp Messaging",
          icon: "message-circle",
          basePrice: 0.02
        },
        {
          code: "RCS",
          name: "RCS",
          description: "Rich Communication Services",
          icon: "message-square-dashed",
          basePrice: 0.015
        }
      ]);
    }

    // Check if admin user exists
    const existingAdmin = await db.query.users.findFirst({
      where: schema.eq(schema.users.username, "admin")
    });

    if (!existingAdmin) {
      console.log("Creating admin user...");
      const [adminUser] = await db.insert(schema.users).values({
        username: "admin",
        password: "admin123", // In a real app, this would be hashed
        email: "admin@example.com",
        name: "Admin User",
        role: "admin"
      }).returning();

      // Create a main tenant if it doesn't exist
      const level1 = await db.query.tenantLevels.findFirst({
        where: schema.eq(schema.tenantLevels.name, "Enterprise")
      });

      if (!level1) {
        throw new Error("Tenant level 'Enterprise' not found");
      }

      const [mainTenant] = await db.insert(schema.tenants).values({
        name: "Acme Corporation",
        email: "acme@example.com",
        phone: "+1 (555) 123-4567",
        address: "123 Main St, City, Country",
        levelId: level1.id,
        balance: 3500,
        currencyCode: "USD",
        isActive: true
      }).returning();

      // Associate admin user with main tenant
      await db.insert(schema.userTenants).values({
        userId: adminUser.id,
        tenantId: mainTenant.id,
        role: "owner"
      });

      // Create some child tenants
      const level2 = await db.query.tenantLevels.findFirst({
        where: schema.eq(schema.tenantLevels.name, "Business")
      });

      if (!level2) {
        throw new Error("Tenant level 'Business' not found");
      }

      await db.insert(schema.tenants).values({
        name: "TechSolutions Inc.",
        email: "tech@example.com",
        phone: "+1 (555) 987-6543",
        address: "456 Business Blvd, City, Country",
        levelId: level2.id,
        parentId: mainTenant.id,
        balance: 1890,
        currencyCode: "USD",
        isActive: true
      });

      const level3 = await db.query.tenantLevels.findFirst({
        where: schema.eq(schema.tenantLevels.name, "Starter")
      });

      if (!level3) {
        throw new Error("Tenant level 'Starter' not found");
      }

      await db.insert(schema.tenants).values({
        name: "Global Services LLC",
        email: "global@example.com",
        phone: "+1 (555) 246-8642",
        address: "789 Commerce Way, City, Country",
        levelId: level3.id,
        parentId: mainTenant.id,
        balance: 750,
        currencyCode: "USD",
        isActive: false
      });

      // Create some sample channel rates
      await db.insert(schema.channelRates).values([
        {
          channelId: 1, // SMS
          tenantLevelId: level1.id,
          countryCode: "US",
          rate: 0.008,
          currencyCode: "USD"
        },
        {
          channelId: 2, // VOIP
          tenantLevelId: level1.id,
          countryCode: "US",
          rate: 0.025,
          currencyCode: "USD"
        },
        {
          channelId: 3, // WhatsApp
          tenantLevelId: level1.id,
          countryCode: "US",
          rate: 0.015,
          currencyCode: "USD"
        },
        {
          channelId: 4, // RCS
          tenantLevelId: level1.id,
          countryCode: "US",
          rate: 0.012,
          currencyCode: "USD"
        }
      ]);

      // Create some sample contacts for the main tenant
      await db.insert(schema.contacts).values([
        {
          tenantId: mainTenant.id,
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          phone: "+1 (555) 123-0001",
          whatsapp: "+1 (555) 123-0001",
          isActive: true
        },
        {
          tenantId: mainTenant.id,
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@example.com",
          phone: "+1 (555) 123-0002",
          whatsapp: "+1 (555) 123-0002",
          isActive: true
        },
        {
          tenantId: mainTenant.id,
          firstName: "Michael",
          lastName: "Williams",
          email: "michael.williams@example.com",
          phone: "+1 (555) 123-0003",
          whatsapp: "+1 (555) 123-0003",
          isActive: true
        }
      ]);

      // Create a contact list
      const [contactList] = await db.insert(schema.contactLists).values({
        tenantId: mainTenant.id,
        name: "All Customers",
        description: "Main customer list"
      }).returning();

      // Add contacts to list
      const contacts = await db.query.contacts.findMany({
        where: schema.eq(schema.contacts.tenantId, mainTenant.id)
      });

      const contactListMembers = contacts.map(contact => ({
        listId: contactList.id,
        contactId: contact.id
      }));

      await db.insert(schema.contactListMembers).values(contactListMembers);

      // Create sample templates
      const templates = [
        {
          tenantId: mainTenant.id,
          name: "Welcome Message",
          type: "sms",
          content: "Welcome to {{company}}! We're excited to have you join us. Reply HELP for assistance or STOP to unsubscribe.",
          variables: JSON.stringify(["company"]),
          previewData: JSON.stringify({ company: "Acme Corp" }),
          isActive: true
        },
        {
          tenantId: mainTenant.id,
          name: "Product Announcement",
          type: "whatsapp",
          content: "Hello {{name}}, we're excited to announce our new product: {{product}}! Check it out at {{link}}",
          variables: JSON.stringify(["name", "product", "link"]),
          previewData: JSON.stringify({ name: "John", product: "Widget Pro", link: "https://example.com/products" }),
          isActive: true
        },
        {
          tenantId: mainTenant.id,
          name: "Appointment Reminder",
          type: "sms",
          content: "Reminder: You have an appointment scheduled for {{date}} at {{time}}. Reply C to confirm or R to reschedule.",
          variables: JSON.stringify(["date", "time"]),
          previewData: JSON.stringify({ date: "June 15", time: "2:30 PM" }),
          isActive: true
        }
      ];

      await db.insert(schema.templates).values(templates);

      // Create simple flow
      const [flow] = await db.insert(schema.flows).values({
        tenantId: mainTenant.id,
        name: "Welcome Sequence",
        description: "Welcome message flow for new customers",
        nodes: JSON.stringify([
          {
            id: 'sms-1',
            type: 'smsNode',
            position: { x: 100, y: 100 },
            data: { label: 'SMS Node', content: 'Welcome to our service!' }
          },
          {
            id: 'decision-1',
            type: 'decisionNode',
            position: { x: 100, y: 250 },
            data: { label: 'Decision Node', content: 'Check if response is YES' }
          },
          {
            id: 'whatsapp-1',
            type: 'whatsappNode',
            position: { x: 0, y: 400 },
            data: { label: 'WhatsApp Node', content: 'Thanks for your positive response!' }
          },
          {
            id: 'voip-1',
            type: 'voipNode',
            position: { x: 200, y: 400 },
            data: { label: 'VOIP Node', content: 'Follow up call script' }
          }
        ]),
        edges: JSON.stringify([
          { id: 'e1-2', source: 'sms-1', target: 'decision-1' },
          { id: 'e2-3', source: 'decision-1', target: 'whatsapp-1', sourceHandle: 'yes' },
          { id: 'e2-4', source: 'decision-1', target: 'voip-1', sourceHandle: 'no' }
        ]),
        isActive: true
      }).returning();

      // Create sample campaigns
      const smsChannel = await db.query.channels.findFirst({
        where: schema.eq(schema.channels.code, "SMS")
      });

      if (!smsChannel) {
        throw new Error("SMS channel not found");
      }

      const template = await db.query.templates.findFirst({
        where: schema.eq(schema.templates.type, "sms")
      });

      await db.insert(schema.campaigns).values([
        {
          tenantId: mainTenant.id,
          name: "Summer Sale Promotion",
          description: "Promotion for the summer sale event",
          channelId: smsChannel.id,
          flowId: flow.id,
          templateId: template?.id,
          listId: contactList.id,
          status: "active",
          scheduledAt: new Date(Date.now() - 86400000), // Yesterday
          metadata: JSON.stringify({ performance: 85 })
        }
      ]);
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
