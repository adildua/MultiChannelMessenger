import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedContacts() {
  try {
    console.log("Starting database seed for contacts...");

    // Fetch the main tenant
    const mainTenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.name, "Acme Corporation")
    });

    if (!mainTenant) {
      throw new Error("Main tenant not found. Please run the main seed script first.");
    }

    // Create 10 dummy contacts
    const dummyContacts = [
      {
        tenantId: mainTenant.id,
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@example.com",
        phone: "+1 (555) 123-0004",
        whatsapp: "+1 (555) 123-0004",
        isActive: true
      },
      {
        tenantId: mainTenant.id,
        firstName: "David",
        lastName: "Wilson",
        email: "david.wilson@example.com",
        phone: "+1 (555) 123-0005",
        whatsapp: "+1 (555) 123-0005",
        isActive: true
      },
      {
        tenantId: mainTenant.id,
        firstName: "Jessica",
        lastName: "Brown",
        email: "jessica.brown@example.com",
        phone: "+1 (555) 123-0006",
        whatsapp: null,
        isActive: true
      },
      {
        tenantId: mainTenant.id,
        firstName: "Christopher",
        lastName: "Miller",
        email: "chris.miller@example.com",
        phone: "+1 (555) 123-0007",
        whatsapp: "+1 (555) 123-0007",
        isActive: false
      },
      {
        tenantId: mainTenant.id,
        firstName: "Amanda",
        lastName: "Taylor",
        email: "amanda.taylor@example.com",
        phone: "+1 (555) 123-0008",
        whatsapp: "+1 (555) 123-0008",
        isActive: true
      },
      {
        tenantId: mainTenant.id,
        firstName: "Ryan",
        lastName: "Anderson",
        email: "ryan.anderson@example.com",
        phone: "+1 (555) 123-0009",
        whatsapp: null,
        isActive: true
      },
      {
        tenantId: mainTenant.id,
        firstName: "Jennifer",
        lastName: "Martinez",
        email: "jennifer.martinez@example.com",
        phone: "+1 (555) 123-0010",
        whatsapp: "+1 (555) 123-0010",
        isActive: true
      },
      {
        tenantId: mainTenant.id,
        firstName: "Daniel",
        lastName: "Thompson",
        email: "daniel.thompson@example.com",
        phone: "+1 (555) 123-0011",
        whatsapp: "+1 (555) 123-0011",
        isActive: true
      },
      {
        tenantId: mainTenant.id,
        firstName: "Michelle",
        lastName: "Garcia",
        email: "michelle.garcia@example.com",
        phone: "+1 (555) 123-0012",
        whatsapp: null,
        isActive: false
      },
      {
        tenantId: mainTenant.id,
        firstName: "James",
        lastName: "Robinson",
        email: "james.robinson@example.com",
        phone: "+1 (555) 123-0013",
        whatsapp: "+1 (555) 123-0013",
        isActive: true
      }
    ];

    // Insert the contacts
    await db.insert(schema.contacts).values(dummyContacts);

    // Add contacts to All Customers list
    const contactList = await db.query.contactLists.findFirst({
      where: eq(schema.contactLists.name, "All Customers")
    });

    if (contactList) {
      // Get all the new contacts
      const newContacts = await db.query.contacts.findMany({
        where: eq(schema.contacts.tenantId, mainTenant.id)
      });

      // Filter to only get the ones we just added (which would have IDs greater than 3)
      const recentContacts = newContacts.filter(contact => contact.id > 3);

      if (recentContacts.length > 0) {
        const contactListMembers = recentContacts.map(contact => ({
          listId: contactList.id,
          contactId: contact.id
        }));

        await db.insert(schema.contactListMembers).values(contactListMembers);
      }
    }

    console.log("Successfully added 10 dummy contacts!");
  } catch (error) {
    console.error("Error seeding contacts:", error);
  }
}

seedContacts();