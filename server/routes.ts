import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertFolderSchema, insertPassageSchema, insertVocabularySchema,
         insertWritingSchema, insertSpeakingSchema, insertFeedbackSchema, insertMoodSchema, insertCommentSchema } from "@shared/schema";
import { insertUserSchema } from "@shared/schema"; // Import the user schema

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    next();
  };

  // Middleware to check admin status
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    const isAdmin = await storage.isUserAdmin(req.user!.id);
    if (!isAdmin) {
      return res.status(403).send("Forbidden: Admin access required");
    }
    next();
  };

  // Admin routes
  app.post("/api/admin/users/:userId/make-admin", requireAdmin, async (req, res) => {
    try {
      await storage.setUserAsAdmin(parseInt(req.params.userId));
      res.sendStatus(200);
    } catch (error) {
      res.status(500).send("Failed to set user as admin");
    }
  });

  // Modified folder routes to handle public/private
  app.post("/api/folders", requireAuth, async (req, res) => {
    const isAdmin = await storage.isUserAdmin(req.user!.id);

    const parsed = insertFolderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const folder = await storage.createFolder({
      ...parsed.data,
      userId: req.user!.id,
      isPublic: isAdmin ?? false, // Default value
    });
    res.status(201).json(folder);
  });

  // Folders
  app.get("/api/folders/:type", requireAuth, async (req, res) => {
    const folders = await storage.getFolders(req.user!.id, req.params.type);
    res.json(folders);
  });

  // Passages
  app.post("/api/passages", requireAuth, async (req, res) => {
    const parsed = insertPassageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const passage = await storage.createPassage({
      ...parsed.data,
      userId: req.user!.id,
      folderId: parsed.data.folderId ?? null,
      isPublic: parsed.data.isPublic ?? false,
    });
    res.status(201).json(passage);
  });

  app.get("/api/passages/:folderId", requireAuth, async (req, res) => {
    const passages = await storage.getPassages(parseInt(req.params.folderId));
    res.json(passages);
  });

  app.post("/api/passages/:id/reactions", requireAuth, async (req, res) => {
    await storage.updatePassageReactions(parseInt(req.params.id), req.body);
    res.sendStatus(200);
  });

  // Vocabulary
  app.post("/api/vocabulary", requireAuth, async (req, res) => {
    const parsed = insertVocabularySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const vocab = await storage.createVocabulary({
      ...parsed.data,
      userId: req.user!.id,
      folderId: parsed.data.folderId ?? null,
      isPublic: parsed.data.isPublic ?? false,
      example: parsed.data.example ?? null,
    });
    res.status(201).json(vocab);
  });

  app.get("/api/vocabulary/:folderId", requireAuth, async (req, res) => {
    const vocabulary = await storage.getVocabulary(parseInt(req.params.folderId));
    res.json(vocabulary);
  });

  app.post("/api/vocabulary/:id/reactions", requireAuth, async (req, res) => {
    try {
      const vocabId = parseInt(req.params.id);
      const reactions = req.body;

      await storage.updateVocabularyReactions(vocabId, reactions);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error updating vocabulary reactions:", error);
      res.status(500).json({ message: "Failed to update reactions" });
    }
  });

  // Writings
  app.post("/api/writings", requireAuth, async (req, res) => {
    const parsed = insertWritingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const writing = await storage.createWriting({
      ...parsed.data,
      userId: req.user!.id,
      isPublic: parsed.data.isPublic ?? false,
      reactions: {}, // Initialize empty reactions
    });
    res.status(201).json(writing);
  });

  app.get("/api/writings", requireAuth, async (req, res) => {
    const writings = await storage.getWritings(req.user!.id);
    res.json(writings);
  });

  app.post("/api/writings/:id/reactions", requireAuth, async (req, res) => {
    try {
      await storage.updateWritingReactions(parseInt(req.params.id), req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating writing reactions:", error);
      res.status(500).json({ error: "Failed to update reactions" });
    }
  });

  // Speaking
  app.post("/api/speaking", requireAuth, async (req, res) => {
    const parsed = insertSpeakingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const speaking = await storage.createSpeaking({
      ...parsed.data,
      userId: req.user!.id,
      isPublic: parsed.data.isPublic ?? false,
      reactions: {}, // Initialize empty reactions
    });
    res.status(201).json(speaking);
  });

  app.get("/api/speaking", requireAuth, async (req, res) => {
    const speaking = await storage.getSpeakings(req.user!.id);
    res.json(speaking);
  });

  app.post("/api/speaking/:id/reactions", requireAuth, async (req, res) => {
    try {
      await storage.updateSpeakingReactions(parseInt(req.params.id), req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating speaking reactions:", error);
      res.status(500).json({ error: "Failed to update reactions" });
    }
  });

  // Feedback
  app.post("/api/feedback", requireAuth, async (req, res) => {
    const parsed = insertFeedbackSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const feedback = await storage.createFeedback({
      ...parsed.data,
      userId: req.user!.id,
    });
    res.status(201).json(feedback);
  });

  app.get("/api/feedback/:targetType/:targetId", requireAuth, async (req, res) => {
    const feedback = await storage.getFeedback(
      req.params.targetType,
      parseInt(req.params.targetId)
    );
    res.json(feedback);
  });

  // Add mood tracking routes
  app.post("/api/moods", requireAuth, async (req, res) => {
    const parsed = insertMoodSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const mood = await storage.createMood({
      ...parsed.data,
      userId: req.user!.id,
    });
    res.status(201).json(mood);
  });

  app.get("/api/moods", requireAuth, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const moods = await storage.getMoods(req.user!.id, limit);
    res.json(moods);
  });

  // Add lessons route
  app.post("/api/lessons", requireAuth, async (req, res) => {
    try {
      const { title, transcription, questions, audioUrl } = req.body;

      // Parse questions if it's a string
      const parsedQuestions = typeof questions === 'string' ?
        JSON.parse(questions) : questions;

      // Store the lesson data
      const lesson = await storage.createLesson({
        userId: req.user!.id,
        title,
        transcription,
        questions: parsedQuestions,
        audioUrl
      });

      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error saving lesson:", error);
      res.status(500).json({ error: "Failed to save lesson" });
    }
  });

  // Add comment routes with better error handling
  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid comment data", details: parsed.error });
      }

      const comment = await storage.createComment({
        ...parsed.data,
        userId: req.user!.id,
        isPublic: parsed.data.isPublic ?? false,
      });
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.get("/api/comments/:targetType/:targetId", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getComments(
        req.params.targetType,
        parseInt(req.params.targetId)
      );
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Add registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid registration data" });
      }

      const { username, password } = result.data;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Create new user
      const user = await storage.createUser({ username, password });
      return res.status(201).json(user);
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Inside registerRoutes function, add the delete route
  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteComment(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Telegram integration routes
  app.post("/api/users/telegram-channel", requireAuth, async (req, res) => {
    const { channelId } = req.body;
    try {
      await storage.updateUserTelegramChannel(req.user!.id, channelId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error updating telegram channel:", error);
      res.status(500).json({ error: "Failed to update telegram channel" });
    }
  });

  app.post("/api/passages/:id/share", requireAuth, async (req, res) => {
    try {
      const passage = await storage.getPassageById(parseInt(req.params.id));
      if (!passage) {
        return res.status(404).json({ error: "Passage not found" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user?.telegramChannelId) {
        return res.status(400).json({ error: "No Telegram channel ID configured" });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const channelId = user.telegramChannelId;
      const message = `📚 *${passage.title}*\n\n${passage.content}\n\nShared from TOEFL Prep App`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message to Telegram');
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Error sharing to telegram:", error);
      res.status(500).json({ error: "Failed to share to Telegram" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}