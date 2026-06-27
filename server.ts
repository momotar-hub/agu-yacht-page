import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request bodies with larger limits for photos
  app.use(express.json({ limit: "20mb" }));

  // --- AUTH MIDDLEWARE ---
  // We use a clean and robust custom token authentication.
  // The token is simply the user_id (since this is an integrated internal portal).
  // The client sends the token in the 'Authorization' header as 'Bearer <userId>'.
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const user = db.getUserById(token);
    if (!user) {
      res.status(401).json({ error: "Unauthorized: Invalid session" });
      return;
    }
    // Attach user to request
    (req as any).user = user;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    requireAuth(req, res, () => {
      const user = (req as any).user;
      if (user.profile.role !== "Admin" && !user.profile.is_admin) {
        res.status(403).json({ error: "Access Denied: Admin role required" });
        return;
      }
      next();
    });
  };

  // --- API ROUTES ---

  // Auth Endpoints
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません。" });
      return;
    }

    // Return the user and their user_id as token
    res.json({
      token: user.id,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile
      }
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const user = db.getUserById(token);
    if (!user) {
      res.status(401).json({ error: "Session expired" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      profile: user.profile
    });
  });

  // User Profile Endpoints
  app.get("/api/profiles", requireAuth, (req, res) => {
    res.json(db.getProfiles());
  });

  app.get("/api/profiles/:userId", requireAuth, (req, res) => {
    const profiles = db.getProfiles();
    const profile = profiles.find(p => p.user_id === req.params.userId);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(profile);
  });

  app.put("/api/profiles/:userId", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      const updated = db.updateProfile(req.params.userId, requestingUserId, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.post("/api/profiles/:userId/badges", requireAdmin, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { badge } = req.body;
    if (!badge) {
      res.status(400).json({ error: "Badge name is required" });
      return;
    }
    try {
      const updated = db.adminAddBadge(req.params.userId, requestingUserId, badge);
      res.json(updated);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.delete("/api/profiles/:userId/badges", requireAdmin, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { badge } = req.body;
    if (!badge) {
      res.status(400).json({ error: "Badge name is required" });
      return;
    }
    try {
      const updated = db.adminRemoveBadge(req.params.userId, requestingUserId, badge);
      res.json(updated);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  // Admin User Creation & Deletion endpoints
  app.post("/api/admin/users", requireAdmin, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { email, name, password, role, grade, avatar, is_admin, role_display } = req.body;
    
    if (!email || !name || !role || !grade) {
      res.status(400).json({ error: "メールアドレス、氏名、役職、学年は必須です。" });
      return;
    }

    try {
      const newUser = db.adminCreateUser(requestingUserId, {
        email,
        name,
        passwordHash: password || "sailing",
        role,
        grade,
        avatar: avatar || "⛵",
        is_admin,
        role_display
      });
      res.status(201).json(newUser.profile);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/admin/users/:userId", requireAdmin, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      db.adminDeleteUser(requestingUserId, req.params.userId);
      res.json({ success: true, message: "部員を削除しました。" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Reflections (乗艇日誌) Endpoints
  app.get("/api/reflections", requireAuth, (req, res) => {
    res.json(db.getReflections());
  });

  app.get("/api/reflections/:id", requireAuth, (req, res) => {
    const ref = db.getReflectionById(req.params.id);
    if (!ref) {
      res.status(404).json({ error: "Reflection not found" });
      return;
    }
    res.json(ref);
  });

  app.post("/api/reflections", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { date, text, photos, weather, participating_members } = req.body;
    if (!date || !text || !weather || !participating_members || participating_members.length === 0) {
      res.status(400).json({ error: "Missing required fields: date, text, weather, participating_members are required" });
      return;
    }
    try {
      const created = db.createReflection(requestingUserId, {
        date,
        text,
        photos: photos || [],
        weather,
        participating_members
      });
      res.status(201).json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/reflections/:id", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      const updated = db.updateReflection(req.params.id, requestingUserId, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.delete("/api/reflections/:id", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      db.deleteReflection(req.params.id, requestingUserId);
      res.json({ success: true, message: "日誌を削除しました。" });
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  // Comments Endpoints
  app.get("/api/reflections/:id/comments", requireAuth, (req, res) => {
    res.json(db.getComments(req.params.id));
  });

  app.post("/api/reflections/:id/comments", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { text, parent_id } = req.body;
    if (!text) {
      res.status(400).json({ error: "Comment text is required" });
      return;
    }
    try {
      const comment = db.createComment(requestingUserId, req.params.id, text, parent_id || null);
      res.status(201).json(comment);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  app.delete("/api/comments/:id", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      db.deleteComment(req.params.id, requestingUserId);
      res.json({ success: true, message: "コメントを削除しました。" });
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  // Maintenance Endpoints
  app.get("/api/maintenance", requireAuth, (req, res) => {
    res.json(db.getMaintenanceRecords());
  });

  app.post("/api/maintenance", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { date_found, boat, location, cost, photos, notes, status } = req.body;
    if (!date_found || !boat || !location || !notes) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    try {
      const record = db.createMaintenanceRecord(requestingUserId, {
        date_found,
        boat,
        location,
        cost: cost || 0,
        photos: photos || [],
        notes,
        status: status || "Pending"
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/maintenance/:id", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      const updated = db.updateMaintenanceRecord(req.params.id, requestingUserId, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.delete("/api/maintenance/:id", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      db.deleteMaintenanceRecord(req.params.id, requestingUserId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  // Purchases Endpoints
  app.get("/api/purchases", requireAuth, (req, res) => {
    res.json(db.getPurchases());
  });

  app.post("/api/purchases", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { name, cost, category, date } = req.body;
    if (!name || cost === undefined || !category || !date) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    try {
      const record = db.createPurchase(requestingUserId, {
        name,
        cost,
        category,
        date
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/purchases/:id", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      const updated = db.updatePurchase(req.params.id, requestingUserId, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.delete("/api/purchases/:id", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      db.deletePurchase(req.params.id, requestingUserId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  // Documents (Wiki) Endpoints
  app.get("/api/documents", requireAuth, (req, res) => {
    res.json(db.getDocuments());
  });

  app.get("/api/documents/:id", requireAuth, (req, res) => {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(doc);
  });

  app.post("/api/documents", requireAdmin, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }
    try {
      const created = db.createDocument(requestingUserId, title, content);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.put("/api/documents/:id", requireAdmin, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }
    try {
      const updated = db.updateDocument(req.params.id, requestingUserId, title, content);
      res.json(updated);
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.delete("/api/documents/:id", requireAdmin, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      db.deleteDocument(req.params.id, requestingUserId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  // Notifications Endpoints
  app.get("/api/notifications", requireAuth, (req, res) => {
    const userId = ((req as any).user).id;
    res.json(db.getNotifications(userId));
  });

  app.put("/api/notifications/:id/read", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    try {
      db.markNotificationAsRead(req.params.id, requestingUserId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, (req, res) => {
    const requestingUserId = ((req as any).user).id;
    db.markAllNotificationsAsRead(requestingUserId);
    res.json({ success: true });
  });

  // --- REAL-TIME SERVER-SENT EVENTS (SSE) STREAM ---
  app.get("/api/events", (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).write("data: Error - missing token\n\n");
      res.end();
      return;
    }

    const user = db.getUserById(token);
    if (!user) {
      res.status(401).write("data: Error - unauthorized token\n\n");
      res.end();
      return;
    }

    // Set headers for Event Stream
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    // Write a heartbeat keepalive
    res.write("data: connected\n\n");

    const heartbeatInterval = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 30000);

    // Event listener callback
    const sseCallback = (eventData: any) => {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    // Register active listener
    db.addEventListener(user.id, sseCallback);

    // Clean up connections
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      db.removeEventListener(user.id, sseCallback);
    });
  });


  // --- VITE MIDDLEWARE OR STATIC SERVER ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
