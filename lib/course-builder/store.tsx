"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react"
import type { AnyLo, ContainerChild, Course, LoType, ResourceLo, TopicLo, UnitLo, SideLo } from "./types"
import { createCourse, createLo, createSampleCourse } from "./defaults"

const STORAGE_KEY = "tutors-course-builder:course"
const SELECTION_KEY = "tutors-course-builder:selection"

// ---------- Tree helpers ----------

export type Selection = { kind: "course" } | { kind: "lo"; id: string }

export function findLo(course: Course, id: string): AnyLo | undefined {
  for (const topic of course.topics) {
    if (topic.id === id) return topic
    for (const child of topic.children) {
      if (child.id === id) return child
      if (child.type === "unit" || child.type === "side") {
        for (const res of child.children) {
          if (res.id === id) return res
        }
      }
    }
  }
  return undefined
}

export function findParentList(course: Course, id: string): AnyLo[] | undefined {
  if (course.topics.some((t) => t.id === id)) return course.topics
  for (const topic of course.topics) {
    if (topic.children.some((c) => c.id === id)) return topic.children
    for (const child of topic.children) {
      if ((child.type === "unit" || child.type === "side") && child.children.some((r) => r.id === id)) {
        return child.children
      }
    }
  }
  return undefined
}

// ---------- Reducer ----------

type Action =
  | { type: "load"; course: Course }
  | { type: "new-course" }
  | { type: "sample-course" }
  | { type: "update-course"; patch: Partial<Course> }
  | { type: "update-lo"; id: string; patch: Partial<AnyLo> }
  | { type: "add-lo"; parentId: string | null; loType: Exclude<LoType, "course">; newId?: { current?: string } }
  | { type: "delete-lo"; id: string }
  | { type: "move-lo"; id: string; direction: -1 | 1 }

function clone(course: Course): Course {
  return JSON.parse(JSON.stringify(course)) as Course
}

function reducer(state: Course, action: Action): Course {
  switch (action.type) {
    case "load":
      return action.course
    case "new-course":
      return createCourse()
    case "sample-course":
      return createSampleCourse()
    case "update-course": {
      return { ...state, ...action.patch, updatedAt: Date.now() }
    }
    case "update-lo": {
      const next = clone(state)
      const lo = findLo(next, action.id)
      if (lo) Object.assign(lo, action.patch)
      next.updatedAt = Date.now()
      return next
    }
    case "add-lo": {
      const next = clone(state)
      const lo = createLo(action.loType)
      if (action.newId) action.newId.current = lo.id
      if (action.loType === "topic") {
        next.topics.push(lo as TopicLo)
      } else if (action.parentId) {
        const parent = findLo(next, action.parentId)
        if (parent?.type === "topic") {
          parent.children.push(lo as ContainerChild)
        } else if (parent?.type === "unit" || parent?.type === "side") {
          parent.children.push(lo as ResourceLo)
        }
      }
      next.updatedAt = Date.now()
      return next
    }
    case "delete-lo": {
      const next = clone(state)
      const list = findParentList(next, action.id)
      if (list) {
        const idx = list.findIndex((l) => l.id === action.id)
        if (idx >= 0) list.splice(idx, 1)
      }
      next.updatedAt = Date.now()
      return next
    }
    case "move-lo": {
      const next = clone(state)
      const list = findParentList(next, action.id)
      if (list) {
        const idx = list.findIndex((l) => l.id === action.id)
        const target = idx + action.direction
        if (idx >= 0 && target >= 0 && target < list.length) {
          const [item] = list.splice(idx, 1)
          list.splice(target, 0, item)
        }
      }
      next.updatedAt = Date.now()
      return next
    }
  }
}

// ---------- Context ----------

interface CourseStore {
  course: Course
  dispatch: React.Dispatch<Action>
  selection: Selection
  setSelection: (s: Selection) => void
  loaded: boolean
}

const CourseContext = createContext<CourseStore | null>(null)

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [course, dispatch] = useReducer(reducer, undefined, createCourse)
  const [selection, setSelection] = useState<Selection>({ kind: "course" })
  const [loaded, setLoaded] = useState(false)
  const skippedFirstSave = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Course
        dispatch({ type: "load", course: parsed })
      }
      const sel = localStorage.getItem(SELECTION_KEY)
      if (sel) setSelection(JSON.parse(sel) as Selection)
    } catch {
      // corrupted storage; start fresh
    }
    setLoaded(true)
  }, [])

  // Debounced autosave
  useEffect(() => {
    if (!loaded) return
    if (!skippedFirstSave.current) {
      skippedFirstSave.current = true
      return
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(course))
      } catch {
        // quota exceeded; ignore
      }
    }, 400)
    return () => clearTimeout(t)
  }, [course, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(SELECTION_KEY, JSON.stringify(selection))
  }, [selection, loaded])

  // If selection points at a deleted lo, fall back to course
  useEffect(() => {
    if (selection.kind === "lo" && !findLo(course, selection.id)) {
      setSelection({ kind: "course" })
    }
  }, [course, selection])

  const value = useMemo(
    () => ({ course, dispatch, selection, setSelection, loaded }),
    [course, selection, loaded],
  )

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
}

export function useCourse(): CourseStore {
  const ctx = useContext(CourseContext)
  if (!ctx) throw new Error("useCourse must be used within CourseProvider")
  return ctx
}

export function useSelectedLo(): AnyLo | undefined {
  const { course, selection } = useCourse()
  if (selection.kind !== "lo") return undefined
  return findLo(course, selection.id)
}

export type { UnitLo, SideLo }
