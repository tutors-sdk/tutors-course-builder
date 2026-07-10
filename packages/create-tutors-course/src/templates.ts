import { stringify } from "yaml";

export function courseMarkdown(title: string, description: string): string {
  return `# ${title}\n\n${description}\n`;
}

export function propertiesYaml(credits: string): string {
  return stringify({
    credits: credits || "Course Author",
    labStepsAutoNumber: true,
  });
}

export function topicMarkdown(title: string): string {
  return `# ${title}\n\nTopic content and summary.\n`;
}

export function unitMarkdown(title: string): string {
  return `# ${title}\n`;
}

export function talkMarkdown(title: string): string {
  return `# ${title}\n\nA short summary of the talk.\n`;
}

export function labIntroMarkdown(title: string): string {
  return `# Objectives\n\n${title} - practical exercises.\n`;
}

export function labStepMarkdown(stepNumber: number): string {
  return `# Step ${stepNumber}\n\nStep ${stepNumber} content goes here.\n`;
}

export function noteMarkdown(title: string): string {
  return `# ${title}\n\nNote content goes here.\n`;
}
