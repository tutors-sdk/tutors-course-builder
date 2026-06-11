// Imports an existing Tutors course source folder (ZIP) into the builder model.
// This is the inverse of export.ts and tolerates the folder-name conventions
// used by tutors-publish courses (topic-*, unit-*, side-*, talk-*, book-*, ...).

import JSZip from "jszip"
import { parse } from "yaml"
import type {
  AnyLo,
  AssetRef,
  ContainerChild,
  Course,
  LabLo,
  LabStep,
  LoType,
  ResourceLo,
  SideLo,
  TopicLo,
  UnitLo,
} from "./types"
import { createCourse, uid } from "./defaults"
import { saveAsset } from "./assets"

export interface ImportResult {
  course: Course
  warnings: string[]
}

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp"]

const PREFIX_TO_TYPE: Record<string, Exclude<LoType, "course">> = {
  topic: "topic",
  unit: "unit",
  side: "side",
  talk: "talk",
  book: "lab",
  lab: "lab",
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

interface Entry {
  /** path relative to course root */
  path: string
  file: JSZip.JSZipObject
}

function mimeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    zip: "application/zip",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
  }
  return map[ext] ?? "application/octet-stream"
}

async function saveEntryAsset(entry: Entry): Promise<AssetRef> {
  const blob = await entry.file.async("blob")
  const name = entry.path.split("/").pop() ?? "file"
  return saveAsset(new File([blob], name, { type: mimeFor(name) }))
}

/** Extract the lo title from the first "# " heading; fall back to folder name */
function titleFrom(markdown: string, fallback: string): string {
  const m = markdown.match(/^#\s+(.+)$/m)
  return (m?.[1] ?? fallback).trim()
}

function folderTitleFallback(folderName: string): string {
  return folderName.replace(/^[a-z]+-?\d*-?/i, "").replace(/[-_]+/g, " ").trim() || folderName
}

function typeForFolder(folderName: string): Exclude<LoType, "course"> | undefined {
  const prefix = folderName.split(/[-.]/)[0]?.toLowerCase()
  return PREFIX_TO_TYPE[prefix]
}

/** Group entries under a directory into direct files and subfolders */
function partition(entries: Entry[], dir: string): { files: Entry[]; folders: Map<string, Entry[]> } {
  const files: Entry[] = []
  const folders = new Map<string, Entry[]>()
  const prefix = dir ? `${dir}/` : ""
  for (const e of entries) {
    if (!e.path.startsWith(prefix)) continue
    const rest = e.path.slice(prefix.length)
    if (!rest) continue
    const slash = rest.indexOf("/")
    if (slash === -1) {
      files.push(e)
    } else {
      const sub = rest.slice(0, slash)
      const list = folders.get(sub) ?? []
      list.push(e)
      folders.set(sub, list)
    }
  }
  return { files, folders }
}

function findFile(files: Entry[], pred: (name: string) => boolean): Entry | undefined {
  return files.find((e) => pred(e.path.split("/").pop()!.toLowerCase()))
}

function findImage(files: Entry[]): Entry | undefined {
  return findFile(files, (n) => IMAGE_EXTS.includes(n.split(".").pop() ?? ""))
}

function findMarkdown(files: Entry[], preferred: string[]): Entry | undefined {
  for (const p of preferred) {
    const hit = findFile(files, (n) => n === p)
    if (hit) return hit
  }
  return findFile(files, (n) => n.endsWith(".md") && !/^\d/.test(n))
}

async function text(entry: Entry | undefined): Promise<string> {
  return entry ? entry.file.async("string") : ""
}

// ---------- Lab parsing ----------

async function parseLab(folderName: string, files: Entry[], folders: Map<string, Entry[]>, warnings: string[]): Promise<LabLo> {
  // Step files are NN.Short.md (or NN-Short.md); sort numerically
  const stepEntries = files
    .filter((e) => {
      const n = e.path.split("/").pop()!
      return n.endsWith(".md") && /^\d/.test(n)
    })
    .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))

  const steps: LabStep[] = []
  for (const e of stepEntries) {
    const name = e.path.split("/").pop()!
    const short = name.replace(/^[\d]+[.-]?/, "").replace(/\.md$/i, "") || `Step${steps.length}`
    steps.push({ id: uid(), shortTitle: short, markdown: await e.file.async("string") })
  }

  const images: AssetRef[] = []
  const imgFolder = folders.get("img") ?? []
  for (const e of imgFolder) {
    const ext = e.path.split(".").pop()?.toLowerCase() ?? ""
    if (IMAGE_EXTS.includes(ext)) images.push(await saveEntryAsset(e))
  }

  const cardImage = findImage(files)
  const title = steps.length > 0 ? titleFrom(steps[0].markdown, folderTitleFallback(folderName)) : folderTitleFallback(folderName)
  if (steps.length === 0) warnings.push(`Lab "${folderName}" has no step files.`)

  return {
    id: uid(),
    type: "lab",
    title,
    markdown: "",
    image: cardImage ? await saveEntryAsset(cardImage) : undefined,
    steps,
    images,
  }
}

// ---------- Resource parsing ----------

async function parseResource(
  type: Exclude<LoType, "course" | "topic" | "unit" | "side" | "lab">,
  folderName: string,
  files: Entry[],
  folders: Map<string, Entry[]>,
): Promise<ResourceLo> {
  const md = findMarkdown(files, [`${type}.md`])
  const markdown = await text(md)
  const title = titleFrom(markdown, folderTitleFallback(folderName))
  const image = findImage(files)
  const base = {
    id: uid(),
    title,
    markdown,
    image: image ? await saveEntryAsset(image) : undefined,
  }

  switch (type) {
    case "talk":
    case "tutorial":
    case "paneltalk": {
      const pdf = findFile(files, (n) => n.endsWith(".pdf"))
      return { ...base, type, pdf: pdf ? await saveEntryAsset(pdf) : undefined }
    }
    case "web": {
      const url = (await text(findFile(files, (n) => n === "weburl"))).trim()
      return { ...base, type: "web", url: url || "https://" }
    }
    case "github": {
      const repoId = (await text(findFile(files, (n) => n === "githubid"))).trim()
      return { ...base, type: "github", repoId }
    }
    case "archive": {
      const archives = folders.get("archives") ?? []
      const zipEntry = archives[0] ?? findFile(files, (n) => n.endsWith(".zip"))
      return { ...base, type: "archive", zip: zipEntry ? await saveEntryAsset(zipEntry) : undefined }
    }
    case "panelvideo": {
      const videoId = (await text(findFile(files, (n) => n === "videoid"))).trim().split("\n")[0] ?? ""
      return { ...base, type: "panelvideo", videoId }
    }
    case "podcast": {
      const audioUrl = (await text(findFile(files, (n) => n === "audiourl"))).trim()
      const audio = findFile(files, (n) => /\.(mp3|m4a|wav)$/.test(n))
      return { ...base, type: "podcast", audioUrl, audio: audio ? await saveEntryAsset(audio) : undefined }
    }
    case "note":
    case "panelnote":
      return { ...base, type }
  }
}

// ---------- Container parsing ----------

async function parseFolder(
  folderName: string,
  entries: Entry[],
  dir: string,
  warnings: string[],
): Promise<AnyLo | undefined> {
  const type = typeForFolder(folderName)
  if (!type) {
    warnings.push(`Skipped unrecognised folder "${folderName}".`)
    return undefined
  }
  const { files, folders } = partition(entries, dir)

  if (type === "lab") return parseLab(folderName, files, folders, warnings)

  if (type === "topic" || type === "unit" || type === "side") {
    const md = findMarkdown(files, [type === "topic" ? "topic.md" : ""])
    const markdown = await text(md)
    const image = findImage(files)
    const children: AnyLo[] = []
    const sorted = [...folders.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    for (const sub of sorted) {
      if (sub === "img" || sub === "archives") continue
      const child = await parseFolder(sub, folders.get(sub)!, `${dir}/${sub}`, warnings)
      if (child) {
        if (type === "topic") children.push(child)
        else if (child.type !== "topic" && child.type !== "unit" && child.type !== "side") children.push(child)
        else warnings.push(`Ignored nested container "${sub}" inside ${type} "${folderName}".`)
      }
    }
    const base = {
      id: uid(),
      title: titleFrom(markdown, folderTitleFallback(folderName)),
      markdown,
      image: image ? await saveEntryAsset(image) : undefined,
    }
    if (type === "topic") return { ...base, type: "topic", children: children as ContainerChild[] } satisfies TopicLo
    if (type === "unit") return { ...base, type: "unit", children: children as ResourceLo[] } satisfies UnitLo
    return { ...base, type: "side", children: children as ResourceLo[] } satisfies SideLo
  }

  return parseResource(type, folderName, files, folders)
}

// ---------- Entry point ----------

export async function importCourseZip(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file)
  const warnings: string[] = []

  // Normalise: some ZIPs wrap everything in a single root folder
  let paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir && !p.startsWith("__MACOSX"))
  let root = ""
  const hasRootCourse = paths.some((p) => p.split("/").length === 1 && p.toLowerCase() === "course.md")
  if (!hasRootCourse) {
    const firstSegs = new Set(paths.map((p) => p.split("/")[0]))
    if (firstSegs.size === 1) {
      root = `${[...firstSegs][0]}/`
      paths = paths.filter((p) => p.startsWith(root))
    }
  }

  const entries: Entry[] = paths.map((p) => ({ path: p.slice(root.length), file: zip.files[p] }))
  const { files, folders } = partition(entries, "")

  const courseMd = findFile(files, (n) => n === "course.md")
  if (!courseMd) {
    throw new Error("Not a Tutors course: no course.md found at the ZIP root.")
  }

  const course = createCourse()
  course.markdown = await courseMd.file.async("string")
  course.title = titleFrom(course.markdown, "Imported Course")

  const courseImage = findImage(files)
  if (courseImage) course.image = await saveEntryAsset(courseImage)

  // properties.yaml
  const propsEntry = findFile(files, (n) => n === "properties.yaml" || n === "properties.yml")
  if (propsEntry) {
    try {
      const raw = parse(await propsEntry.file.async("string")) as Record<string, unknown> | null
      if (raw && typeof raw === "object") {
        const { credits, labStepsAutoNumber, iconset, ...rest } = raw
        if (typeof credits === "string") course.properties.credits = credits
        if (typeof labStepsAutoNumber === "boolean") course.properties.labStepsAutoNumber = labStepsAutoNumber
        if (typeof iconset === "string") course.properties.iconset = iconset
        course.properties.companions = Object.entries(rest)
          .filter(([, v]) => typeof v === "string" && /^https?:\/\//.test(v as string))
          .map(([key, url]) => ({ id: uid(), key, url: url as string }))
      }
    } catch {
      warnings.push("Could not parse properties.yaml — defaults applied.")
    }
  } else {
    warnings.push("No properties.yaml found — defaults applied.")
  }

  // Topics (and any stray containers) at root, ordered numerically
  const topics: TopicLo[] = []
  const sorted = [...folders.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  for (const sub of sorted) {
    const type = typeForFolder(sub)
    if (!type) {
      warnings.push(`Skipped unrecognised root folder "${sub}".`)
      continue
    }
    if (type !== "topic") {
      warnings.push(`Skipped root folder "${sub}" — only topics can sit at the course root.`)
      continue
    }
    const topic = await parseFolder(sub, folders.get(sub)!, sub, warnings)
    if (topic?.type === "topic") topics.push(topic)
  }
  if (topics.length === 0) warnings.push("No topic folders were found in the ZIP.")
  course.topics = topics
  course.updatedAt = Date.now()

  return { course, warnings }
}
