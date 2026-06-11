"use client"

import { AlertTriangle, CheckCircle2, Download, Loader2, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
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
import { downloadBlob, exportCourseZip, slug, validateCourse } from "@/lib/course-builder/export"
import { useCourse } from "@/lib/course-builder/store"

export function ExportDialog() {
  const { course } = useCourse()
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string>()

  const issues = useMemo(() => (open ? validateCourse(course) : []), [open, course])
  const errors = issues.filter((i) => i.level === "error")
  const warnings = issues.filter((i) => i.level === "warning")

  async function handleExport() {
    setExporting(true)
    setError(undefined)
    try {
      const blob = await exportCourseZip(course)
      downloadBlob(blob, `${slug(course.title)}.zip`)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Download className="size-4" />
            Export Course
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Tutors course source</DialogTitle>
          <DialogDescription>
            Downloads a ZIP of the canonical Tutors folder structure. Run{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">tutors-publish</code> on the unzipped
            folder to generate the course for the Tutors Reader.
          </DialogDescription>
        </DialogHeader>

        {issues.length === 0 ? (
          <Alert>
            <CheckCircle2 className="size-4 text-primary" />
            <AlertTitle>Ready to export</AlertTitle>
            <AlertDescription>No issues found in the course structure.</AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="flex flex-col gap-2 pr-3">
              {errors.map((issue, i) => (
                <Alert key={`e-${i}`} variant="destructive">
                  <XCircle className="size-4" />
                  <AlertDescription>{issue.message}</AlertDescription>
                </Alert>
              ))}
              {warnings.map((issue, i) => (
                <Alert key={`w-${i}`}>
                  <AlertTriangle className="size-4 text-chart-3" />
                  <AlertDescription>{issue.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || errors.length > 0} className="gap-2">
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {errors.length > 0 ? "Fix errors to export" : "Download ZIP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
