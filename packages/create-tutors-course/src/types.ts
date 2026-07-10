export interface ContentItem {
  type: "talk" | "lab" | "note";
  title: string;
  stepCount?: number;
}

export interface UnitConfig {
  title: string;
  items: ContentItem[];
}

export interface TopicConfig {
  title: string;
  units: UnitConfig[];
}

export interface WizardState {
  courseTitle: string;
  courseDescription: string;
  credits: string;
  topics: TopicConfig[];
  outputDirectory: string;
}
