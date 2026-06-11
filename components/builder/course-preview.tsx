"use client"

import { useEffect, useState } from "react"
import { getAssetUrl } from "@/lib/course-builder/assets"
import { useCourse } from "@/lib/course-builder/store"
import type { AnyLo, AssetRef, TopicLo } from "@/lib/course-builder/types"
import { LO_TYPE_LABELS } from "@/lib/course-builder/types"
import { cn } from "@/lib/utils"
import { LO_COLORS, LO_ICONS } from "./lo-meta"
import { MarkdownPreview } from "./markdown-editor"

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

function LoCard({ lo, onSelect }: { lo: AnyLo; onSelect: (id: string) => void }) {
  const Icon = LO_ICONS[lo.type]
  const colors = LO_COLORS[lo.type]
  const imageUrl = useAssetUrl(lo.image)

  return (
    <button
      type="button"
      onClick={() => onSelect(lo.id)}
      className={cn(
        "flex w-44 flex-col items-center gap-2 rounded-lg border border-border border-t-4 bg-card p-4 text-center shadow-sm transition-shadow hover:shadow-md",
        colors.border,
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {LO_TYPE_LABELS[lo.type]}
      </span>
      <span className="line-clamp-2 min-h-10 text-sm font-semibold text-balance">{lo.title || "Untitled"}</span>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl || "/placeholder.svg"} alt="" className="size-20 rounded-md object-cover" />
      ) : (
        <span className={cn("flex size-20 items-center justify-center rounded-md", colors.bg)}>
          <Icon className={cn("size-9", colors.text)} />
        </span>
      )}
      <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{loSummary(lo)}</span>
    </button>
  )
}

function TopicSection({ topic, onSelect }: { topic: TopicLo; onSelect: (id: string) => void }) {
  const units = topic.children.filter((c) => c.type === "unit" || c.type === "side")
  const resources = topic.children.filter((c) => c.type !== "unit" && c.type !== "side")

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => onSelect(topic.id)}
        className="w-fit text-left text-lg font-semibold hover:text-primary"
      >
        {topic.title || "Untitled Topic"}
      </button>
      {resources.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {resources.map((lo) => (
            <LoCard key={lo.id} lo={lo} onSelect={onSelect} />
          ))}
        </div>
      )}
      {units.map((unit) => (
        <div key={unit.id} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
          <button
            type="button"
            onClick={() => onSelect(unit.id)}
            className="w-fit text-left text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            {unit.title || "Untitled Unit"}
            {unit.type === "side" && <span className="ml-2 text-xs font-normal">(side unit)</span>}
          </button>
          <div className="flex flex-wrap gap-3">
            {(unit.type === "unit" || unit.type === "side") &&
              unit.children.map((lo) => <LoCard key={lo.id} lo={lo} onSelect={onSelect} />)}
          </div>
        </div>
      ))}
    </section>
  )
}

export function CoursePreview() {
  const { course, setSelection } = useCourse()
  const courseImage = useAssetUrl(course.image)
  const onSelect = (id: string) => setSelection({ kind: "lo", id })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
        {courseImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={courseImage || "/placeholder.svg"} alt="" className="size-20 rounded-lg object-cover" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
            {(course.title || "C").charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-balance">{course.title || "Untitled Course"}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <MarkdownPreview
              markdown={course.markdown.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n").trim()}
            />
          </div>
        </div>
      </header>
      {course.topics.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No topics yet. Add a topic in the builder to see it here.
        </p>
      ) : (
        course.topics.map((topic) => <TopicSection key={topic.id} topic={topic} onSelect={onSelect} />)
      )}
    </div>
  )
}
