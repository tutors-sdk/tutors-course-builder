import fs from "fs";
import path from "path";
import type { WizardState } from "./types.js";
import { slug, folderName } from "./naming.js";
import { createPlaceholderPng, PLACEHOLDER_PDF } from "./placeholder.js";
import * as t from "./templates.js";

export interface GenerationEvent {
  type: "file" | "directory";
  path: string;
  current: number;
  total: number;
}

function countFiles(state: WizardState): number {
  let count = 3; // course.md, course.png, properties.yaml
  for (const topic of state.topics) {
    count += 2; // topic.md, topic.png
    for (const unit of topic.units) {
      count += 1; // {slug}.md
      for (const item of unit.items) {
        switch (item.type) {
          case "talk":
            count += 3; // talk.md, talk.pdf, talk.png
            break;
          case "lab":
            count += 1 + (item.stepCount || 3) + 1; // intro + steps + card image
            break;
          case "note":
            count += 2; // note.md, note.png
            break;
        }
      }
    }
  }
  return count;
}

export async function* generateCourse(
  state: WizardState,
  outputDir: string
): AsyncGenerator<GenerationEvent> {
  const total = countFiles(state);
  let current = 0;

  const courseSlug = slug(state.courseTitle);
  const courseDir = path.join(outputDir, courseSlug);

  fs.mkdirSync(courseDir, { recursive: true });

  const emit = (filePath: string): GenerationEvent => {
    current++;
    return { type: "file", path: filePath, current, total };
  };

  const courseMdPath = path.join(courseDir, "course.md");
  fs.writeFileSync(courseMdPath, t.courseMarkdown(state.courseTitle, state.courseDescription));
  yield emit(courseMdPath);

  const coursePngPath = path.join(courseDir, "course.png");
  fs.writeFileSync(coursePngPath, createPlaceholderPng("course"));
  yield emit(coursePngPath);

  const propsPath = path.join(courseDir, "properties.yaml");
  fs.writeFileSync(propsPath, t.propertiesYaml(state.credits));
  yield emit(propsPath);

  for (let ti = 0; ti < state.topics.length; ti++) {
    const topic = state.topics[ti];
    const topicDir = path.join(courseDir, folderName("topic", ti, topic.title));
    fs.mkdirSync(topicDir, { recursive: true });

    const topicMdPath = path.join(topicDir, "topic.md");
    fs.writeFileSync(topicMdPath, t.topicMarkdown(topic.title));
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
      fs.writeFileSync(unitMdPath, t.unitMarkdown(unit.title));
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

            fs.writeFileSync(path.join(talkDir, "talk.md"), t.talkMarkdown(item.title));
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

            fs.writeFileSync(path.join(labDir, "00.Intro.md"), t.labIntroMarkdown(item.title));
            yield emit(path.join(labDir, "00.Intro.md"));

            for (let si = 1; si <= stepCount; si++) {
              const nn = String(si).padStart(2, "0");
              const stepPath = path.join(labDir, `${nn}.Step-${si}.md`);
              fs.writeFileSync(stepPath, t.labStepMarkdown(si));
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

            fs.writeFileSync(path.join(noteDir, "note.md"), t.noteMarkdown(item.title));
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
