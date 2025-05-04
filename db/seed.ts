import { db } from "./index";
import { 
  users, 
  tags, 
  notes, 
  todoItems, 
  noteTags 
} from "@shared/schema";
import crypto from "crypto";

// Helper function to hash passwords
function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

async function seed() {
  try {
    console.log("🌱 Seeding database...");
    
    // Check if we already have data
    const existingUsers = await db.query.users.findMany();
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }
    
    // Create demo user
    const [demoUser] = await db.insert(users).values({
      username: "demo",
      password: hashPassword("demo123"),
      displayName: "Alex Morgan",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    }).returning();
    
    console.log(`Created demo user with id ${demoUser.id}`);
    
    // Create tags
    const tagsData = [
      { name: "Personal", color: "#10b981", userId: demoUser.id }, // green-500
      { name: "Work", color: "#3b82f6", userId: demoUser.id },     // blue-500
      { name: "Ideas", color: "#8b5cf6", userId: demoUser.id },    // purple-500
      { name: "Projects", color: "#f59e0b", userId: demoUser.id }, // yellow-500
      { name: "Meeting", color: "#6366f1", userId: demoUser.id },  // indigo-500
      { name: "Reading", color: "#f59e0b", userId: demoUser.id },  // yellow-500
      { name: "Important", color: "#ef4444", userId: demoUser.id }, // red-500
      { name: "Music", color: "#8b5cf6", userId: demoUser.id },     // purple-500
    ];
    
    const createdTags = await db.insert(tags).values(tagsData).returning();
    console.log(`Created ${createdTags.length} tags`);
    
    // Create a mapping for easy access to tag ids by name
    const tagMap = createdTags.reduce((acc, tag) => {
      acc[tag.name] = tag.id;
      return acc;
    }, {} as Record<string, number>);
    
    // Create notes
    const notesData = [
      {
        title: "Meeting Notes: Project Kickoff",
        content: "Meeting with the design team about the new project. Key points discussed:\n- Timeline: 6 weeks\n- Deliverables: Wireframes, UI Kit, Final Designs\n- Stakeholders: Marketing, Product, Engineering",
        type: "note",
        userId: demoUser.id,
        isFavorite: false,
        createdAt: new Date("2023-05-15"),
        updatedAt: new Date("2023-05-15"),
      },
      {
        title: "Book Recommendations",
        content: "Books to read this summer:\n1. Atomic Habits by James Clear\n2. The Design of Everyday Things\n3. Dune by Frank Herbert\n4. Project Hail Mary by Andy Weir",
        type: "note",
        userId: demoUser.id,
        isFavorite: true,
        createdAt: new Date("2023-05-28"),
        updatedAt: new Date("2023-05-28"),
      },
      {
        title: "Weekly Tasks",
        content: "Tasks for this week",
        type: "todo",
        userId: demoUser.id,
        isFavorite: false,
        createdAt: new Date("2023-06-02"),
        updatedAt: new Date("2023-06-02"),
      },
      {
        title: "Project Ideas",
        content: "New app concept: A music-inspired productivity tool that combines note-taking with music playback. The app would include spotify integration and visualization.",
        type: "note",
        userId: demoUser.id,
        isFavorite: false,
        createdAt: new Date("2023-06-10"),
        updatedAt: new Date("2023-06-10"),
      },
      {
        title: "Quick Note",
        content: "Call Sarah about the conference tickets. Deadline is this Friday!",
        type: "quick_note",
        userId: demoUser.id,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Music Playlist Ideas",
        content: "Focus playlist:\n- Lofi beats\n- Ambient piano\n- Minimal electronic\n- Film scores (no vocals)\n\nEvening wind-down:\n- Jazz classics\n- Acoustic covers",
        type: "note",
        userId: demoUser.id,
        isFavorite: false,
        createdAt: new Date("2023-06-08"),
        updatedAt: new Date("2023-06-08"),
      },
    ];
    
    // Insert notes
    const createdNotes = await db.insert(notes).values(notesData).returning();
    console.log(`Created ${createdNotes.length} notes`);
    
    // Create todo items for the Weekly Tasks note
    const todoNote = createdNotes.find(note => note.title === "Weekly Tasks");
    if (todoNote) {
      const todoItemsData = [
        { content: "Complete project proposal", isCompleted: true, noteId: todoNote.id },
        { content: "Schedule team meeting", isCompleted: false, noteId: todoNote.id },
        { content: "Review design mockups", isCompleted: false, noteId: todoNote.id },
        { content: "Update documentation", isCompleted: false, noteId: todoNote.id },
      ];
      
      await db.insert(todoItems).values(todoItemsData);
      console.log(`Created ${todoItemsData.length} todo items`);
    }
    
    // Create note-tag associations
    const noteTagAssociations = [
      { noteId: createdNotes[0].id, tagId: tagMap["Work"] },
      { noteId: createdNotes[0].id, tagId: tagMap["Meeting"] },
      { noteId: createdNotes[1].id, tagId: tagMap["Personal"] },
      { noteId: createdNotes[1].id, tagId: tagMap["Reading"] },
      { noteId: createdNotes[2].id, tagId: tagMap["Work"] },
      { noteId: createdNotes[3].id, tagId: tagMap["Ideas"] },
      { noteId: createdNotes[4].id, tagId: tagMap["Important"] },
      { noteId: createdNotes[5].id, tagId: tagMap["Personal"] },
      { noteId: createdNotes[5].id, tagId: tagMap["Music"] },
    ];
    
    await db.insert(noteTags).values(noteTagAssociations);
    console.log(`Created ${noteTagAssociations.length} note-tag associations`);
    
    console.log("✅ Seeding completed successfully");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  }
}

seed();
