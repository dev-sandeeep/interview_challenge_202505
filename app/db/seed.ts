import { db } from "./schema";
import { users, notes, favorites, type NewUser, type NewNote } from "./schema";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { faker } from "@faker-js/faker";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Test users data
const testUsers: NewUser[] = [
  { email: "john@example.com", password: "password123" },
  { email: "jane@example.com", password: "password456" },
  { email: "bob@example.com", password: "password789" },
];

// Function to generate a random date between 2024 and now
function getRandomDate(): Date {
  const start = new Date("2024-01-01").getTime();
  const end = new Date().getTime();
  return new Date(start + Math.random() * (end - start));
}

// Function to generate a note title
function generateNoteTitle(): string {
  // Randomly choose between different title types
  const titleTypes = [
    "short", // 2-3 words
    "medium", // 4-6 words
    "question", // Question format
    "action", // Starts with verb
  ];

  const type = faker.helpers.arrayElement(titleTypes);

  switch (type) {
    case "short":
      return faker.lorem.words({ min: 2, max: 3 });

    case "medium":
      return faker.lorem.words({ min: 4, max: 6 });

    case "question":
      return `${faker.helpers.arrayElement([
        "How to",
        "Why does",
        "What is",
        "When should",
      ])} ${faker.lorem.words({ min: 2, max: 4 })}?`;

    case "action":
      return `${faker.word.verb()} ${faker.lorem.words({ min: 2, max: 3 })}`;

    default:
      return faker.lorem.words(3);
  }
}

// Function to generate note content
function generateNoteContent(): string {
  // Randomly choose between different content types
  const contentTypes = [
    "short", // Single paragraph, few sentences
    "medium", // 2-3 paragraphs
    "long", // Many paragraphs
    "structured", // With sections and lists
  ];

  const type = faker.helpers.arrayElement(contentTypes);

  switch (type) {
    case "short":
      return faker.lorem.paragraph(faker.number.int({ min: 1, max: 3 }));

    case "medium":
      return faker.lorem.paragraphs(
        faker.number.int({ min: 2, max: 4 }),
        "\n\n"
      );

    case "long":
      return faker.lorem.paragraphs(
        faker.number.int({ min: 5, max: 10 }),
        "\n\n"
      );

    case "structured": {
      const sections = ["Overview", "Details", "Conclusion"];
      return sections
        .map(
          (section) =>
            `## ${section}\n\n${faker.lorem.paragraphs(
              faker.number.int({ min: 1, max: 3 }),
              "\n\n"
            )}`
        )
        .join("\n\n");
    }

    default:
      return faker.lorem.paragraphs(2, "\n\n");
  }
}

// Function to generate random notes for a user
function generateUserNotes(userId: number): NewNote[] {
  const notes: NewNote[] = [];
  const numNotes = 100; // Generate 100 notes per user

  for (let i = 1; i <= numNotes; i++) {
    notes.push({
      userId,
      title: generateNoteTitle(),
      description: generateNoteContent(),
      createdAt: getRandomDate(),
    });
  }

  return notes;
}

async function seed() {
  console.log("🌱 Starting seeding...");

  try {
    // Clear existing data in the correct order to respect foreign key constraints
    console.log("Clearing existing data...");
    await db.delete(favorites);  // Delete favorites first
    await db.delete(notes);      // Then delete notes
    await db.delete(users);      // Finally delete users

    // Insert test users
    console.log("Creating test users...");
    const createdUsers = await db.insert(users).values(testUsers).returning();

    // Generate and insert notes for each user
    console.log("Generating notes for users...");
    for (const user of createdUsers) {
      const userNotes = generateUserNotes(user.id);
      await db.insert(notes).values(userNotes);
      console.log(`Created ${userNotes.length} notes for user ${user.email}`);
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

// Run the seed function
seed()
  .catch((error) => {
    console.error("Failed to seed:", error);
    process.exit(1);
  })
  .finally(() => {
    // Close the database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.end();
  });
