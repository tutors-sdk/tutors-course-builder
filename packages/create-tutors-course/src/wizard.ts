import readline from "readline";
import path from "path";
import type { WizardState, TopicConfig, UnitConfig, ContentItem } from "./types.js";
import { generateCourse } from "./generate.js";
import { slug } from "./naming.js";

function ask(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

async function askNumber(rl: readline.Interface, question: string, min: number, max: number, defaultValue: number): Promise<number> {
  const raw = await ask(rl, `${question} [${min}-${max}]`, String(defaultValue));
  const n = parseInt(raw, 10);
  if (isNaN(n)) return defaultValue;
  return Math.max(min, Math.min(max, n));
}

export async function runWizard(outputDir: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n  create-tutors-course\n");
  console.log("  Step 1: Course Details");
  console.log("  ─────────────────────\n");

  const courseTitle = await ask(rl, "Course title") || "My Course";
  const courseDescription = await ask(rl, "Description") || "A new tutors course.";
  const credits = await ask(rl, "Credits / Author (optional)");

  console.log("\n  Step 2: Topics");
  console.log("  ──────────────\n");

  const topicCount = await askNumber(rl, "How many topics", 1, 20, 3);
  const topics: TopicConfig[] = [];

  for (let i = 0; i < topicCount; i++) {
    const title = await ask(rl, `Topic ${i + 1} title`) || `Topic ${i + 1}`;
    topics.push({ title, units: [] });
  }

  console.log("\n  Step 3: Content");
  console.log("  ───────────────\n");

  for (let ti = 0; ti < topics.length; ti++) {
    const topic = topics[ti];
    console.log(`  Configuring: ${topic.title}\n`);

    const unitCount = await askNumber(rl, "How many units", 1, 10, 1);

    for (let ui = 0; ui < unitCount; ui++) {
      const unitTitle = await ask(rl, `  Unit ${ui + 1} title`) || "Main Lesson";
      const items: ContentItem[] = [];

      const talkCount = await askNumber(rl, "  How many talks", 0, 10, 1);
      for (let k = 0; k < talkCount; k++) {
        const title = await ask(rl, `    Talk ${k + 1} title`) || `Talk ${k + 1}`;
        items.push({ type: "talk", title });
      }

      const labCount = await askNumber(rl, "  How many labs", 0, 10, 0);
      for (let k = 0; k < labCount; k++) {
        const title = await ask(rl, `    Lab ${k + 1} title`) || `Lab ${k + 1}`;
        const stepCount = await askNumber(rl, `    Steps for "${title}"`, 1, 20, 3);
        items.push({ type: "lab", title, stepCount });
      }

      const noteCount = await askNumber(rl, "  How many notes", 0, 10, 0);
      for (let k = 0; k < noteCount; k++) {
        const title = await ask(rl, `    Note ${k + 1} title`) || `Note ${k + 1}`;
        items.push({ type: "note", title });
      }

      topic.units.push({ title: unitTitle, items });
    }
    console.log();
  }

  console.log("  Step 4: Review");
  console.log("  ──────────────\n");
  console.log(`  Course: ${courseTitle}`);
  console.log(`  Description: ${courseDescription}`);
  if (credits) console.log(`  Credits: ${credits}`);

  let totalTalks = 0, totalLabs = 0, totalNotes = 0;
  for (const topic of topics) {
    console.log(`\n  Topic: ${topic.title}`);
    for (const unit of topic.units) {
      console.log(`    Unit: ${unit.title}`);
      for (const item of unit.items) {
        const extra = item.type === "lab" ? ` (${item.stepCount} steps)` : "";
        console.log(`      ${item.type}: ${item.title}${extra}`);
        if (item.type === "talk") totalTalks++;
        if (item.type === "lab") totalLabs++;
        if (item.type === "note") totalNotes++;
      }
    }
  }
  console.log(`\n  Totals: ${topics.length} topics, ${totalTalks} talks, ${totalLabs} labs, ${totalNotes} notes\n`);

  const confirm = await ask(rl, "Generate? (Y/n)", "Y");
  if (confirm.toLowerCase() === "n") {
    console.log("  Cancelled.");
    rl.close();
    return;
  }

  console.log("\n  Step 5: Generating...\n");

  const state: WizardState = {
    courseTitle,
    courseDescription,
    credits,
    topics,
    outputDirectory: outputDir,
  };

  const gen = generateCourse(state, outputDir);
  for await (const event of gen) {
    process.stdout.write(`\r  Creating files... ${event.current}/${event.total}`);
  }

  const outPath = path.join(outputDir, slug(courseTitle));
  console.log(`\n\n  Course generated: ${outPath}\n`);
  console.log("  Next steps:");
  console.log("    1. Edit the markdown files to add your content");
  console.log("    2. Replace placeholder images and PDFs");
  console.log("    3. Import into the Course Builder web app, or publish directly:");
  console.log(`    4. cd ${outPath}`);
  console.log("    5. npx tutors-publish\n");

  rl.close();
}
