"use client"

import { Eye, FilePlus2, GraduationCap, Pencil, Sparkles } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseProvider, useCourse } from "@/lib/course-builder/store"
import { CoursePreview } from "./course-preview"
import { CourseTree } from "./course-tree"
import { ExportDialog } from "./export-dialog"
import { LoEditor } from "./lo-editor"

function NewCourseButtons() {
  const { dispatch, setSelection } = useCourse()
  const [confirm, setConfirm] = useState<"new" | "sample" | null>(null)

  function apply() {
    if (confirm === "new") dispatch({ type: "new-course" })
    if (confirm === "sample") dispatch({ type: "sample-course" })
    setSelection({ kind: "course" })
    setConfirm(null)
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setConfirm("new")}>
        <FilePlus2 className="size-4" />
        <span className="hidden sm:inline">New</span>
      </Button>
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setConfirm("sample")}>
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Sample</span>
      </Button>
      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm === "new" ? "Start a new course?" : "Load the sample course?"}</DialogTitle>
            <DialogDescription>
              This replaces the course currently in the builder. Your current work will be lost unless you
              export it first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={apply}>{confirm === "new" ? "Start new course" : "Load sample"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Shell() {
  const [view, setView] = useState<"edit" | "preview">("edit")

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight">Tutors Course Builder</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Build a course for the Tutors Reader
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "edit" | "preview")}>
            <TabsList>
              <TabsTrigger value="edit" className="gap-1.5">
                <Pencil className="size-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="size-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <NewCourseButtons />
          <ExportDialog />
        </div>
      </header>

      {view === "edit" ? (
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
            <CourseTree />
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="md:hidden">
              <details className="border-b border-border bg-sidebar">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Course structure</summary>
                <div className="max-h-80 overflow-y-auto">
                  <CourseTree />
                </div>
              </details>
            </div>
            <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
              <LoEditor />
            </div>
          </main>
        </div>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4 md:p-8">
          <CoursePreview />
        </main>
      )}
    </div>
  )
}

export function Builder() {
  return (
    <CourseProvider>
      <Shell />
    </CourseProvider>
  )
}
