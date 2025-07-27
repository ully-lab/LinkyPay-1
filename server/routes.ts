import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";
import Stripe from "stripe";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertUserAssignmentSchema, 
  insertPaymentLinkSchema,
  insertSystemUserSchema,
  type SystemUser 
} from "@shared/schema";
import { z } from "zod";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
}) : null;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching stats: " + error.message });
    }
  });

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category } = req.query;
      let products;
      
      if (search || category) {
        products = await storage.searchProducts(
          search as string || '', 
          category as string
        );
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching products: " + error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching product: " + error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating product: " + error.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, updates);
      res.json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating product: " + error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting product: " + error.message });
    }
  });

  // File upload endpoints
  app.post("/api/upload/csv", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const products = data.map((row: any) => ({
        name: row.name || row.Name || row.产品名称 || "",
        description: row.description || row.Description || row.描述 || "",
        price: parseFloat(row.price || row.Price || row.价格 || "0").toString(),
        category: row.category || row.Category || row.类别 || "uncategorized",
        sku: row.sku || row.SKU || row.货号 || "",
        imageUrl: row.imageUrl || row.image_url || row.图片链接 || "",
      })).filter(product => product.name && product.price);

      const validProducts = products.filter(product => {
        try {
          insertProductSchema.parse(product);
          return true;
        } catch {
          return false;
        }
      });

      if (validProducts.length === 0) {
        return res.status(400).json({ message: "No valid products found in file" });
      }

      const createdProducts = await storage.createProducts(validProducts);
      res.json({ 
        message: `Successfully imported ${createdProducts.length} products`,
        products: createdProducts 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error processing CSV file: " + error.message });
    }
  });

  app.post("/api/upload/ocr", upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const products = [];
      
      for (const file of files) {
        try {
          const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng+chi_sim');
          
          // Simple text extraction logic - this could be enhanced with AI/ML
          const lines = text.split('\n').filter(line => line.trim());
          
          // Try to extract product information
          let name = "";
          let price = "";
          let description = "";
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for price patterns
            const priceMatch = trimmedLine.match(/[\$¥€£]?(\d+[.,]\d{2})/);
            if (priceMatch && !price) {
              price = priceMatch[1].replace(',', '.');
            }
            
            // Use first substantial line as name if not set
            if (!name && trimmedLine.length > 3 && !priceMatch) {
              name = trimmedLine;
            }
            
            // Collect other lines as description
            if (trimmedLine !== name && !priceMatch && trimmedLine.length > 5) {
              description += (description ? ' ' : '') + trimmedLine;
            }
          }
          
          if (name && price) {
            products.push({
              name,
              description: description || `Product extracted from ${file.originalname}`,
              price,
              category: "ocr-extracted",
              sku: "",
              imageUrl: "",
            });
          }
        } catch (ocrError) {
          console.error(`OCR error for file ${file.originalname}:`, ocrError);
        }
      }

      if (products.length === 0) {
        return res.status(400).json({ message: "No products could be extracted from the images" });
      }

      const createdProducts = await storage.createProducts(products);
      res.json({ 
        message: `Successfully extracted and created ${createdProducts.length} products from OCR`,
        products: createdProducts 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error processing OCR files: " + error.message });
    }
  });

  // User assignments endpoints
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getUserAssignments();
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching assignments: " + error.message });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const { userEmail, userName, productIds, assignedBy } = req.body;
      
      if (!userEmail || !userName || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const assignments = productIds.map(productId => ({
        userId: null, // We're not requiring user registration
        productId,
        userEmail,
        userName,
        assignedBy: assignedBy || "system",
      }));

      const created = await storage.createUserAssignments(assignments);
      res.json({ 
        message: `Successfully assigned ${created.length} products to ${userName}`,
        assignments: created 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating assignments: " + error.message });
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      await storage.deleteUserAssignment(req.params.id);
      res.json({ message: "Assignment deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting assignment: " + error.message });
    }
  });

  // Payment links endpoints
  app.get("/api/payment-links", async (req, res) => {
    try {
      const paymentLinks = await storage.getPaymentLinks();
      res.json(paymentLinks);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching payment links: " + error.message });
    }
  });

  app.post("/api/payment-links", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." });
      }

      const { userEmail, userName, productIds, currency = "usd", dueDate, notes } = req.body;
      
      if (!userEmail || !userName || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get products to calculate total amount
      const products = [];
      let totalAmount = 0;
      
      for (const productId of productIds) {
        const product = await storage.getProduct(productId);
        if (product) {
          products.push(product);
          totalAmount += parseFloat(product.price);
        }
      }

      if (products.length === 0) {
        return res.status(400).json({ message: "No valid products found" });
      }

      // Create Stripe payment link
      const lineItems = products.map(product => ({
        price_data: {
          currency: currency,
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.imageUrl ? [product.imageUrl] : undefined,
          },
          unit_amount: Math.round(parseFloat(product.price) * 100), // Convert to cents
        },
        quantity: 1,
      }));

      const paymentLink = await stripe.paymentLinks.create({
        line_items: lineItems,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'CN'],
        },
      });

      // Save to database
      const created = await storage.createPaymentLink({
        userId: null,
        userEmail,
        userName,
        amount: totalAmount.toString(),
        currency,
        status: "pending",
        stripePaymentLinkId: paymentLink.id,
        stripePaymentLinkUrl: paymentLink.url,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        productIds,
      });

      res.json({
        message: "Payment link created successfully",
        paymentLink: created,
        stripeUrl: paymentLink.url,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment link: " + error.message });
    }
  });

  app.put("/api/payment-links/:id", async (req, res) => {
    try {
      const updates = req.body;
      const paymentLink = await storage.updatePaymentLink(req.params.id, updates);
      res.json(paymentLink);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating payment link: " + error.message });
    }
  });

  app.delete("/api/payment-links/:id", async (req, res) => {
    try {
      await storage.deletePaymentLink(req.params.id);
      res.json({ message: "Payment link deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting payment link: " + error.message });
    }
  });

  // Stripe webhook for payment status updates
  app.post("/api/webhook/stripe", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const event = req.body;

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Find and update payment link status
        const paymentLinks = await storage.getPaymentLinks();
        const paymentLink = paymentLinks.find(pl => 
          pl.stripePaymentLinkId && session.payment_link === pl.stripePaymentLinkId
        );
        
        if (paymentLink) {
          await storage.updatePaymentLink(paymentLink.id, {
            status: 'paid',
            paidAt: new Date(),
          });
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error processing webhook: " + error.message });
    }
  });

  // System Users endpoints
  app.get("/api/system-users", async (req, res) => {
    try {
      const users = await storage.getSystemUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching users: " + error.message });
    }
  });

  app.post("/api/system-users", async (req, res) => {
    try {
      const userData = insertSystemUserSchema.parse(req.body);
      const user = await storage.createSystemUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating user: " + error.message });
    }
  });

  // User intake endpoints
  app.post("/api/users/upload-csv", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const users = data.map((row: any) => ({
        name: row.name || row.Name || row.NAME || '',
        email: row.email || row.Email || row.EMAIL || '',
        phone: row.phone || row.Phone || row.PHONE || '',
        department: row.department || row.Department || row.DEPARTMENT || '',
        role: row.role || row.Role || row.ROLE || '',
        notes: row.notes || row.Notes || row.NOTES || ''
      })).filter(user => user.name && user.email);

      const createdUsers = await storage.createSystemUsers(users);
      res.json({ 
        message: `Successfully imported ${createdUsers.length} users`,
        users: createdUsers
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error uploading CSV: " + error.message });
    }
  });

  app.post("/api/users/upload-photo", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Process image with OCR
      const result = await Tesseract.recognize(req.file.buffer, 'eng+chi_sim+chi_tra', {
        logger: m => console.log(m)
      });

      const text = result.data.text;
      
      // Extract user information from OCR text
      const lines = text.split('\n').filter(line => line.trim());
      const users = [];
      
      let currentUser: any = {};
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Detect email patterns
        const emailMatch = trimmedLine.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          if (currentUser.email) {
            // Save previous user and start new one
            if (currentUser.name && currentUser.email) {
              users.push(currentUser);
            }
            currentUser = {};
          }
          currentUser.email = emailMatch[0];
        }
        
        // Detect phone patterns
        const phoneMatch = trimmedLine.match(/[\+]?[1-9]?[\d\s\-\(\)]{8,15}/);
        if (phoneMatch && !currentUser.phone) {
          currentUser.phone = phoneMatch[0].replace(/\s+/g, '');
        }
        
        // If line contains email, the text before it might be the name
        if (emailMatch) {
          const nameText = trimmedLine.substring(0, trimmedLine.indexOf(emailMatch[0])).trim();
          if (nameText && !currentUser.name) {
            currentUser.name = nameText;
          }
        }
        
        // If no email but looks like a name (contains spaces or capital letters)
        if (!emailMatch && !phoneMatch && trimmedLine.length > 2 && !currentUser.name) {
          if (/[A-Z]/.test(trimmedLine) || trimmedLine.includes(' ')) {
            currentUser.name = trimmedLine;
          }
        }
      }
      
      // Add the last user
      if (currentUser.name && currentUser.email) {
        users.push(currentUser);
      }
      
      // Create users in database
      const validUsers = users.filter(user => user.name && user.email);
      const createdUsers = validUsers.length > 0 ? await storage.createSystemUsers(validUsers) : [];
      
      res.json({
        message: `Successfully extracted ${createdUsers.length} users from image`,
        extractedText: text,
        users: createdUsers
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error processing image: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
