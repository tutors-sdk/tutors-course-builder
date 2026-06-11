"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCourse, useSelectedLo } from "@/lib/course-builder/store"
import type { AnyLo } from "@/lib/course-builder/types"
import { LO_TYPE_LABELS } from "@/lib/course-builder/types"
import { cn } from "@/lib/utils"
import { AssetUpload } from "./asset-upload"
import { CourseEditor } from "./editors/course-editor"
import { LabEditor } from "./editors/lab-editor"
import { LO_COLORS, LO_ICONS } from "./lo-meta"
import { MarkdownEditor } from "./markdown-editor"

const MD_HINTS: Partial<Record<AnyLo["type"], string>> = {
  topic: "Summary shown on the topic card (topic.md).",
  unit: "Title card markdown for the unit.",
  side: "Title card markdown for the side unit.",
  talk: "Talk summary (talk.md), shown alongside the PDF.",
  note: "The full note content in markdown (note.md).",
  web: "Description of the linked resource (web.md).",
  github: "Description of the repository (github.md).",
  archive: "Description of the downloadable archive (archive.md).",
  tutorial: "Tutorial summary markdown.",
  panelnote: "Panel note content, rendered inline on the topic page.",
}

function GenericLoEditor({ lo }: { lo: AnyLo }) {
  const { dispatch } = useCourse()
  const update = (patch: Partial<AnyLo>) => dispatch({ type: "update-lo", id: lo.id, patch })

  const hasImage = lo.type !== "panelvideo" && lo.type !== "paneltalk" && lo.type !== "panelnote"

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{LO_TYPE_LABELS[lo.type]} Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lo-title">Title</Label>
            <Input
              id="lo-title"
              value={lo.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder={`${LO_TYPE_LABELS[lo.type]} title`}
            />
          </div>

          {lo.type === "web" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="lo-url">URL (weburl)</Label>
              <Input
                id="lo-url"
                type="url"
                value={lo.url}
                onChange={(e) => update({ url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          )}

          {lo.type === "github" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="lo-repo">Repository (githubid)</Label>
              <Input
                id="lo-repo"
                value={lo.repoId}
                onChange={(e) => update({ repoId: e.target.value })}
                placeholder="org/repository"
              />
            </div>
          )}

          {lo.type === "panelvideo" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="lo-video">YouTube video id (videoid)</Label>
              <Input
                id="lo-video"
                value={lo.videoId}
                onChange={(e) => update({ videoId: e.target.value })}
                placeholder="e.g. dQw4w9WgXcQ"
              />
            </div>
          )}

          {lo.type === "podcast" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="lo-audio">Audio URL</Label>
              <Input
                id="lo-audio"
                type="url"
                value={lo.audioUrl}
                onChange={(e) => update({ audioUrl: e.target.value })}
                placeholder="https://example.com/episode.mp3"
              />
              <span className="text-xs text-muted-foreground">Or upload an audio file below.</span>
              <AssetUpload
                label="Audio file"
                accept="audio/*"
                asset={lo.audio}
                onChange={(audio) => update({ audio })}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Content (markdown)</Label>
            {MD_HINTS[lo.type] && <p className="text-xs text-muted-foreground">{MD_HINTS[lo.type]}</p>}
            <MarkdownEditor
              value={lo.markdown}
              onChange={(markdown) => update({ markdown })}
              rows={lo.type === "note" || lo.type === "panelnote" ? 16 : 8}
              label={`${LO_TYPE_LABELS[lo.type]} markdown`}
            />
          </div>

          {(lo.type === "talk" || lo.type === "tutorial" || lo.type === "paneltalk") && (
            <AssetUpload
              label="PDF (slides)"
              accept="application/pdf"
              asset={lo.pdf}
              onChange={(pdf) => update({ pdf })}
            />
          )}

          {lo.type === "archive" && (
            <AssetUpload
              label="Archive file (.zip)"
              accept=".zip,application/zip"
              asset={lo.zip}
              onChange={(zip) => update({ zip })}
            />
          )}

          {hasImage && (
            <AssetUpload
              label="Card image"
              accept="image/*"
              asset={lo.image}
              imagePreview
              onChange={(image) => update({ image })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LoEditor() {
  const { selection } = useCourse()
  const lo = useSelectedLo()

  if (selection.kind === "course") {
    return <CourseEditor />
  }

  if (!lo) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Select an item in the course tree to edit it.
      </p>
    )
  }

  const Icon = LO_ICONS[lo.type]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-md", LO_COLORS[lo.type].bg)}>
          <Icon className={cn("size-5", LO_COLORS[lo.type].text)} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{lo.title || "Untitled"}</h2>
          <Badge variant="secondary" className="text-xs">
            {LO_TYPE_LABELS[lo.type]}
          </Badge>
        </div>
      </div>
      {lo.type === "lab" ? <LabEditor lab={lo} /> : <GenericLoEditor lo={lo} />}
    </div>
  )
}
