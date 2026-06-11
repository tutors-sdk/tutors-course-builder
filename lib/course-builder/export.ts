// Exports a course as a ZIP of the canonical Tutors source folder structure,
// directly consumable by tutors-publish.

import JSZip from "jszip"
import { stringify } from "yaml"
import type { AnyLo, Course, LabLo, TopicLo } from "./types"
import { LO_FOLDER_PREFIX, LO_TYPE_LABELS } from "./types"
import { getAsset } from "./assets"

// ---------- Validation ----------

export interface ValidationIssue {
  level: "warning" | "error"
  message: string
}

export function validateCourse(course: Course): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!course.title.trim()) issues.push({ level: "error", message: "Course has no title." })
  if (!course.image) issues.push({ level: "warning", message: "Course has no card image — a placeholder will be used." })
  if (course.topics.length === 0) issues.push({ level: "error", message: "Course has no topics. Add at least one topic." })

  const walk = (lo: AnyLo, path: string) => {
    const label = `${LO_TYPE_LABELS[lo.type]} "${lo.title}"`
    const where = path ? ` (in ${path})` : ""
    if (!lo.title.trim()) issues.push({ level: "warning", message: `A ${lo.type} has an empty title${where}.` })
    if ((lo.type === "topic" || lo.type === "talk" || lo.type === "note" || lo.type === "web") && !lo.image) {
      issues.push({ level: "warning", message: `${label} has no card image — a placeholder will be used${where}.` })
    }
    switch (lo.type) {
      case "topic":
        if (lo.children.length === 0) issues.push({ level: "warning", message: `${label} is empty.` })
        lo.children.forEach((c) => walk(c, lo.title))
        break
      case "unit":
      case "side":
        if (lo.children.length === 0) issues.push({ level: "warning", message: `${label} is empty${where}.` })
        lo.children.forEach((c) => walk(c, `${path} > ${lo.title}`))
        break
      case "talk":
      case "tutorial":
      case "paneltalk":
        if (!lo.pdf) issues.push({ level: "warning", message: `${label} has no PDF uploaded${where}.` })
        break
      case "lab":
        if (lo.steps.length === 0) issues.push({ level: "warning", message: `${label} has no steps${where}.` })
        break
      case "web":
        if (!lo.url || lo.url === "https://") issues.push({ level: "warning", message: `${label} has no URL${where}.` })
        break
      case "github":
        if (!lo.repoId) issues.push({ level: "warning", message: `${label} has no repository id${where}.` })
        break
      case "archive":
        if (!lo.zip) issues.push({ level: "warning", message: `${label} has no archive file uploaded${where}.` })
        break
      case "panelvideo":
        if (!lo.videoId) issues.push({ level: "warning", message: `${label} has no video id${where}.` })
        break
      case "podcast":
        if (!lo.audioUrl && !lo.audio) issues.push({ level: "warning", message: `${label} has no audio${where}.` })
        break
    }
  }
  course.topics.forEach((t) => walk(t, ""))
  return issues
}

// ---------- Naming ----------

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "untitled"
  )
}

function folderName(lo: AnyLo, index: number): string {
  const prefix = LO_FOLDER_PREFIX[lo.type]
  const nn = String(index + 1).padStart(2, "0")
  return `${prefix}-${nn}-${slug(lo.title)}`
}

function imageExt(name: string, mimeType: string): string {
  const fromName = name.split(".").pop()?.toLowerCase()
  if (fromName && ["png", "jpg", "jpeg", "gif", "webp"].includes(fromName)) return fromName
  if (mimeType === "image/jpeg") return "jpg"
  if (mimeType === "image/gif") return "gif"
  if (mimeType === "image/webp") return "webp"
  return "png"
}

// ---------- Placeholder image ----------

let placeholderCache: Blob | null = null

async function placeholderImage(): Promise<Blob> {
  if (placeholderCache) return placeholderCache
  const canvas = document.createElement("canvas")
  canvas.width = 320
  canvas.height = 320
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#0f766e"
  ctx.fillRect(0, 0, 320, 320)
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 120px sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("T", 160, 160)
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"))
  placeholderCache = blob
  return blob
}

// ---------- Markdown helpers ----------

/** Ensure the markdown's first # heading matches the lo title */
function withTitle(markdown: string, title: string): string {
  const lines = markdown.split("\n")
  const headingIdx = lines.findIndex((l) => l.trim().startsWith("# "))
  if (headingIdx >= 0) {
    lines[headingIdx] = `# ${title}`
    return lines.join("\n")
  }
  return `# ${title}\n\n${markdown}`
}

// ---------- Emit ----------

async function addImage(zip: JSZip, folder: string, lo: AnyLo | Course, baseName: string): Promise<void> {
  if (lo.image) {
    const blob = await getAsset(lo.image.id)
    if (blob) {
      zip.file(`${folder}${baseName}.${imageExt(lo.image.name, lo.image.mimeType)}`, blob)
      return
    }
  }
  zip.file(`${folder}${baseName}.png`, await placeholderImage())
}

async function emitLab(zip: JSZip, folder: string, lab: LabLo): Promise<void> {
  for (let i = 0; i < lab.steps.length; i++) {
    const step = lab.steps[i]
    const nn = String(i).padStart(2, "0")
    const short = step.shortTitle.replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "") || `Step${i}`
    zip.file(`${folder}${nn}.${short}.md`, step.markdown)
  }
  await addImage(zip, folder, lab, slug(lab.title))
  for (const img of lab.images) {
    const blob = await getAsset(img.id)
    if (blob) zip.file(`${folder}img/${img.name}`, blob)
  }
}

async function emitLo(zip: JSZip, parentPath: string, lo: AnyLo, index: number): Promise<void> {
  const folder = `${parentPath}${folderName(lo, index)}/`
  const name = slug(lo.title)

  switch (lo.type) {
    case "topic": {
      zip.file(`${folder}topic.md`, withTitle(lo.markdown, lo.title))
      await addImage(zip, folder, lo, "topic")
      for (let i = 0; i < lo.children.length; i++) {
        await emitLo(zip, folder, lo.children[i], i)
      }
      break
    }
    case "unit":
    case "side": {
      zip.file(`${folder}${name}.md`, withTitle(lo.markdown, lo.title))
      for (let i = 0; i < lo.children.length; i++) {
        await emitLo(zip, folder, lo.children[i], i)
      }
      break
    }
    case "talk":
    case "tutorial":
    case "paneltalk": {
      zip.file(`${folder}${lo.type === "talk" ? "talk" : name}.md`, withTitle(lo.markdown, lo.title))
      await addImage(zip, folder, lo, lo.type === "talk" ? "talk" : name)
      if (lo.pdf) {
        const blob = await getAsset(lo.pdf.id)
        if (blob) zip.file(`${folder}${lo.type === "talk" ? "talk" : name}.pdf`, blob)
      }
      break
    }
    case "lab": {
      await emitLab(zip, folder, lo)
      break
    }
    case "note":
    case "panelnote": {
      zip.file(`${folder}${lo.type === "note" ? "note" : name}.md`, withTitle(lo.markdown, lo.title))
      await addImage(zip, folder, lo, lo.type === "note" ? "note" : name)
      break
    }
    case "web": {
      zip.file(`${folder}web.md`, withTitle(lo.markdown, lo.title))
      zip.file(`${folder}weburl`, lo.url)
      await addImage(zip, folder, lo, "web")
      break
    }
    case "github": {
      zip.file(`${folder}github.md`, withTitle(lo.markdown, lo.title))
      zip.file(`${folder}githubid`, lo.repoId)
      await addImage(zip, folder, lo, "github")
      break
    }
    case "archive": {
      zip.file(`${folder}archive.md`, withTitle(lo.markdown, lo.title))
      await addImage(zip, folder, lo, "archive")
      if (lo.zip) {
        const blob = await getAsset(lo.zip.id)
        if (blob) zip.file(`${folder}archives/${lo.zip.name}`, blob)
      }
      break
    }
    case "panelvideo": {
      zip.file(`${folder}${name}.md`, withTitle(lo.markdown, lo.title))
      zip.file(`${folder}videoid`, lo.videoId)
      break
    }
    case "podcast": {
      zip.file(`${folder}${name}.md`, withTitle(lo.markdown, lo.title))
      if (lo.audio) {
        const blob = await getAsset(lo.audio.id)
        if (blob) zip.file(`${folder}${lo.audio.name}`, blob)
      } else if (lo.audioUrl) {
        zip.file(`${folder}audiourl`, lo.audioUrl)
      }
      await addImage(zip, folder, lo, name)
      break
    }
  }
}

function buildPropertiesYaml(course: Course): string {
  const props: Record<string, unknown> = {
    credits: course.properties.credits,
  }
  for (const companion of course.properties.companions) {
    if (companion.key && companion.url) props[companion.key] = companion.url
  }
  props.labStepsAutoNumber = course.properties.labStepsAutoNumber
  return stringify(props)
}

export async function exportCourseZip(course: Course): Promise<Blob> {
  const zip = new JSZip()
  zip.file("course.md", withTitle(course.markdown, course.title))
  zip.file("properties.yaml", buildPropertiesYaml(course))
  await addImage(zip, "", course, "course")
  for (let i = 0; i < course.topics.length; i++) {
    await emitLo(zip, "", course.topics[i] as TopicLo, i)
  }
  return zip.generateAsync({ type: "blob" })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export { slug }
