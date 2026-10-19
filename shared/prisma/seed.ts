import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient, Role, OrderStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prisma = new PrismaClient();

export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Books",
  "Beauty & Personal Care",
];

const PRODUCTS_DATA = [
  // Electronics
  {
    category: "Electronics",
    name: "Apple iPhone 15 Pro Max 256GB Titanium",
    emoji: "📱",
    description:
      "A17 Pro chip with 6-core GPU, aerospace-grade titanium design, 48MP main camera and USB-C connectivity.",
    price: 1199.99,
    stock: 25,
  },
  {
    category: "Electronics",
    name: "Sony WH-1000XM5 Wireless Headphones",
    emoji: "🎧",
    description:
      "Industry-leading noise canceling with two processors and 8 microphones for exceptional sound and call clarity.",
    price: 399.99,
    stock: 45,
  },
  {
    category: "Electronics",
    name: 'Apple MacBook Air 15" M3',
    emoji: "💻",
    description:
      "Strikingly thin design, stunning Liquid Retina display, up to 18 hours of battery life and 16GB unified memory.",
    price: 1299.0,
    stock: 18,
  },
  {
    category: "Electronics",
    name: "Logitech MX Master 3S Wireless Mouse",
    emoji: "🖱️",
    description:
      "Quiet Click technology, 8,000 DPI any-surface tracking sensor, and ultra-fast MagSpeed electromagnetic scrolling.",
    price: 99.99,
    stock: 80,
  },
  {
    category: "Electronics",
    name: 'Samsung 34" Odyssey OLED G8 Curved Gaming Monitor',
    emoji: "🖥️",
    description:
      "Curved UWQHD display with Neo Quantum Processor, 0.03ms response time, and 175Hz refresh rate.",
    price: 899.99,
    stock: 12,
  },

  // Clothing
  {
    category: "Clothing",
    name: "Patagonia Better Sweater Fleece Jacket",
    emoji: "🧥",
    description:
      "100% recycled polyester fleece jacket dyed with a low-impact process, offering lightweight warmth and durability.",
    price: 139.0,
    stock: 50,
  },
  {
    category: "Clothing",
    name: "Levi's 501 Original Fit Jeans",
    emoji: "👖",
    description:
      "The timeless straight-leg silhouette with signature button fly, crafted from 100% non-stretch cotton denim.",
    price: 79.5,
    stock: 110,
  },
  {
    category: "Clothing",
    name: "Nike Air Zoom Pegasus 40 Running Shoes",
    emoji: "👟",
    description:
      "Engineered mesh upper with responsive Nike React foam and dual Zoom Air units for daily road training.",
    price: 130.0,
    stock: 65,
  },
  {
    category: "Clothing",
    name: "Uniqlo Supima Cotton Crew Neck T-Shirt",
    emoji: "👕",
    description:
      "Made from 100% premium long-staple Supima cotton for an exceptionally smooth, soft, and breathable feel.",
    price: 19.9,
    stock: 200,
  },

  // Home & Kitchen
  {
    category: "Home & Kitchen",
    name: "Breville Barista Touch Espresso Machine",
    emoji: "☕",
    description:
      "Automated touchscreen with pre-programmed cafe drinks, integrated precision grinder, and 3-second heat up.",
    price: 999.95,
    stock: 14,
  },
  {
    category: "Home & Kitchen",
    name: "Le Creuset Signature Enameled Cast Iron Dutch Oven (5.5 Qt)",
    emoji: "🍲",
    description:
      "Iconic enameled cast iron delivers superior heat distribution and retention for slow-cooking, searing, and braising.",
    price: 420.0,
    stock: 28,
  },
  {
    category: "Home & Kitchen",
    name: "Dyson V15 Detect Cordless Vacuum",
    emoji: "🧹",
    description:
      "Engineered with laser illumination to reveal invisible dust on hard floors with intelligent suction adjustment.",
    price: 749.99,
    stock: 20,
  },
  {
    category: "Home & Kitchen",
    name: "Fellow Ode Gen 2 Brew Coffee Grinder",
    emoji: "🫘",
    description:
      "Precision coffee grinder with 64mm commercial-grade flat burrs, 31 grind settings, and low-retention chute.",
    price: 345.0,
    stock: 35,
  },

  // Sports & Outdoors
  {
    category: "Sports & Outdoors",
    name: "Yeti Tundra 45 Hard Cooler",
    emoji: "🧊",
    description:
      "Heavy-duty rotomolded cooler with PermaFrost insulation and FatWall design for ultimate multi-day ice retention.",
    price: 325.0,
    stock: 30,
  },
  {
    category: "Sports & Outdoors",
    name: "Hydro Flask 32 oz Wide Mouth Bottle",
    emoji: "🧴",
    description:
      "TempShield double-wall vacuum insulation keeps liquids ice cold up to 24 hours or piping hot up to 12 hours.",
    price: 44.95,
    stock: 140,
  },
  {
    category: "Sports & Outdoors",
    name: "Garmin Forerunner 265 GPS Running Smartwatch",
    emoji: "⌚",
    description:
      "Brilliant AMOLED touchscreen display with advanced training readiness metrics and wrist-based running dynamics.",
    price: 449.99,
    stock: 35,
  },
  {
    category: "Sports & Outdoors",
    name: "Manduka PRO Yoga Mat (6mm)",
    emoji: "🧘",
    description:
      "High-density cushioned support with closed-cell surface preventing moisture and sweat from seeping in.",
    price: 128.0,
    stock: 55,
  },

  // Books
  {
    category: "Books",
    name: "Designing Data-Intensive Applications (Martin Kleppmann)",
    emoji: "📖",
    description:
      "The definitive comprehensive guide to principles, architectures, and trade-offs in distributed data systems.",
    price: 45.99,
    stock: 85,
  },
  {
    category: "Books",
    name: "Building Microservices: Designing Fine-Grained Systems (Sam Newman)",
    emoji: "📚",
    description:
      "In-depth guide covering modern architecture, integration patterns, security, and deployment for distributed services.",
    price: 49.99,
    stock: 60,
  },
  {
    category: "Books",
    name: "Clean Code: A Handbook of Agile Software Craftsmanship",
    emoji: "📕",
    description:
      "A timeless, practical guide detailing principles and patterns for crafting robust, readable software.",
    price: 39.95,
    stock: 90,
  },

  // Beauty & Personal Care
  {
    category: "Beauty & Personal Care",
    name: "Dyson Supersonic Hair Dryer",
    emoji: "💨",
    description:
      "Engineered for different hair types with fast drying and intelligent heat control to prevent extreme thermal damage.",
    price: 429.99,
    stock: 22,
  },
  {
    category: "Beauty & Personal Care",
    name: "Aesop Resurrection Aromatique Hand Balm (75ml)",
    emoji: "🧴",
    description:
      "Nourishing botanical hand balm scented with mandarin rind, rosemary leaf, and cedar atlas.",
    price: 33.0,
    stock: 120,
  },
  {
    category: "Beauty & Personal Care",
    name: "CeraVe Hydrating Facial Cleanser (16 oz)",
    emoji: "🧼",
    description:
      "Gentle lotion cleanser formulated with 3 essential ceramides and hyaluronic acid to restore skin moisture barrier.",
    price: 15.99,
    stock: 220,
  },
];

async function seedCategories(): Promise<Map<string, string>> {
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();

  for (const name of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap.set(name, record.id);
  }

  console.log(`✓ Seeded ${categoryMap.size} categories.`);
  return categoryMap;
}

async function seedUsers() {
  console.log("Seeding users...");
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const userPasswordHash = await bcrypt.hash("user123", 10);

  // 1. Primary Admin (from GEMINI.md spec)
  const admin = await prisma.user.upsert({
    where: { email: "admin@kafkashop.com" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.admin,
    },
    create: {
      email: "admin@kafkashop.com",
      username: "admin",
      firstName: "Admin",
      lastName: "ShopFlow",
      passwordHash: adminPasswordHash,
      role: Role.admin,
    },
  });

  // Secondary admin alias (admin@shopflow.com)
  await prisma.user.upsert({
    where: { email: "admin@shopflow.com" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.admin,
    },
    create: {
      email: "admin@shopflow.com",
      username: "admin_shopflow",
      firstName: "ShopFlow",
      lastName: "Admin",
      passwordHash: adminPasswordHash,
      role: Role.admin,
    },
  });

  // 2. Demo User 1: John Doe
  const user1 = await prisma.user.upsert({
    where: { email: "john.doe@example.com" },
    update: {
      passwordHash: userPasswordHash,
      role: Role.user,
    },
    create: {
      email: "john.doe@example.com",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      passwordHash: userPasswordHash,
      role: Role.user,
    },
  });

  // 3. Demo User 2: Olena Shevchenko
  const user2 = await prisma.user.upsert({
    where: { email: "olena.shevchenko@example.com" },
    update: {
      passwordHash: userPasswordHash,
      role: Role.user,
    },
    create: {
      email: "olena.shevchenko@example.com",
      username: "olena_s",
      firstName: "Olena",
      lastName: "Shevchenko",
      passwordHash: userPasswordHash,
      role: Role.user,
    },
  });

  console.log("✓ Seeded admin & demo users (passwords: admin123 / user123).");
  return { admin, user1, user2 };
}

async function seedProducts(categoryMap: Map<string, string>) {
  console.log("Seeding products...");
  const createdProducts = [];

  for (const item of PRODUCTS_DATA) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          emoji: item.emoji,
          description: item.description,
          price: item.price,
          stock: item.stock,
          categoryId,
        },
      });
      createdProducts.push(updated);
    } else {
      const created = await prisma.product.create({
        data: {
          name: item.name,
          emoji: item.emoji,
          description: item.description,
          price: item.price,
          stock: item.stock,
          categoryId,
        },
      });
      createdProducts.push(created);
    }
  }

  console.log(`✓ Seeded ${createdProducts.length} realistic products.`);
  return createdProducts;
}

async function seedSampleOrders(
  user1: { id: string },
  user2: { id: string },
  products: { id: string; price: any }[],
) {
  console.log("Checking sample orders...");
  const existingOrdersCount = await prisma.order.count();
  if (existingOrdersCount > 0) {
    console.log(
      `✓ Database already has ${existingOrdersCount} orders, skipping order seeding.`,
    );
    return;
  }

  if (products.length < 4) return;

  // Order 1 for John Doe (Delivered)
  const p0 = products[0]; // iPhone
  const p1 = products[1]; // Headphones
  const total1 = Number(p0.price) + Number(p1.price);

  await prisma.order.create({
    data: {
      userId: user1.id,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.SUCCESS,
      totalAmount: total1,
      items: {
        create: [
          { productId: p0.id, quantity: 1, unitPrice: p0.price },
          { productId: p1.id, quantity: 1, unitPrice: p1.price },
        ],
      },
    },
  });

  // Order 2 for John Doe (In Shipping)
  const p2 = products[3]; // Logitech Mouse
  await prisma.order.create({
    data: {
      userId: user1.id,
      status: OrderStatus.SHIPPING,
      paymentStatus: PaymentStatus.SUCCESS,
      totalAmount: Number(p2.price) * 2,
      items: {
        create: [{ productId: p2.id, quantity: 2, unitPrice: p2.price }],
      },
    },
  });

  // Order 3 for Olena (Packaging)
  const p3 = products[5]; // Patagonia jacket
  const p4 = products[14]; // Yeti cooler
  const total3 = Number(p3.price) + Number(p4.price);

  await prisma.order.create({
    data: {
      userId: user2.id,
      status: OrderStatus.PACKAGING,
      paymentStatus: PaymentStatus.SUCCESS,
      totalAmount: total3,
      items: {
        create: [
          { productId: p3.id, quantity: 1, unitPrice: p3.price },
          { productId: p4.id, quantity: 1, unitPrice: p4.price },
        ],
      },
    },
  });

  console.log("✓ Seeded sample orders for demo users.");
}

async function main() {
  try {
    const categoryMap = await seedCategories();
    const users = await seedUsers();
    const products = await seedProducts(categoryMap);
    await seedSampleOrders(users.user1, users.user2, products);
    console.log("\n🎉 Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
