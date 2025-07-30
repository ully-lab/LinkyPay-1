import { 
  users, products, userAssignments, paymentLinks, uploadSessions, systemUsers,
  type User, type InsertUser, type UpsertUser, type Product, type InsertProduct, 
  type UserAssignment, type InsertUserAssignment, type PaymentLink, 
  type InsertPaymentLink, type UploadSession, type InsertUploadSession,
  type SystemUser, type InsertSystemUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Users - Email authentication
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUserEmail(id: string): Promise<User>;
  updateUserStripeKeys(id: string, keys: { stripeSecretKey: string; stripePublishableKey: string }): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  createProducts(products: InsertProduct[]): Promise<Product[]>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string, category?: string): Promise<Product[]>;

  // User Assignments
  getUserAssignments(): Promise<(UserAssignment & { product: Product })[]>;
  getAssignmentsByUser(userEmail: string): Promise<(UserAssignment & { product: Product })[]>;
  createUserAssignment(assignment: InsertUserAssignment): Promise<UserAssignment>;
  createUserAssignments(assignments: InsertUserAssignment[]): Promise<UserAssignment[]>;
  deleteUserAssignment(id: string): Promise<void>;

  // Payment Links
  getPaymentLinks(): Promise<PaymentLink[]>;
  getPaymentLink(id: string): Promise<PaymentLink | undefined>;
  createPaymentLink(paymentLink: InsertPaymentLink): Promise<PaymentLink>;
  updatePaymentLink(id: string, updates: Partial<PaymentLink>): Promise<PaymentLink>;
  deletePaymentLink(id: string): Promise<void>;

  // System Users
  getSystemUsers(): Promise<SystemUser[]>;
  getSystemUser(id: string): Promise<SystemUser | undefined>;
  createSystemUser(user: InsertSystemUser): Promise<SystemUser>;
  createSystemUsers(users: InsertSystemUser[]): Promise<SystemUser[]>;
  updateSystemUser(id: string, user: Partial<InsertSystemUser>): Promise<SystemUser>;
  deleteSystemUser(id: string): Promise<void>;
  getSystemUserByEmail(email: string): Promise<SystemUser | undefined>;

  // Upload Sessions
  createUploadSession(session: InsertUploadSession): Promise<UploadSession>;
  updateUploadSession(id: string, updates: Partial<UploadSession>): Promise<UploadSession>;
  getUploadSession(id: string): Promise<UploadSession | undefined>;

  // Stats
  getStats(): Promise<{
    totalProducts: number;
    activeUsers: number;
    paymentLinks: number;
    revenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async verifyUserEmail(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        tokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStripeKeys(id: string, keys: { stripeSecretKey: string; stripePublishableKey: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeSecretKey: keys.stripeSecretKey,
        stripePublishableKey: keys.stripePublishableKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async createProducts(productsList: InsertProduct[]): Promise<Product[]> {
    return await db.insert(products).values(productsList).returning();
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    let whereClause = sql`LOWER(${products.name}) LIKE ${`%${query.toLowerCase()}%`} OR LOWER(${products.description}) LIKE ${`%${query.toLowerCase()}%`}`;
    
    if (category && category !== 'all') {
      whereClause = sql`(${whereClause}) AND ${products.category} = ${category}`;
    }

    return await db.select().from(products).where(whereClause).orderBy(desc(products.createdAt));
  }

  async getUserAssignments(): Promise<(UserAssignment & { product: Product })[]> {
    return await db
      .select()
      .from(userAssignments)
      .leftJoin(products, eq(userAssignments.productId, products.id))
      .orderBy(desc(userAssignments.assignedAt))
      .then(rows => rows.map(row => ({
        ...row.user_assignments,
        product: row.products!
      })));
  }

  async getAssignmentsByUser(userEmail: string): Promise<(UserAssignment & { product: Product })[]> {
    return await db
      .select()
      .from(userAssignments)
      .leftJoin(products, eq(userAssignments.productId, products.id))
      .where(eq(userAssignments.userEmail, userEmail))
      .orderBy(desc(userAssignments.assignedAt))
      .then(rows => rows.map(row => ({
        ...row.user_assignments,
        product: row.products!
      })));
  }

  async createUserAssignment(assignment: InsertUserAssignment): Promise<UserAssignment> {
    const [created] = await db.insert(userAssignments).values(assignment).returning();
    return created;
  }

  async createUserAssignments(assignments: InsertUserAssignment[]): Promise<UserAssignment[]> {
    return await db.insert(userAssignments).values(assignments).returning();
  }

  async deleteUserAssignment(id: string): Promise<void> {
    await db.delete(userAssignments).where(eq(userAssignments.id, id));
  }

  async getPaymentLinks(): Promise<PaymentLink[]> {
    return await db.select().from(paymentLinks).orderBy(desc(paymentLinks.createdAt));
  }

  async getPaymentLink(id: string): Promise<PaymentLink | undefined> {
    const [paymentLink] = await db.select().from(paymentLinks).where(eq(paymentLinks.id, id));
    return paymentLink || undefined;
  }

  async createPaymentLink(paymentLink: InsertPaymentLink): Promise<PaymentLink> {
    const [created] = await db.insert(paymentLinks).values({
      ...paymentLink,
      productIds: paymentLink.productIds as any
    }).returning();
    return created;
  }

  async updatePaymentLink(id: string, updates: Partial<PaymentLink>): Promise<PaymentLink> {
    const [updated] = await db
      .update(paymentLinks)
      .set(updates)
      .where(eq(paymentLinks.id, id))
      .returning();
    return updated;
  }

  async deletePaymentLink(id: string): Promise<void> {
    await db.delete(paymentLinks).where(eq(paymentLinks.id, id));
  }

  async createUploadSession(session: InsertUploadSession): Promise<UploadSession> {
    const [created] = await db.insert(uploadSessions).values(session).returning();
    return created;
  }

  async updateUploadSession(id: string, updates: Partial<UploadSession>): Promise<UploadSession> {
    const [updated] = await db
      .update(uploadSessions)
      .set(updates)
      .where(eq(uploadSessions.id, id))
      .returning();
    return updated;
  }

  async getUploadSession(id: string): Promise<UploadSession | undefined> {
    const [session] = await db.select().from(uploadSessions).where(eq(uploadSessions.id, id));
    return session || undefined;
  }

  // System Users Implementation
  async getSystemUsers(): Promise<SystemUser[]> {
    return await db.select().from(systemUsers).orderBy(desc(systemUsers.createdAt));
  }

  async getSystemUser(id: string): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user || undefined;
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    const [newUser] = await db.insert(systemUsers).values(user).returning();
    return newUser;
  }

  async createSystemUsers(users: InsertSystemUser[]): Promise<SystemUser[]> {
    const newUsers = await db.insert(systemUsers).values(users).returning();
    return newUsers;
  }

  async updateSystemUser(id: string, user: Partial<InsertSystemUser>): Promise<SystemUser> {
    const [updatedUser] = await db.update(systemUsers)
      .set(user)
      .where(eq(systemUsers.id, id))
      .returning();
    return updatedUser;
  }

  async deleteSystemUser(id: string): Promise<void> {
    await db.delete(systemUsers).where(eq(systemUsers.id, id));
  }

  async getSystemUserByEmail(email: string): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, email));
    return user || undefined;
  }

  async getStats(): Promise<{
    totalProducts: number;
    activeUsers: number;
    paymentLinks: number;
    revenue: number;
  }> {
    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [assignmentCount] = await db.select({ count: sql<number>`count(distinct ${userAssignments.userEmail})` }).from(userAssignments);
    const [paymentLinkCount] = await db.select({ count: sql<number>`count(*)` }).from(paymentLinks);
    const [revenueSum] = await db.select({ sum: sql<number>`coalesce(sum(${paymentLinks.amount}), 0)` }).from(paymentLinks).where(eq(paymentLinks.status, 'paid'));

    return {
      totalProducts: productCount.count || 0,
      activeUsers: assignmentCount.count || 0,
      paymentLinks: paymentLinkCount.count || 0,
      revenue: parseFloat(revenueSum.sum?.toString() || '0'),
    };
  }
}

export const storage = new DatabaseStorage();
