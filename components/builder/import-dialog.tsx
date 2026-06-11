"use client"

import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { importCourseZip, type ImportResult } from "@/lib/course-builder/import"
import { useCourse } from "@/lib/course-builder/store"

type Phase =
  | { kind: "idle" }
  | { kind: "importing" }
  | { kind: "done"; result: ImportResult }
  | { kind: "error"; message: string }

export function ImportDialog() {
  const { dispatch, setSelection } = useCourse()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const inputRef = useRef<HTMLInputElement>(null)

  async function onFile(file: File) {
    setPhase({ kind: "importing" })
    try {
      const result = await importCourseZip(file)
      setPhase({ kind: "done", result })
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "Could not read the ZIP file." })
    }
  }

  function apply(result: ImportResult) {
    dispatch({ type: "load", course: result.course })
    setSelection({ kind: "course" })
    setOpen(false)
    setPhase({ kind: "idle" })
  }

  function reset(next: boolean) {
    setOpen(next)
    if (!next) setPhase({ kind: "idle" })
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Upload className="size-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import an existing course</DialogTitle>
          <DialogDescription>
            Upload a ZIP of a Tutors course source folder (the same structure this builder exports — course.md,
            properties.yaml and topic folders at the root). The imported course replaces the one currently in the
            builder.
          </DialogDescription>
        </DialogHeader>

        {phase.kind === "idle" && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) onFile(file)
            }}
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-10 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Upload className="size-6" />
            <span>Drop a course ZIP here, or click to choose a file</span>
          </button>
        )}

        {phase.kind === "importing" && (
          <div className="flex flex-col items-center gap-3 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <span>Reading course structure and storing assets…</span>
          </div>
        )}

        {phase.kind === "error" && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{phase.message}</AlertDescription>
          </Alert>
        )}

        {phase.kind === "done" && (
          <div className="flex flex-col gap-3">
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertTitle>{`Parsed "${phase.result.course.title}"`}</AlertTitle>
              <AlertDescription>
                {phase.result.course.topics.length} topic{phase.result.course.topics.length === 1 ? "" : "s"} found.
                {phase.result.warnings.length > 0
                  ? ` ${phase.result.warnings.length} warning${phase.result.warnings.length === 1 ? "" : "s"}.`
                  : " No issues."}
              </AlertDescription>
            </Alert>
            {phase.result.warnings.length > 0 && (
              <ScrollArea className="max-h-40 rounded-md border border-border">
                <ul className="flex flex-col gap-1 p-3 text-sm text-muted-foreground">
                  {phase.result.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-chart-3" />
                      {w}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ""
          }}
        />

        <DialogFooter>
          {phase.kind === "done" ? (
            <>
              <Button variant="outline" onClick={() => setPhase({ kind: "idle" })} className="bg-transparent">
                Choose another file
              </Button>
              <Button onClick={() => apply(phase.result)}>Load into builder</Button>
            </>
          ) : phase.kind === "error" ? (
            <Button variant="outline" onClick={() => setPhase({ kind: "idle" })} className="bg-transparent">
              Try again
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
