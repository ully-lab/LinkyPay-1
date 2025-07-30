import { relations, sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token"),
  tokenExpiry: timestamp("token_expiry"),
  stripeSecretKey: varchar("stripe_secret_key"), // User's private Stripe secret key
  stripePublishableKey: varchar("stripe_publishable_key"), // User's Stripe publishable key
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  sku: text("sku"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAssignments = pgTable("user_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: text("assigned_by").notNull(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
});

export const paymentLinks = pgTable("payment_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").default("pending"), // pending, paid, expired, cancelled
  stripePaymentLinkId: text("stripe_payment_link_id"),
  stripePaymentLinkUrl: text("stripe_payment_link_url"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  productIds: jsonb("product_ids").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const systemUsers = pgTable("system_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  department: text("department"),
  role: text("role"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const uploadSessions = pgTable("upload_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // manual, csv, ocr, users-csv, users-ocr
  status: text("status").notNull(), // processing, completed, failed
  fileName: text("file_name"),
  totalProducts: text("total_products"),
  processedProducts: text("processed_products"),
  totalUsers: text("total_users"),
  processedUsers: text("processed_users"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(userAssignments),
  paymentLinks: many(paymentLinks),
}));

export const productsRelations = relations(products, ({ many }) => ({
  assignments: many(userAssignments),
}));

export const userAssignmentsRelations = relations(userAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userAssignments.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userAssignments.productId],
    references: [products.id],
  }),
}));

export const paymentLinksRelations = relations(paymentLinks, ({ one }) => ({
  user: one(users, {
    fields: [paymentLinks.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserStripeSchema = createInsertSchema(users).pick({
  stripeSecretKey: true,
  stripePublishableKey: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertUserAssignmentSchema = createInsertSchema(userAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertPaymentLinkSchema = createInsertSchema(paymentLinks).omit({
  id: true,
  createdAt: true,
  paidAt: true,
  stripePaymentLinkId: true,
  stripePaymentLinkUrl: true,
});

export const insertSystemUserSchema = createInsertSchema(systemUsers).omit({
  id: true,
  createdAt: true,
});

export const insertUploadSessionSchema = createInsertSchema(uploadSessions).omit({
  id: true,
  createdAt: true,
});

// Types  
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserStripe = z.infer<typeof updateUserStripeSchema>;

export type SystemUser = typeof systemUsers.$inferSelect;
export type InsertSystemUser = z.infer<typeof insertSystemUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type UserAssignment = typeof userAssignments.$inferSelect;
export type InsertUserAssignment = z.infer<typeof insertUserAssignmentSchema>;

export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;

export type UploadSession = typeof uploadSessions.$inferSelect;
export type InsertUploadSession = z.infer<typeof insertUploadSessionSchema>;
