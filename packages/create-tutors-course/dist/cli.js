#!/usr/bin/env node

// src/wizard.ts
import readline from "readline";
import path2 from "path";

// src/generate.ts
import fs from "fs";
import path from "path";

// src/naming.ts
var LO_FOLDER_PREFIX = {
  topic: "topic",
  unit: "unit",
  side: "side",
  talk: "talk",
  lab: "book",
  note: "note",
  web: "web",
  github: "github",
  archive: "archive",
  tutorial: "tutorial",
  panelvideo: "panelvideo",
  paneltalk: "paneltalk",
  panelnote: "panelnote",
  podcast: "podcast"
};
function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "untitled";
}
function folderName(type, index, title) {
  const prefix = LO_FOLDER_PREFIX[type] || type;
  const nn = String(index + 1).padStart(2, "0");
  return `${prefix}-${nn}-${slug(title)}`;
}

// src/placeholder.ts
import { PNG } from "pngjs";
var COLORS = {
  course: { r: 100, g: 149, b: 237 },
  topic: { r: 144, g: 238, b: 144 },
  talk: { r: 255, g: 218, b: 185 },
  lab: { r: 221, g: 160, b: 221 },
  note: { r: 255, g: 255, b: 224 }
};
function createPlaceholderPng(type) {
  const color = COLORS[type] || COLORS.course;
  const width = 300;
  const height = 170;
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = width * y + x << 2;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}
var PLACEHOLDER_PDF = Buffer.from(
  "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
);

// src/templates.ts
import { stringify } from "yaml";
function courseMarkdown(title, description) {
  return `# ${title}

${description}
`;
}
function propertiesYaml(credits) {
  return stringify({
    credits: credits || "Course Author",
    labStepsAutoNumber: true
  });
}
function topicMarkdown(title) {
  return `# ${title}

Topic content and summary.
`;
}
function unitMarkdown(title) {
  return `# ${title}
`;
}
function talkMarkdown(title) {
  return `# ${title}

A short summary of the talk.
`;
}
function labIntroMarkdown(title) {
  return `# Objectives

${title} - practical exercises.
`;
}
function labStepMarkdown(stepNumber) {
  return `# Step ${stepNumber}

Step ${stepNumber} content goes here.
`;
}
function noteMarkdown(title) {
  return `# ${title}

Note content goes here.
`;
}

// src/generate.ts
function countFiles(state) {
  let count = 3;
  for (const topic of state.topics) {
    count += 2;
    for (const unit of topic.units) {
      count += 1;
      for (const item of unit.items) {
        switch (item.type) {
          case "talk":
            count += 3;
            break;
          case "lab":
            count += 1 + (item.stepCount || 3) + 1;
            break;
          case "note":
            count += 2;
            break;
        }
      }
    }
  }
  return count;
}
async function* generateCourse(state, outputDir2) {
  const total = countFiles(state);
  let current = 0;
  const courseSlug = slug(state.courseTitle);
  const courseDir = path.join(outputDir2, courseSlug);
  fs.mkdirSync(courseDir, { recursive: true });
  const emit = (filePath) => {
    current++;
    return { type: "file", path: filePath, current, total };
  };
  const courseMdPath = path.join(courseDir, "course.md");
  fs.writeFileSync(courseMdPath, courseMarkdown(state.courseTitle, state.courseDescription));
  yield emit(courseMdPath);
  const coursePngPath = path.join(courseDir, "course.png");
  fs.writeFileSync(coursePngPath, createPlaceholderPng("course"));
  yield emit(coursePngPath);
  const propsPath = path.join(courseDir, "properties.yaml");
  fs.writeFileSync(propsPath, propertiesYaml(state.credits));
  yield emit(propsPath);
  for (let ti = 0; ti < state.topics.length; ti++) {
    const topic = state.topics[ti];
    const topicDir = path.join(courseDir, folderName("topic", ti, topic.title));
    fs.mkdirSync(topicDir, { recursive: true });
    const topicMdPath = path.join(topicDir, "topic.md");
    fs.writeFileSync(topicMdPath, topicMarkdown(topic.title));
    yield emit(topicMdPath);
    const topicPngPath = path.join(topicDir, "topic.png");
    fs.writeFileSync(topicPngPath, createPlaceholderPng("topic"));
    yield emit(topicPngPath);
    for (let ui = 0; ui < topic.units.length; ui++) {
      const unit = topic.units[ui];
      const unitDir = path.join(topicDir, folderName("unit", ui, unit.title));
      fs.mkdirSync(unitDir, { recursive: true });
      const unitSlug = slug(unit.title);
      const unitMdPath = path.join(unitDir, `${unitSlug}.md`);
      fs.writeFileSync(unitMdPath, unitMarkdown(unit.title));
      yield emit(unitMdPath);
      let talkIndex = 0;
      let labIndex = 0;
      let noteIndex = 0;
      for (const item of unit.items) {
        switch (item.type) {
          case "talk": {
            const talkDir = path.join(unitDir, folderName("talk", talkIndex, item.title));
            fs.mkdirSync(talkDir, { recursive: true });
            talkIndex++;
            fs.writeFileSync(path.join(talkDir, "talk.md"), talkMarkdown(item.title));
            yield emit(path.join(talkDir, "talk.md"));
            fs.writeFileSync(path.join(talkDir, "talk.pdf"), PLACEHOLDER_PDF);
            yield emit(path.join(talkDir, "talk.pdf"));
            fs.writeFileSync(path.join(talkDir, "talk.png"), createPlaceholderPng("talk"));
            yield emit(path.join(talkDir, "talk.png"));
            break;
          }
          case "lab": {
            const labDir = path.join(unitDir, folderName("lab", labIndex, item.title));
            fs.mkdirSync(labDir, { recursive: true });
            labIndex++;
            const stepCount = item.stepCount || 3;
            fs.writeFileSync(path.join(labDir, "00.Intro.md"), labIntroMarkdown(item.title));
            yield emit(path.join(labDir, "00.Intro.md"));
            for (let si = 1; si <= stepCount; si++) {
              const nn = String(si).padStart(2, "0");
              const stepPath = path.join(labDir, `${nn}.Step-${si}.md`);
              fs.writeFileSync(stepPath, labStepMarkdown(si));
              yield emit(stepPath);
            }
            const imgDir = path.join(labDir, "img");
            fs.mkdirSync(imgDir, { recursive: true });
            const labSlug = slug(item.title);
            fs.writeFileSync(path.join(labDir, `${labSlug}.png`), createPlaceholderPng("lab"));
            yield emit(path.join(labDir, `${labSlug}.png`));
            break;
          }
          case "note": {
            const noteDir = path.join(unitDir, folderName("note", noteIndex, item.title));
            fs.mkdirSync(noteDir, { recursive: true });
            noteIndex++;
            fs.writeFileSync(path.join(noteDir, "note.md"), noteMarkdown(item.title));
            yield emit(path.join(noteDir, "note.md"));
            fs.writeFileSync(path.join(noteDir, "note.png"), createPlaceholderPng("note"));
            yield emit(path.join(noteDir, "note.png"));
            break;
          }
        }
      }
    }
  }
}

// src/wizard.ts
function ask(rl, question, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || "");
    });
  });
}
async function askNumber(rl, question, min, max, defaultValue) {
  const raw = await ask(rl, `${question} [${min}-${max}]`, String(defaultValue));
  const n = parseInt(raw, 10);
  if (isNaN(n)) return defaultValue;
  return Math.max(min, Math.min(max, n));
}
async function runWizard(outputDir2) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\n  create-tutors-course\n");
  console.log("  Step 1: Course Details");
  console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
  const courseTitle = await ask(rl, "Course title") || "My Course";
  const courseDescription = await ask(rl, "Description") || "A new tutors course.";
  const credits = await ask(rl, "Credits / Author (optional)");
  console.log("\n  Step 2: Topics");
  console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
  const topicCount = await askNumber(rl, "How many topics", 1, 20, 3);
  const topics = [];
  for (let i = 0; i < topicCount; i++) {
    const title = await ask(rl, `Topic ${i + 1} title`) || `Topic ${i + 1}`;
    topics.push({ title, units: [] });
  }
  console.log("\n  Step 3: Content");
  console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
  for (let ti = 0; ti < topics.length; ti++) {
    const topic = topics[ti];
    console.log(`  Configuring: ${topic.title}
`);
    const unitCount = await askNumber(rl, "How many units", 1, 10, 1);
    for (let ui = 0; ui < unitCount; ui++) {
      const unitTitle = await ask(rl, `  Unit ${ui + 1} title`) || "Main Lesson";
      const items = [];
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
  console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
  console.log(`  Course: ${courseTitle}`);
  console.log(`  Description: ${courseDescription}`);
  if (credits) console.log(`  Credits: ${credits}`);
  let totalTalks = 0, totalLabs = 0, totalNotes = 0;
  for (const topic of topics) {
    console.log(`
  Topic: ${topic.title}`);
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
  console.log(`
  Totals: ${topics.length} topics, ${totalTalks} talks, ${totalLabs} labs, ${totalNotes} notes
`);
  const confirm = await ask(rl, "Generate? (Y/n)", "Y");
  if (confirm.toLowerCase() === "n") {
    console.log("  Cancelled.");
    rl.close();
    return;
  }
  console.log("\n  Step 5: Generating...\n");
  const state = {
    courseTitle,
    courseDescription,
    credits,
    topics,
    outputDirectory: outputDir2
  };
  const gen = generateCourse(state, outputDir2);
  for await (const event of gen) {
    process.stdout.write(`\r  Creating files... ${event.current}/${event.total}`);
  }
  const outPath = path2.join(outputDir2, slug(courseTitle));
  console.log(`

  Course generated: ${outPath}
`);
  console.log("  Next steps:");
  console.log("    1. Edit the markdown files to add your content");
  console.log("    2. Replace placeholder images and PDFs");
  console.log("    3. Import into the Course Builder web app, or publish directly:");
  console.log(`    4. cd ${outPath}`);
  console.log("    5. npx tutors-publish\n");
  rl.close();
}

// src/cli.ts
var args = process.argv.slice(2);
var outputDirIndex = args.indexOf("--output-dir");
var outputDir = outputDirIndex !== -1 && args[outputDirIndex + 1] ? args[outputDirIndex + 1] : process.cwd();
await runWizard(outputDir);
