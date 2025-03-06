import fs from 'fs/promises';
import path from 'path';
import {
  InsertUser, User, Folder, Passage, Vocabulary,
  Writing, Speaking, Feedback, Mood, Achievement, Comment
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJsonFile<T>(filename: string): Promise<T & { lastId: number }> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return { ...parsed, lastId: parsed.lastId || 0 };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { lastId: 0 } as T & { lastId: number };
    }
    throw error;
  }
}

async function writeJsonFile(filename: string, data: any): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  // Ensure lastId is always present
  const dataToWrite = {
    ...data,
    lastId: data.lastId || 0
  };
  await fs.writeFile(filePath, JSON.stringify(dataToWrite, null, 2));
}

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Folders
  createFolder(folder: Omit<Folder, "id">): Promise<Folder>;
  getFolders(userId: number, type: string): Promise<Folder[]>;

  // Passages
  createPassage(passage: Omit<Passage, "id" | "reactions">): Promise<Passage>;
  getPassages(folderId: number | null): Promise<Passage[]>; // Modified to accept null
  updatePassageReactions(id: number, reactions: Record<string, number>): Promise<void>;
  getPassageById(id: number): Promise<Passage | undefined>; // Added

  // Vocabulary
  createVocabulary(vocab: Omit<Vocabulary, "id" | "reactions">): Promise<Vocabulary>;
  getVocabulary(folderId: number): Promise<Vocabulary[]>;
  updateVocabularyReactions(id: number, reactions: Record<string, number>): Promise<void>;

  // Writing
  createWriting(writing: Omit<Writing, "id">): Promise<Writing>;
  getWriting(id: number): Promise<Writing | undefined>;
  getWritings(userId: number): Promise<Writing[]>;
  updateWritingReactions(id: number, reactions: Record<string, number>): Promise<void>;

  // Speaking
  createSpeaking(speaking: Omit<Speaking, "id">): Promise<Speaking>;
  getSpeaking(id: number): Promise<Speaking | undefined>;
  getSpeakings(userId: number): Promise<Speaking[]>;
  updateSpeakingReactions(id: number, reactions: Record<string, number>): Promise<void>;

  // Feedback
  createFeedback(feedback: Omit<Feedback, "id">): Promise<Feedback>;
  getFeedback(targetType: string, targetId: number): Promise<Feedback[]>;

  // Mood tracking
  createMood(mood: Omit<Mood, "id" | "timestamp">): Promise<Mood>;
  getMoods(userId: number, limit?: number): Promise<Mood[]>;

  // Add lesson storage interface
  createLesson(lesson: {
    userId: number;
    title: string;
    transcription: string;
    questions: any[];
    audioUrl: string | null;
  }): Promise<any>;
  getLesson(id: number): Promise<any>;
  getLessons(userId: number): Promise<any[]>;
  sessionStore: session.Store;

  // Achievement methods
  createAchievement(achievement: Omit<Achievement, "id" | "earnedAt">): Promise<Achievement>;
  getAchievements(userId: number): Promise<Achievement[]>;

  //Comment methods
  createComment(commentData: Omit<Comment, "id" | "createdAt">): Promise<Comment>;
  getComments(targetType: string, targetId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<void>;
  updateUserTelegramChannel(userId: number, channelId: string): Promise<void>; // Added
  isUserAdmin(userId: number): Promise<boolean>; // Added
  setUserAsAdmin(userId: number): Promise<void>; // Added
}

export class JsonFileStorage implements IStorage {
  sessionStore: session.Store;
  private currentId: number;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentId = 1;
    ensureDataDir();
  }

  private async getNextId(filename: string): Promise<number> {
    const data = await readJsonFile<{ lastId?: number }>(filename);
    const nextId = (data.lastId || 0) + 1;
    await writeJsonFile(filename, { ...data, lastId: nextId });
    return nextId;
  }

  async getUser(id: number): Promise<User | undefined> {
    const data = await readJsonFile<{ users: User[] }>("users.json");
    return data.users?.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const data = await readJsonFile<{ users: User[] }>("users.json");
    return data.users?.find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const data = await readJsonFile<{ users: User[] }>("users.json");
    const users = data.users || [];
    const id = await this.getNextId("users.json");

    const newUser = { ...userData, id };
    users.push(newUser);
    await writeJsonFile("users.json", { users, lastId: id });

    return newUser;
  }

  async createFolder(folder: Omit<Folder, "id">): Promise<Folder> {
    const data = await readJsonFile<{ folders: Folder[] }>("folders.json");
    const folders = data.folders || [];
    const id = await this.getNextId("folders.json");
    const newFolder = { ...folder, id };
    folders.push(newFolder);
    await writeJsonFile("folders.json", { folders, lastId: id });
    return newFolder;
  }

  async getFolders(userId: number, type: string): Promise<Folder[]> {
    const data = await readJsonFile<{ folders: Folder[] }>("folders.json");
    return (data.folders || []).filter(folder =>
      folder.type === type && (folder.userId === userId || folder.isPublic)
    );
  }


  async createPassage(passageData: Omit<Passage, "id" | "reactions">): Promise<Passage> {
    const data = await readJsonFile<{ passages: Passage[] }>("passages.json");
    const passages = data.passages || [];
    const id = await this.getNextId("passages.json");

    const newPassage = { ...passageData, id, reactions: {} };
    passages.push(newPassage);
    await writeJsonFile("passages.json", { passages, lastId: id });

    return newPassage;
  }

  async getPassages(folderId: number | null): Promise<Passage[]> {
    const data = await readJsonFile<{ passages: Passage[] }>("passages.json");
    if (folderId === null) {
      return (data.passages || []).filter(p => p.isPublic);
    }
    return (data.passages || []).filter(p => p.folderId === folderId);
  }

  async updatePassageReactions(id: number, reactions: Record<string, number>): Promise<void> {
    const data = await readJsonFile<{ passages: Passage[] }>("passages.json");
    const passages = data.passages || [];
    const index = passages.findIndex(p => p.id === id);

    if (index !== -1) {
      passages[index].reactions = reactions;
      await writeJsonFile("passages.json", { passages, lastId: data.lastId });
    }
  }

  async getPassageById(id: number): Promise<Passage | undefined> {
    const allPassages = await this.getPassages(null);
    return allPassages.find(p => p.id === id);
  }

  async createVocabulary(vocabData: Omit<Vocabulary, "id" | "reactions">): Promise<Vocabulary> {
    const data = await readJsonFile<{ vocabulary: Vocabulary[] }>("vocabulary.json");
    const vocabulary = data.vocabulary || [];
    const id = await this.getNextId("vocabulary.json");

    const newVocab = { ...vocabData, id, reactions: {} };
    vocabulary.push(newVocab);
    await writeJsonFile("vocabulary.json", { vocabulary, lastId: id });

    return newVocab;
  }

  async getVocabulary(folderId: number): Promise<Vocabulary[]> {
    const data = await readJsonFile<{ vocabulary: Vocabulary[] }>("vocabulary.json");
    return (data.vocabulary || []).filter(v => v.folderId === folderId || v.isPublic);
  }

  async updateVocabularyReactions(id: number, reactions: Record<string, number>): Promise<void> {
    const data = await readJsonFile<{ vocabulary: Vocabulary[] }>("vocabulary.json");
    const vocabulary = data.vocabulary || [];
    const index = vocabulary.findIndex(v => v.id === id);

    if (index !== -1) {
      vocabulary[index].reactions = reactions;
      await writeJsonFile("vocabulary.json", { vocabulary, lastId: data.lastId });
    }
  }

  async createWriting(writingData: Omit<Writing, "id">): Promise<Writing> {
    const data = await readJsonFile<{ writing: Writing[] }>("writing.json");
    const writings = data.writing || [];
    const id = await this.getNextId("writing.json");

    const newWriting = { ...writingData, id, reactions: {} };
    writings.push(newWriting);
    await writeJsonFile("writing.json", { writing: writings, lastId: id });

    return newWriting;
  }

  async getWriting(id: number): Promise<Writing | undefined> {
    const data = await readJsonFile<{ writing: Writing[] }>("writing.json");
    return data.writing?.find(w => w.id === id);
  }

  async getWritings(userId: number): Promise<Writing[]> {
    const data = await readJsonFile<{ writing: Writing[] }>("writing.json");
    return data.writing?.filter(w => w.userId === userId) || [];
  }

  async updateWritingReactions(id: number, reactions: Record<string, number>): Promise<void> {
    const data = await readJsonFile<{ writing: Writing[] }>("writing.json");
    const writings = data.writing || [];
    const index = writings.findIndex(w => w.id === id);

    if (index !== -1) {
      writings[index].reactions = reactions;
      await writeJsonFile("writing.json", { writing: writings, lastId: data.lastId });
    }
  }

  async createSpeaking(speakingData: Omit<Speaking, "id">): Promise<Speaking> {
    const data = await readJsonFile<{ speaking: Speaking[] }>("speaking.json");
    const speakings = data.speaking || [];
    const id = await this.getNextId("speaking.json");

    const newSpeaking = { ...speakingData, id, reactions: {} };
    speakings.push(newSpeaking);
    await writeJsonFile("speaking.json", { speaking: speakings, lastId: id });

    return newSpeaking;
  }

  async getSpeaking(id: number): Promise<Speaking | undefined> {
    const data = await readJsonFile<{ speaking: Speaking[] }>("speaking.json");
    return data.speaking?.find(s => s.id === id);
  }

  async getSpeakings(userId: number): Promise<Speaking[]> {
    const data = await readJsonFile<{ speaking: Speaking[] }>("speaking.json");
    return data.speaking?.filter(s => s.userId === userId) || [];
  }

  async updateSpeakingReactions(id: number, reactions: Record<string, number>): Promise<void> {
    const data = await readJsonFile<{ speaking: Speaking[] }>("speaking.json");
    const speakings = data.speaking || [];
    const index = speakings.findIndex(s => s.id === id);

    if (index !== -1) {
      speakings[index].reactions = reactions;
      await writeJsonFile("speaking.json", { speaking: speakings, lastId: data.lastId });
    }
  }

  async createFeedback(feedbackData: Omit<Feedback, "id">): Promise<Feedback> {
    const data = await readJsonFile<{ feedback: Feedback[] }>("feedback.json");
    const feedbacks = data.feedback || [];
    const id = await this.getNextId("feedback.json");

    const newFeedback = { ...feedbackData, id };
    feedbacks.push(newFeedback);
    await writeJsonFile("feedback.json", { feedback: feedbacks, lastId: id });

    return newFeedback;
  }

  async getFeedback(targetType: string, targetId: number): Promise<Feedback[]> {
    const data = await readJsonFile<{ feedback: Feedback[] }>("feedback.json");
    return data.feedback?.filter(f => f.targetType === targetType && f.targetId === targetId) || [];
  }

  async createMood(mood: Omit<Mood, "id" | "timestamp">): Promise<Mood> {
    const data = await readJsonFile<{ moods: Mood[] }>("moods.json");
    const moods = data.moods || [];
    const id = await this.getNextId("moods.json");
    const timestamp = new Date();
    const newMood = { ...mood, id, timestamp };
    moods.push(newMood);
    await writeJsonFile("moods.json", { moods, lastId: id });
    return newMood;
  }

  async getMoods(userId: number, limit = 30): Promise<Mood[]> {
    const data = await readJsonFile<{ moods: Mood[] }>("moods.json");
    return (data.moods || [])
      .filter(mood => mood.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createLesson(lesson: {
    userId: number;
    title: string;
    transcription: string;
    questions: any[];
    audioUrl: string | null;
  }): Promise<any> {
    const data = await readJsonFile<{ lessons: any[] }>("lessons.json");
    const lessons = data.lessons || [];
    const id = await this.getNextId("lessons.json");
    const newLesson = { ...lesson, id };
    lessons.push(newLesson);
    await writeJsonFile("lessons.json", { lessons, lastId: id });
    return newLesson;
  }

  async getLesson(id: number): Promise<any> {
    const data = await readJsonFile<{ lessons: any[] }>("lessons.json");
    return data.lessons?.find(lesson => lesson.id === id);
  }

  async getLessons(userId: number): Promise<any[]> {
    const data = await readJsonFile<{ lessons: any[] }>("lessons.json");
    return (data.lessons || []).filter(lesson => lesson.userId === userId);
  }

  async createAchievement(achievementData: Omit<Achievement, "id" | "earnedAt">): Promise<Achievement> {
    const data = await readJsonFile<{ achievements: Achievement[] }>("achievements.json");
    const achievements = data.achievements || [];
    const id = await this.getNextId("achievements.json");
    const earnedAt = new Date();

    const newAchievement = { ...achievementData, id, earnedAt };
    achievements.push(newAchievement);
    await writeJsonFile("achievements.json", { achievements, lastId: id });

    return newAchievement;
  }

  async getAchievements(userId: number): Promise<Achievement[]> {
    const data = await readJsonFile<{ achievements: Achievement[] }>("achievements.json");
    return (data.achievements || [])
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  }

  async createComment(commentData: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    try {
      const data = await readJsonFile<{ comments: Comment[] }>("comments.json");
      const comments = data.comments || [];
      const id = await this.getNextId("comments.json");
      const createdAt = new Date();

      const newComment = { ...commentData, id, createdAt };

      comments.push(newComment);
      await writeJsonFile("comments.json", { comments, lastId: id });

      return newComment;
    } catch (error) {
      throw error;
    }
  }

  async getComments(targetType: string, targetId: number): Promise<Comment[]> {
    try {
      const data = await readJsonFile<{ comments: Comment[] }>("comments.json");
      const filteredComments = (data.comments || [])
        .filter(comment => comment.targetType === targetType && comment.targetId === targetId)
        .map(comment => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return filteredComments;
    } catch (error) {
      throw error;
    }
  }

  async deleteComment(id: number): Promise<void> {
    const data = await readJsonFile<{ comments: Comment[] }>("comments.json");
    const comments = data.comments || [];
    const filteredComments = comments.filter(comment => comment.id !== id);
    await writeJsonFile("comments.json", { comments: filteredComments, lastId: data.lastId });
  }

  async updateUserTelegramChannel(userId: number, channelId: string): Promise<void> {
    const data = await readJsonFile<{ users: User[] }>("users.json");
    const users = data.users || [];
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex !== -1) {
      users[userIndex].telegramChannelId = channelId;
      await writeJsonFile("users.json", { users, lastId: data.lastId });
    }
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.isAdmin || false;
  }

  async setUserAsAdmin(userId: number): Promise<void> {
    const data = await readJsonFile<{ users: User[] }>("users.json");
    const users = data.users || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
      users[userIndex].isAdmin = true;
      await writeJsonFile("users.json", { users, lastId: data.lastId });
    }
  }
}

export const storage = new JsonFileStorage();