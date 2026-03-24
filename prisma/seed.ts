import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // Clean up
  await prisma.payoutLineItem.deleteMany();
  await prisma.payoutBatch.deleteMany();
  await prisma.order.deleteMany();
  await prisma.influencer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Moda Fashion",
      slug: "moda-fashion",
      shopifyShopDomain: "moda-fashion.myshopify.com",
    },
  });
  console.log(`Created tenant: ${tenant.name}`);

  // Create Brand Admin User
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@modafashion.com",
      passwordHash: adminPasswordHash,
      name: "Admin Fashion",
      role: "BRAND_ADMIN",
      tenantId: tenant.id,
    },
  });
  console.log(`Created admin: ${adminUser.email}`);

  // Create Influencer Users
  const anaPasswordHash = await bcrypt.hash("ana123", 12);
  const anaUser = await prisma.user.create({
    data: {
      email: "ana@email.com",
      passwordHash: anaPasswordHash,
      name: "Ana Silva",
      role: "INFLUENCER",
      tenantId: tenant.id,
    },
  });

  const brunoPasswordHash = await bcrypt.hash("bruno123", 12);
  const brunoUser = await prisma.user.create({
    data: {
      email: "bruno@email.com",
      passwordHash: brunoPasswordHash,
      name: "Bruno Costa",
      role: "INFLUENCER",
      tenantId: tenant.id,
    },
  });

  const carlaPasswordHash = await bcrypt.hash("carla123", 12);
  const carlaUser = await prisma.user.create({
    data: {
      email: "carla@email.com",
      passwordHash: carlaPasswordHash,
      name: "Carla Lima",
      role: "INFLUENCER",
      tenantId: tenant.id,
    },
  });

  // Create Influencer profiles
  const ana = await prisma.influencer.create({
    data: {
      tenantId: tenant.id,
      userId: anaUser.id,
      displayName: "Ana Silva",
      email: "ana@email.com",
      couponCode: "ANA10",
      commissionRate: new Prisma.Decimal(0.10),
      pixKey: "ana@email.com",
      bankName: "Nubank",
      isActive: true,
    },
  });

  const bruno = await prisma.influencer.create({
    data: {
      tenantId: tenant.id,
      userId: brunoUser.id,
      displayName: "Bruno Costa",
      email: "bruno@email.com",
      couponCode: "BRUNO15",
      commissionRate: new Prisma.Decimal(0.15),
      pixKey: "123.456.789-00",
      bankName: "Itaú",
      isActive: true,
    },
  });

  const carla = await prisma.influencer.create({
    data: {
      tenantId: tenant.id,
      userId: carlaUser.id,
      displayName: "Carla Lima",
      email: "carla@email.com",
      couponCode: "CARLA20",
      commissionRate: new Prisma.Decimal(0.20),
      pixKey: "11987654321",
      bankName: "Bradesco",
      isActive: true,
    },
  });

  console.log(`Created influencers: ${ana.displayName}, ${bruno.displayName}, ${carla.displayName}`);

  // Create sample orders
  const influencerData = [
    { influencer: ana, coupon: "ANA10" },
    { influencer: bruno, coupon: "BRUNO15" },
    { influencer: carla, coupon: "CARLA20" },
  ];

  const orders: Prisma.OrderCreateManyInput[] = [];
  let orderCounter = 1001;

  // Spread ~30 orders over last 90 days
  const orderDays = [1, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 25, 27, 29, 31, 33, 35, 37, 40, 43, 45, 48, 51, 55, 60, 70, 80];

  for (let i = 0; i < orderDays.length; i++) {
    const day = orderDays[i];
    const infData = influencerData[i % influencerData.length];
    const subtotal = Math.round(randomBetween(150, 800) * 100) / 100;
    const discount = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal - discount) * 100) / 100;

    orders.push({
      tenantId: tenant.id,
      influencerId: infData.influencer.id,
      shopifyOrderId: `shopify_${orderCounter}`,
      orderNumber: `#${orderCounter}`,
      couponCode: infData.coupon,
      customerEmail: `customer${orderCounter}@example.com`,
      subtotalPrice: new Prisma.Decimal(subtotal),
      totalDiscounts: new Prisma.Decimal(discount),
      totalPrice: new Prisma.Decimal(total),
      currency: "BRL",
      financialStatus: "paid",
      fulfillmentStatus: i % 4 === 0 ? "fulfilled" : i % 4 === 1 ? null : "fulfilled",
      processedAt: daysAgo(day),
    });
    orderCounter++;
  }

  // Add a few more recent orders for the current month
  for (let i = 0; i < 5; i++) {
    const infData = influencerData[i % influencerData.length];
    const subtotal = Math.round(randomBetween(200, 600) * 100) / 100;
    const discount = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal - discount) * 100) / 100;

    orders.push({
      tenantId: tenant.id,
      influencerId: infData.influencer.id,
      shopifyOrderId: `shopify_${orderCounter}`,
      orderNumber: `#${orderCounter}`,
      couponCode: infData.coupon,
      customerEmail: `customer${orderCounter}@example.com`,
      subtotalPrice: new Prisma.Decimal(subtotal),
      totalDiscounts: new Prisma.Decimal(discount),
      totalPrice: new Prisma.Decimal(total),
      currency: "BRL",
      financialStatus: "paid",
      fulfillmentStatus: "fulfilled",
      processedAt: daysAgo(i),
    });
    orderCounter++;
  }

  await prisma.order.createMany({ data: orders });
  console.log(`Created ${orders.length} sample orders`);

  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Brand Admin: admin@modafashion.com / admin123");
  console.log("  Ana Silva:   ana@email.com / ana123");
  console.log("  Bruno Costa: bruno@email.com / bruno123");
  console.log("  Carla Lima:  carla@email.com / carla123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
