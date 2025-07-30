import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProductSchema, 
  insertUserAssignmentSchema, 
  insertPaymentLinkSchema,
  insertSystemUserSchema,
  updateUserStripeSchema,
  type SystemUser 
} from "@shared/schema";
import { z } from "zod";

// Helper function to create user-specific Stripe instance
function createUserStripe(stripeSecretKey: string): Stripe {
  return new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user's Stripe API keys
  app.put('/api/auth/stripe-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { stripeSecretKey, stripePublishableKey } = updateUserStripeSchema.parse(req.body);
      
      // Validate Stripe keys by making a test API call
      try {
        const testStripe = createUserStripe(stripeSecretKey);
        await testStripe.balance.retrieve(); // Simple API call to validate key
      } catch (stripeError) {
        return res.status(400).json({ 
          message: "Invalid Stripe secret key. Please check your key and try again." 
        });
      }

      const user = await storage.updateUserStripeKeys(userId, {
        stripeSecretKey,
        stripePublishableKey
      });
      
      // Return user without sensitive keys
      const { stripeSecretKey: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating Stripe keys:", error);
      res.status(500).json({ message: "Failed to update Stripe keys" });
    }
  });

  // Stats endpoint (protected)
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching stats: " + error.message });
    }
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    res.json({ message: "This is a protected route", userId });
  });

  // Products endpoints (protected)
  app.get("/api/products", isAuthenticated, async (req, res) => {
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

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/products", isAuthenticated, async (req, res) => {
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

  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting product: " + error.message });
    }
  });

  // File upload endpoints (protected)
  app.post("/api/upload/csv", isAuthenticated, upload.single("file"), async (req, res) => {
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

  app.post("/api/upload/ocr", isAuthenticated, upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const products = [];
      
      for (const file of files) {
        try {
          // Enhanced OCR processing for receipts
          const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng+chi_sim+chi_tra', {
            logger: info => console.log(`OCR Progress for ${file.originalname}:`, info),
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$€£¥₹₽¢.,- ()',
            tessedit_pageseg_mode: '6' // Uniform block of text
          });
          
          console.log(`OCR extracted text from ${file.originalname}:`, text);
          
          const lines = text.split('\n').filter(line => line.trim());
          const extractedProducts = [];
          
          // Enhanced receipt parsing logic
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.length < 3) continue;
            
            // Enhanced price patterns for receipts
            const pricePatterns = [
              /\$\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/,  // $123.45
              /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*\$/,  // 123.45$
              /€\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/,   // €123.45
              /£\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/,   // £123.45
              /¥\s*(\d{1,4}(?:,\d{3})*(?:\.\d{0,2})?)/,  // ¥123
              /(\d{1,4}(?:,\d{3})*\.\d{2})(?=\s*$)/     // 123.45 at end of line
            ];
            
            let priceMatch = null;
            let extractedPrice = null;
            
            for (const pattern of pricePatterns) {
              const match = line.match(pattern);
              if (match) {
                priceMatch = match[0];
                const numericMatch = priceMatch.match(/(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/);
                if (numericMatch) {
                  extractedPrice = parseFloat(numericMatch[1].replace(/,/g, ''));
                  break;
                }
              }
            }
            
            if (priceMatch && extractedPrice && extractedPrice > 0) {
              // Extract product name
              let productName = line.replace(priceMatch, '').trim();
              
              // Clean up common receipt artifacts
              productName = productName.replace(/^\d+\s*x?\s*/i, ''); // Remove quantity
              productName = productName.replace(/\s+/g, ' '); // Normalize spaces
              productName = productName.replace(/[^\w\s-]/g, ''); // Remove special chars
              
              // If name is empty, check nearby lines
              if (!productName || productName.length < 2) {
                // Check previous line
                if (i > 0) {
                  const prevLine = lines[i - 1].trim();
                  if (prevLine && !prevLine.match(/[\$€£¥₹₽¢\d]/) && prevLine.length > 2) {
                    productName = prevLine.replace(/[^\w\s-]/g, '').trim();
                  }
                }
                
                // Check next line if still no name
                if ((!productName || productName.length < 2) && i < lines.length - 1) {
                  const nextLine = lines[i + 1].trim();
                  if (nextLine && !nextLine.match(/[\$€£¥₹₽¢\d]/) && nextLine.length > 2) {
                    productName = nextLine.replace(/[^\w\s-]/g, '').trim();
                  }
                }
              }
              
              // Enhanced category detection
              let category = "General";
              if (productName) {
                const lowerName = productName.toLowerCase();
                if (lowerName.includes('shirt') || lowerName.includes('blouse') || lowerName.includes('top')) 
                  category = "Shirts";
                else if (lowerName.includes('pant') || lowerName.includes('jean') || lowerName.includes('trouser')) 
                  category = "Pants";
                else if (lowerName.includes('dress') || lowerName.includes('gown')) 
                  category = "Dresses";
                else if (lowerName.includes('shoe') || lowerName.includes('boot') || lowerName.includes('sneaker')) 
                  category = "Shoes";
                else if (lowerName.includes('bag') || lowerName.includes('purse') || lowerName.includes('wallet')) 
                  category = "Accessories";
                else if (lowerName.includes('jacket') || lowerName.includes('coat') || lowerName.includes('sweater')) 
                  category = "Outerwear";
                else if (lowerName.includes('hat') || lowerName.includes('cap') || lowerName.includes('scarf')) 
                  category = "Accessories";
                else if (lowerName.includes('sock') || lowerName.includes('underwear') || lowerName.includes('bra')) 
                  category = "Intimates";
                else 
                  category = "Clothing";
              }
              
              if (productName && productName.length > 1) {
                extractedProducts.push({
                  name: productName,
                  price: extractedPrice.toFixed(2),
                  category: category,
                  description: `Extracted from receipt: ${line.trim()}`
                });
              }
            }
          }
          
          // If no products found with enhanced patterns, try fallback method
          if (extractedProducts.length === 0) {
            let name = "";
            let price = "";
            let description = "";
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;
              
              // Fallback price patterns
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
              extractedProducts.push({
                name,
                price,
                category: "OCR Extracted",
                description: description || `Product extracted from ${file.originalname}`
              });
            }
          }
          
          // Add all extracted products
          for (const product of extractedProducts) {
            products.push({
              name: product.name,
              description: product.description,
              price: product.price,
              category: product.category,
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

  // User assignments endpoints (protected)
  app.get("/api/assignments", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getUserAssignments();
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching assignments: " + error.message });
    }
  });

  app.post("/api/assignments", isAuthenticated, async (req, res) => {
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

  app.delete("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteUserAssignment(req.params.id);
      res.json({ message: "Assignment deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting assignment: " + error.message });
    }
  });

  // Payment links endpoints (protected)
  app.get("/api/payment-links", isAuthenticated, async (req, res) => {
    try {
      const paymentLinks = await storage.getPaymentLinks();
      res.json(paymentLinks);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching payment links: " + error.message });
    }
  });

  app.post("/api/payment-links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSecretKey) {
        return res.status(400).json({ 
          message: "Stripe keys not configured. Please add your Stripe API keys in settings." 
        });
      }

      const stripe = createUserStripe(user.stripeSecretKey);

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

  app.put("/api/payment-links/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const paymentLink = await storage.updatePaymentLink(req.params.id, updates);
      res.json(paymentLink);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating payment link: " + error.message });
    }
  });

  app.delete("/api/payment-links/:id", isAuthenticated, async (req, res) => {
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

  // System Users endpoints (protected)
  app.get("/api/system-users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getSystemUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching users: " + error.message });
    }
  });

  app.post("/api/system-users", isAuthenticated, async (req, res) => {
    try {
      const userData = insertSystemUserSchema.parse(req.body);
      const user = await storage.createSystemUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating user: " + error.message });
    }
  });

  // User intake endpoints (protected)
  app.post("/api/users/upload-csv", isAuthenticated, upload.single('file'), async (req, res) => {
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
