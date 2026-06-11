// Tutors learning-object model for the course builder.
// Mirrors the structure consumed by the Tutors Reader / tutors-publish toolchain.

export type LoType =
  | "course"
  | "topic"
  | "unit"
  | "side"
  | "talk"
  | "lab"
  | "note"
  | "web"
  | "github"
  | "archive"
  | "tutorial"
  | "panelvideo"
  | "paneltalk"
  | "panelnote"
  | "podcast"

/** Reference to a binary asset stored in IndexedDB */
export interface AssetRef {
  id: string
  name: string
  mimeType: string
  size: number
}

export interface LabStep {
  id: string
  /** Short title used in the filename, e.g. "01.Setup.md" -> "Setup" */
  shortTitle: string
  /** Markdown body; first # heading is the step title */
  markdown: string
}

interface BaseLo {
  id: string
  type: LoType
  title: string
  /** Markdown summary/body for the lo's .md file */
  markdown: string
  /** Card image (png/jpg) */
  image?: AssetRef
  hidden?: boolean
}

export interface TopicLo extends BaseLo {
  type: "topic"
  children: ContainerChild[]
}

export interface UnitLo extends BaseLo {
  type: "unit"
  children: ResourceLo[]
}

export interface SideLo extends BaseLo {
  type: "side"
  children: ResourceLo[]
}

export interface TalkLo extends BaseLo {
  type: "talk"
  pdf?: AssetRef
}

export interface TutorialLo extends BaseLo {
  type: "tutorial"
  pdf?: AssetRef
}

export interface PanelTalkLo extends BaseLo {
  type: "paneltalk"
  pdf?: AssetRef
}

export interface LabLo extends BaseLo {
  type: "lab"
  steps: LabStep[]
  /** Images referenced from steps, emitted into img/ */
  images: AssetRef[]
}

export interface NoteLo extends BaseLo {
  type: "note"
}

export interface PanelNoteLo extends BaseLo {
  type: "panelnote"
}

export interface WebLo extends BaseLo {
  type: "web"
  url: string
}

export interface GithubLo extends BaseLo {
  type: "github"
  /** e.g. "tutors-sdk/tutors" */
  repoId: string
}

export interface ArchiveLo extends BaseLo {
  type: "archive"
  zip?: AssetRef
}

export interface PanelVideoLo extends BaseLo {
  type: "panelvideo"
  /** YouTube video id */
  videoId: string
}

export interface PodcastLo extends BaseLo {
  type: "podcast"
  /** URL or uploaded audio */
  audioUrl: string
  audio?: AssetRef
}

/** Los that can live inside a topic, unit or side */
export type ResourceLo =
  | TalkLo
  | LabLo
  | NoteLo
  | WebLo
  | GithubLo
  | ArchiveLo
  | TutorialLo
  | PanelVideoLo
  | PanelTalkLo
  | PanelNoteLo
  | PodcastLo

/** Los that can be direct children of a topic */
export type ContainerChild = UnitLo | SideLo | ResourceLo

export type AnyLo = TopicLo | ContainerChild

export interface CompanionLink {
  id: string
  /** e.g. moodle, youtube, teams, zoom */
  key: string
  url: string
}

export interface CourseProperties {
  credits: string
  companions: CompanionLink[]
  labStepsAutoNumber: boolean
  iconset: string
}

export interface Course {
  id: string
  title: string
  markdown: string
  image?: AssetRef
  properties: CourseProperties
  topics: TopicLo[]
  updatedAt: number
}

export const RESOURCE_TYPES: LoType[] = [
  "talk",
  "lab",
  "note",
  "web",
  "github",
  "archive",
  "tutorial",
  "panelvideo",
  "paneltalk",
  "panelnote",
  "podcast",
]

export const LO_TYPE_LABELS: Record<LoType, string> = {
  course: "Course",
  topic: "Topic",
  unit: "Unit",
  side: "Side Unit",
  talk: "Talk",
  lab: "Lab",
  note: "Note",
  web: "Web Link",
  github: "GitHub",
  archive: "Archive",
  tutorial: "Tutorial",
  panelvideo: "Panel Video",
  paneltalk: "Panel Talk",
  panelnote: "Panel Note",
  podcast: "Podcast",
}

/** Folder prefix conventions used on export */
export const LO_FOLDER_PREFIX: Record<Exclude<LoType, "course">, string> = {
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
}
