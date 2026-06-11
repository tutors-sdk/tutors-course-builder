"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createLabStep } from "@/lib/course-builder/defaults"
import { deleteAsset, saveAsset } from "@/lib/course-builder/assets"
import { useCourse } from "@/lib/course-builder/store"
import type { AssetRef, LabLo, LabStep } from "@/lib/course-builder/types"
import { cn } from "@/lib/utils"
import { AssetUpload } from "../asset-upload"
import { MarkdownEditor } from "../markdown-editor"

export function LabEditor({ lab }: { lab: LabLo }) {
  const { dispatch } = useCourse()
  const [activeStepId, setActiveStepId] = useState<string | undefined>(lab.steps[0]?.id)
  const activeStep = lab.steps.find((s) => s.id === activeStepId) ?? lab.steps[0]

  function update(patch: Partial<LabLo>) {
    dispatch({ type: "update-lo", id: lab.id, patch })
  }

  function updateStep(stepId: string, patch: Partial<LabStep>) {
    update({ steps: lab.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) })
  }

  function addStep() {
    const step = createLabStep(lab.steps.length)
    update({ steps: [...lab.steps, step] })
    setActiveStepId(step.id)
  }

  function removeStep(stepId: string) {
    update({ steps: lab.steps.filter((s) => s.id !== stepId) })
    if (activeStepId === stepId) setActiveStepId(lab.steps.find((s) => s.id !== stepId)?.id)
  }

  function moveStep(stepId: string, direction: -1 | 1) {
    const idx = lab.steps.findIndex((s) => s.id === stepId)
    const target = idx + direction
    if (idx < 0 || target < 0 || target >= lab.steps.length) return
    const steps = [...lab.steps]
    const [item] = steps.splice(idx, 1)
    steps.splice(target, 0, item)
    update({ steps })
  }

  async function addLabImage(file: File | undefined) {
    if (!file) return
    const ref = await saveAsset(file)
    update({ images: [...lab.images, ref] })
  }

  async function removeLabImage(img: AssetRef) {
    await deleteAsset(img.id).catch(() => {})
    update({ images: lab.images.filter((i) => i.id !== img.id) })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Lab Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lab-title">Title</Label>
            <Input
              id="lab-title"
              value={lab.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Lab title"
            />
          </div>
          <AssetUpload
            label="Card image"
            accept="image/*"
            asset={lab.image}
            imagePreview
            onChange={(image) => update({ image })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Steps</CardTitle>
          <Button variant="outline" size="sm" className="gap-1 bg-transparent" onClick={addStep}>
            <Plus className="size-3.5" />
            Add step
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-col gap-1 lg:w-56 lg:shrink-0" role="list" aria-label="Lab steps">
              {lab.steps.map((step, i) => (
                <div
                  key={step.id}
                  role="listitem"
                  className={cn(
                    "group/step flex items-center gap-1 rounded-md border px-2 py-1.5",
                    activeStep?.id === step.id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-transparent hover:bg-muted",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveStepId(step.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                  >
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {String(i).padStart(2, "0")}
                    </Badge>
                    <span className="truncate">{step.shortTitle}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 group-hover/step:opacity-100"
                    aria-label="Move step up"
                    onClick={() => moveStep(step.id, -1)}
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 group-hover/step:opacity-100"
                    aria-label="Move step down"
                    onClick={() => moveStep(step.id, 1)}
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 group-hover/step:opacity-100"
                    aria-label="Delete step"
                    onClick={() => removeStep(step.id)}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              ))}
              {lab.steps.length === 0 && (
                <p className="px-2 py-4 text-sm text-muted-foreground">No steps yet. Add the first one.</p>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {activeStep ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="step-short-title">Step short title (used in filename)</Label>
                    <Input
                      id="step-short-title"
                      value={activeStep.shortTitle}
                      onChange={(e) => updateStep(activeStep.id, { shortTitle: e.target.value })}
                      placeholder="e.g. Setup"
                      className="max-w-xs"
                    />
                  </div>
                  <MarkdownEditor
                    value={activeStep.markdown}
                    onChange={(markdown) => updateStep(activeStep.id, { markdown })}
                    rows={16}
                    label={`Markdown for step ${activeStep.shortTitle}`}
                  />
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Select a step to edit it.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step Images (img/)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Upload images referenced from step markdown as <code className="rounded bg-muted px-1 font-mono text-xs">img/filename.png</code>
          </p>
          <input
            type="file"
            accept="image/*"
            aria-label="Upload step image"
            onChange={(e) => {
              addLabImage(e.target.files?.[0])
              e.target.value = ""
            }}
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          {lab.images.length > 0 && (
            <ul className="flex flex-col gap-1">
              {lab.images.map((img) => (
                <li key={img.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5">
                  <code className="truncate font-mono text-xs">img/{img.name}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label={`Remove ${img.name}`}
                    onClick={() => removeLabImage(img)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
