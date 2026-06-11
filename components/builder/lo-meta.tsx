import type { LucideIcon } from "lucide-react"
import {
  Archive,
  BookOpen,
  FileText,
  FlaskConical,
  Folder,
  GitBranch,
  GraduationCap,
  Globe,
  Layers,
  Mic,
  MonitorPlay,
  PanelTop,
  Presentation,
  StickyNote,
  Video,
} from "lucide-react"
import type { LoType } from "@/lib/course-builder/types"

export const LO_ICONS: Record<LoType, LucideIcon> = {
  course: GraduationCap,
  topic: Folder,
  unit: Layers,
  side: PanelTop,
  talk: Presentation,
  lab: FlaskConical,
  note: StickyNote,
  web: Globe,
  github: GitBranch,
  archive: Archive,
  tutorial: BookOpen,
  panelvideo: Video,
  paneltalk: MonitorPlay,
  panelnote: FileText,
  podcast: Mic,
}

/** Short labels matching next-js-tutors-reader card conventions */
export const LO_META_LABELS: Record<LoType, string> = {
  course: "Course",
  topic: "Topic",
  unit: "Unit",
  side: "Unit",
  talk: "Talk",
  lab: "Lab",
  note: "Note",
  web: "Link",
  github: "Repo",
  archive: "Archive",
  tutorial: "Tutorial",
  panelvideo: "Video",
  paneltalk: "Talk",
  panelnote: "Note",
  podcast: "Podcast",
}

/** Tailwind classes for per-type accent colors (icon tint + card top border) */
export const LO_COLORS: Record<LoType, { text: string; bg: string; border: string }> = {
  course: { text: "text-primary", bg: "bg-primary/10", border: "border-primary" },
  topic: { text: "text-chart-1", bg: "bg-chart-1/10", border: "border-chart-1" },
  unit: { text: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2" },
  side: { text: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2" },
  talk: { text: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3" },
  lab: { text: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4" },
  note: { text: "text-chart-5", bg: "bg-chart-5/10", border: "border-chart-5" },
  web: { text: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2" },
  github: { text: "text-foreground", bg: "bg-muted", border: "border-foreground" },
  archive: { text: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3" },
  tutorial: { text: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4" },
  panelvideo: { text: "text-chart-5", bg: "bg-chart-5/10", border: "border-chart-5" },
  paneltalk: { text: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3" },
  panelnote: { text: "text-chart-1", bg: "bg-chart-1/10", border: "border-chart-1" },
  podcast: { text: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2" },
}
