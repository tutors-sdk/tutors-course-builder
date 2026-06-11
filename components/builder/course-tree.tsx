"use client"

import { ArrowDown, ArrowUp, ChevronRight, GraduationCap, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCourse } from "@/lib/course-builder/store"
import type { AnyLo, LoType } from "@/lib/course-builder/types"
import { LO_TYPE_LABELS, RESOURCE_TYPES } from "@/lib/course-builder/types"
import { cn } from "@/lib/utils"
import { LO_COLORS, LO_ICONS } from "./lo-meta"

function AddLoMenu({
  parentId,
  allowed,
  small,
}: {
  parentId: string | null
  allowed: LoType[]
  small?: boolean
}) {
  const { dispatch, setSelection } = useCourse()

  function add(loType: LoType) {
    const newId: { current?: string } = {}
    dispatch({ type: "add-lo", parentId, loType: loType as Exclude<LoType, "course">, newId })
    if (newId.current) setSelection({ kind: "lo", id: newId.current })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          small ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
              aria-label="Add learning object"
            >
              <Plus className="size-3.5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent">
              <Plus className="size-4" />
              Add Topic
            </Button>
          )
        }
      />
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Add learning object</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allowed.map((t) => {
            const Icon = LO_ICONS[t]
            return (
              <DropdownMenuItem key={t} onClick={() => add(t)}>
                <Icon className={cn("size-4", LO_COLORS[t].text)} />
                {LO_TYPE_LABELS[t]}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TreeRow({ lo, depth }: { lo: AnyLo; depth: number }) {
  const { selection, setSelection, dispatch } = useCourse()
  const [open, setOpen] = useState(true)
  const isContainer = lo.type === "topic" || lo.type === "unit" || lo.type === "side"
  const children = isContainer ? lo.children : []
  const selected = selection.kind === "lo" && selection.id === lo.id
  const Icon = LO_ICONS[lo.type]
  const allowedChildren: LoType[] =
    lo.type === "topic" ? ["unit", "side", ...RESOURCE_TYPES] : RESOURCE_TYPES

  return (
    <div>
      <div
        className={cn(
          "group/row flex items-center gap-1 rounded-md pr-1",
          selected ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50",
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {isContainer ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Collapse" : "Expand"}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => setSelection({ kind: "lo", id: lo.id })}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm"
        >
          <Icon className={cn("size-4 shrink-0", LO_COLORS[lo.type].text)} />
          <span className="truncate">{lo.title || "Untitled"}</span>
        </button>
        <div className="flex shrink-0 items-center">
          {isContainer && <AddLoMenu parentId={lo.id} allowed={allowedChildren} small />}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
            aria-label="Move up"
            onClick={() => dispatch({ type: "move-lo", id: lo.id, direction: -1 })}
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
            aria-label="Move down"
            onClick={() => dispatch({ type: "move-lo", id: lo.id, direction: 1 })}
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-destructive opacity-0 group-hover/row:opacity-100 focus:opacity-100"
            aria-label="Delete"
            onClick={() => dispatch({ type: "delete-lo", id: lo.id })}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {isContainer && open && (
        <div>
          {children.map((child) => (
            <TreeRow key={child.id} lo={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function CourseTree() {
  const { course, selection, setSelection } = useCourse()

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Course structure" className="flex flex-col gap-0.5 p-2">
          <button
            type="button"
            onClick={() => setSelection({ kind: "course" })}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium",
              selection.kind === "course"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/50",
            )}
          >
            <GraduationCap className="size-4 shrink-0 text-primary" />
            <span className="truncate">{course.title || "Untitled Course"}</span>
          </button>
          {course.topics.map((topic) => (
            <TreeRow key={topic.id} lo={topic} depth={0} />
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-2">
        <AddLoMenu parentId={null} allowed={["topic"]} />
      </div>
    </div>
  )
}
