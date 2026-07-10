// Canonical source: lib/course-builder/types.ts — keep in sync
const LO_FOLDER_PREFIX: Record<string, string> = {
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
  podcast: "podcast",
};

// Canonical source: lib/course-builder/export.ts — keep in sync
export function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "untitled"
  );
}

export function folderName(type: string, index: number, title: string): string {
  const prefix = LO_FOLDER_PREFIX[type] || type;
  const nn = String(index + 1).padStart(2, "0");
  return `${prefix}-${nn}-${slug(title)}`;
}
