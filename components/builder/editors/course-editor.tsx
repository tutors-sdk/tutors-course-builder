"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { uid } from "@/lib/course-builder/defaults"
import { useCourse } from "@/lib/course-builder/store"
import type { CourseProperties } from "@/lib/course-builder/types"
import { AssetUpload } from "../asset-upload"
import { MarkdownEditor } from "../markdown-editor"

export function CourseEditor() {
  const { course, dispatch } = useCourse()

  function updateProps(patch: Partial<CourseProperties>) {
    dispatch({ type: "update-course", patch: { properties: { ...course.properties, ...patch } } })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="course-title">Title</Label>
            <Input
              id="course-title"
              value={course.title}
              onChange={(e) => dispatch({ type: "update-course", patch: { title: e.target.value } })}
              placeholder="Course title"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Description (course.md)</Label>
            <MarkdownEditor
              value={course.markdown}
              onChange={(markdown) => dispatch({ type: "update-course", patch: { markdown } })}
              rows={10}
              label="Course description markdown"
            />
          </div>
          <AssetUpload
            label="Card image (course.png)"
            accept="image/*"
            asset={course.image}
            imagePreview
            onChange={(image) => dispatch({ type: "update-course", patch: { image } })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Properties (properties.yaml)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="course-credits">Credits</Label>
            <Input
              id="course-credits"
              value={course.properties.credits}
              onChange={(e) => updateProps({ credits: e.target.value })}
              placeholder="Course author / institution"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Auto-number lab steps</p>
              <p className="text-xs text-muted-foreground">labStepsAutoNumber in properties.yaml</p>
            </div>
            <Switch
              checked={course.properties.labStepsAutoNumber}
              onCheckedChange={(labStepsAutoNumber) => updateProps({ labStepsAutoNumber })}
              aria-label="Auto-number lab steps"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Companion links</Label>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 bg-transparent"
                onClick={() =>
                  updateProps({
                    companions: [...course.properties.companions, { id: uid(), key: "", url: "" }],
                  })
                }
              >
                <Plus className="size-3.5" />
                Add link
              </Button>
            </div>
            {course.properties.companions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Optional platform links shown in the reader sidebar, e.g. moodle, youtube, zoom, teams.
              </p>
            )}
            {course.properties.companions.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Input
                  value={c.key}
                  onChange={(e) =>
                    updateProps({
                      companions: course.properties.companions.map((x) =>
                        x.id === c.id ? { ...x, key: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="key (e.g. moodle)"
                  className="w-40"
                  aria-label="Companion key"
                />
                <Input
                  value={c.url}
                  onChange={(e) =>
                    updateProps({
                      companions: course.properties.companions.map((x) =>
                        x.id === c.id ? { ...x, url: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="https://..."
                  className="flex-1"
                  aria-label="Companion URL"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove companion link"
                  onClick={() =>
                    updateProps({ companions: course.properties.companions.filter((x) => x.id !== c.id) })
                  }
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
