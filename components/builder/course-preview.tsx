"use client"

// Reader-style course preview, modeled on jouwdan/next-js-tutors-reader:
// LoCard / CardGrid / UnitSection / TopBar / LabShell conventions, with
// in-pane navigation instead of Next.js routes.

import { ArrowUpRight, ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getAssetUrl } from "@/lib/course-builder/assets"
import { useCourse } from "@/lib/course-builder/store"
import { findLo } from "@/lib/course-builder/store"
import type { AnyLo, AssetRef, LabLo, TopicLo } from "@/lib/course-builder/types"
import { cn } from "@/lib/utils"
import { LO_COLORS, LO_ICONS, LO_META_LABELS } from "./lo-meta"
import { MarkdownPreview } from "./markdown-editor"

const EXTERNAL = new Set(["web", "github", "archive"])

// ---------- Preview navigation ----------

type Crumb = { title: string; id: string | null } // null = course home

function useAssetUrl(asset?: AssetRef): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    if (asset) {
      getAssetUrl(asset.id).then((u) => {
        if (!active) {
          if (u) URL.revokeObjectURL(u)
          return
        }
        objectUrl = u
        setUrl(u)
      })
    } else {
      setUrl(undefined)
    }
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [asset])
  return url
}

function loSummary(lo: AnyLo): string {
  const lines = lo.markdown.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"))
  return lines[0]?.trim() ?? ""
}

function externalUrl(lo: AnyLo): string | undefined {
  if (lo.type === "web" && lo.url && lo.url !== "https://") return lo.url
  if (lo.type === "github" && lo.repoId) return `https://github.com/${lo.repoId}`
  return undefined
}

// ---------- LoCard (reader style) ----------

function LoCard({ lo, onOpen }: { lo: AnyLo; onOpen: (lo: AnyLo) => void }) {
  const Icon = LO_ICONS[lo.type]
  const colors = LO_COLORS[lo.type]
  const imageUrl = useAssetUrl(lo.image)
  const external = EXTERNAL.has(lo.type) && !!externalUrl(lo)
  const title = (lo.title || "Untitled").trim()

  const inner = (
    <>
      {imageUrl ? (
        <div className="flex h-36 items-center justify-center overflow-hidden border-b border-border bg-muted/40 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl || "/placeholder.svg"} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center border-b border-border bg-muted/40">
          <Icon aria-hidden="true" className={cn("size-8 opacity-60", colors.text)} />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <Icon aria-hidden="true" className={cn("size-4 shrink-0", colors.text)} />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {LO_META_LABELS[lo.type]}
          </span>
          {external && <ArrowUpRight aria-hidden="true" className="ml-auto size-3.5 text-muted-foreground" />}
        </div>
        <h3 className="text-left font-medium leading-snug text-pretty">{title}</h3>
        {loSummary(lo) && (
          <p className="line-clamp-2 text-left text-sm leading-relaxed text-muted-foreground">{loSummary(lo)}</p>
        )}
      </div>
    </>
  )

  const className =
    "group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-foreground/30 hover:bg-muted/30"

  if (external) {
    return (
      <a href={externalUrl(lo)} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    )
  }
  return (
    <button type="button" onClick={() => onOpen(lo)} className={className}>
      {inner}
    </button>
  )
}

function CardGrid({ los, onOpen }: { los: AnyLo[]; onOpen: (lo: AnyLo) => void }) {
  if (los.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {los.map((lo) => (
        <LoCard key={lo.id} lo={lo} onOpen={onOpen} />
      ))}
    </div>
  )
}

function UnitSection({ title, los, onOpen }: { title: string; los: AnyLo[]; onOpen: (lo: AnyLo) => void }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title.trim()}</h2>
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <CardGrid los={los} onOpen={onOpen} />
    </section>
  )
}

// ---------- TopBar (reader style) ----------

function TopBar({
  crumbs,
  onNavigate,
  onEdit,
}: {
  crumbs: Crumb[]
  onNavigate: (index: number) => void
  onEdit?: () => void
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.id}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-border" />}
              {i === crumbs.length - 1 ? (
                <span className="truncate text-foreground" aria-current="page">
                  {crumb.title}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate(i)}
                  className="truncate transition-colors hover:text-foreground"
                >
                  {crumb.title}
                </button>
              )}
            </span>
          ))}
        </nav>
        {onEdit && (
          <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={onEdit}>
            <Pencil className="size-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
      </div>
    </header>
  )
}

// ---------- Lab shell (reader style) ----------

function LabView({ lab }: { lab: LabLo }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const steps = lab.steps
  const prev = activeIdx > 0 ? steps[activeIdx - 1] : undefined
  const next = activeIdx < steps.length - 1 ? steps[activeIdx + 1] : undefined

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === "ArrowLeft" && prev) setActiveIdx((i) => i - 1)
      if (e.key === "ArrowRight" && next) setActiveIdx((i) => i + 1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [prev, next])

  if (steps.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">This lab has no steps yet.</p>
  }
  const active = steps[Math.min(activeIdx, steps.length - 1)]

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-10 md:px-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav aria-label="Lab steps" className="flex flex-col gap-1">
          <h2 className="mb-2 px-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {lab.title.trim()}
          </h2>
          {steps.map((step, i) => {
            const isActive = i === activeIdx
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px]",
                    isActive ? "border-foreground/40 text-foreground" : "text-muted-foreground",
                  )}
                >
                  {i}
                </span>
                <span className="truncate">{step.shortTitle.trim()}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        <article>
          <MarkdownPreview markdown={active.markdown} />
        </article>
        <footer className="flex items-center justify-between border-t border-border pt-6">
          {prev ? (
            <button
              type="button"
              onClick={() => setActiveIdx((i) => i - 1)}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              {prev.shortTitle.trim()}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              type="button"
              onClick={() => setActiveIdx((i) => i + 1)}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {next.shortTitle.trim()}
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          ) : (
            <span />
          )}
        </footer>
      </div>
    </div>
  )
}

// ---------- Leaf lo pages ----------

function LoPageView({ lo }: { lo: AnyLo }) {
  const pdfUrl = useAssetUrl(lo.type === "talk" || lo.type === "tutorial" || lo.type === "paneltalk" ? lo.pdf : undefined)
  const audioUrl = useAssetUrl(lo.type === "podcast" ? lo.audio : undefined)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 md:px-6">
      {lo.type === "panelvideo" && lo.videoId && (
        <div className="aspect-video overflow-hidden rounded-lg border border-border">
          <iframe
            src={`https://www.youtube.com/embed/${lo.videoId}`}
            title={lo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      )}
      {pdfUrl && (
        <object data={pdfUrl} type="application/pdf" className="h-[70vh] w-full rounded-lg border border-border">
          <p className="p-4 text-sm text-muted-foreground">
            PDF preview unavailable —{" "}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">
              open the PDF
            </a>
            .
          </p>
        </object>
      )}
      {lo.type === "podcast" && (audioUrl || lo.audioUrl) && (
        <audio controls src={audioUrl ?? lo.audioUrl} className="w-full">
          Your browser does not support the audio element.
        </audio>
      )}
      <article>
        <MarkdownPreview markdown={lo.markdown} />
      </article>
    </div>
  )
}

// ---------- Topic page ----------

function TopicPage({ topic, onOpen }: { topic: TopicLo; onOpen: (lo: AnyLo) => void }) {
  const units = topic.children.filter((c) => c.type === "unit" || c.type === "side")
  const standalone = topic.children.filter((c) => c.type !== "unit" && c.type !== "side")

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 md:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-balance">{topic.title || "Untitled Topic"}</h1>
        {loSummary(topic) && <p className="text-muted-foreground">{loSummary(topic)}</p>}
      </header>
      {standalone.length > 0 && <CardGrid los={standalone} onOpen={onOpen} />}
      {units.map((unit) => (
        <UnitSection
          key={unit.id}
          title={unit.title || "Untitled Unit"}
          los={unit.type === "unit" || unit.type === "side" ? unit.children : []}
          onOpen={onOpen}
        />
      ))}
      {topic.children.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">This topic is empty.</p>
      )}
    </div>
  )
}

// ---------- Course home ----------

function CourseHome({ onOpen }: { onOpen: (lo: AnyLo) => void }) {
  const { course } = useCourse()
  const courseImage = useAssetUrl(course.image)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 md:px-6">
      <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        {courseImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={courseImage || "/placeholder.svg"} alt="" className="size-20 rounded-lg border border-border object-contain" />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
            {(course.title || "C").charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-balance">{course.title || "Untitled Course"}</h1>
          {course.properties.credits && (
            <p className="mt-1 text-sm text-muted-foreground">{course.properties.credits}</p>
          )}
        </div>
      </header>
      {course.topics.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No topics yet. Add a topic in the builder, or import an existing course.
        </p>
      ) : (
        <CardGrid los={course.topics} onOpen={onOpen} />
      )}
    </div>
  )
}

// ---------- Preview root ----------

export function CoursePreview({ onEditLo }: { onEditLo?: (id: string | null) => void }) {
  const { course } = useCourse()
  const [stack, setStack] = useState<Crumb[]>([])

  // Reset navigation if the course changes identity (new/sample/import)
  useEffect(() => {
    setStack([])
  }, [course.id])

  const crumbs: Crumb[] = [{ title: course.title || "Course", id: null }, ...stack]
  const current = stack.length > 0 ? stack[stack.length - 1] : undefined
  const currentLo = current?.id ? findLo(course, current.id) : undefined

  // If the lo behind the current crumb was deleted, pop back home
  useEffect(() => {
    if (current?.id && !currentLo) setStack([])
  }, [current, currentLo])

  function open(lo: AnyLo) {
    if (lo.type === "topic" || lo.type === "lab" || !EXTERNAL.has(lo.type)) {
      setStack((s) => [...s, { title: lo.title || "Untitled", id: lo.id }])
    }
  }

  function navigate(index: number) {
    setStack((s) => s.slice(0, index))
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <TopBar
        crumbs={crumbs}
        onNavigate={navigate}
        onEdit={onEditLo ? () => onEditLo(currentLo?.id ?? null) : undefined}
      />
      {!currentLo ? (
        <CourseHome onOpen={open} />
      ) : currentLo.type === "topic" ? (
        <TopicPage topic={currentLo} onOpen={open} />
      ) : currentLo.type === "lab" ? (
        <LabView lab={currentLo} />
      ) : (
        <LoPageView lo={currentLo} />
      )}
    </div>
  )
}
