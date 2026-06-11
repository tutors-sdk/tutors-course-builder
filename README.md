# Tutors Course Builder

A visual, browser-based course builder for the [Tutors](https://tutors.dev) open learning platform. It lets authors construct a course following the Tutors learning object structure, preview it the way the [Tutors Reader](https://github.com/jouwdan/next-js-tutors-reader) renders it, and export a canonical Tutors source folder ZIP ready for `tutors-publish`. Existing courses can be imported from a ZIP of their source folder.

Built with Next.js (App Router), React, TypeScript, Tailwind CSS, and shadcn/ui. Entirely client-side: no backend, no auth, no server persistence.

## High-Level Architecture

```
+--------------------------------------------------------------+
|                        app/page.tsx                          |
|                  (renders BuilderShell)                       |
+--------------------------------------------------------------+
                              |
+-----------------------------v--------------------------------+
|              components/builder/builder-shell.tsx            |
|   CourseProvider (context) + header (Import / Export /       |
|   New / Sample) + Edit | Preview tab switch                  |
+------------+---------------------------+---------------------+
             |                           |
   Edit view |                           | Preview view
+------------v------------+   +----------v--------------------+
| course-tree.tsx         |   | course-preview.tsx            |
| (sidebar: structure)    |   | (reader-style card grids,     |
| lo-editor.tsx           |   |  top bar, lab shell)          |
| editors/* (per type)    |   |                               |
+------------+------------+   +----------+--------------------+
             |                           |
+------------v---------------------------v---------------------+
|                  lib/course-builder/ (model layer)            |
|  types.ts  defaults.ts  store.tsx  assets.ts                  |
|  import.ts (ZIP -> model)        export.ts (model -> ZIP)     |
+------------+---------------------------+---------------------+
             |                           |
+------------v------------+   +----------v--------------------+
| localStorage            |   | IndexedDB                     |
| (course JSON, autosave) |   | (binary assets: images, PDFs, |
|                         |   |  zips, keyed by asset id)     |
+-------------------------+   +-------------------------------+
```

## The Domain Model

The model mirrors the Tutors learning object (Lo) hierarchy used by `tutors-model-lib` and the reference course:

```
Course
└── Topic (topic-NN-slug/)
    ├── direct resources (talks, labs, notes, ...)
    └── Unit / Side (unit-N-slug/, side-N-slug/)
        └── resources
```

Supported learning object types (`lib/course-builder/types.ts`):

| Type | Source convention | Notes |
| --- | --- | --- |
| `course` | `course.md` + `properties.yaml` | Root object with credits, icon, properties |
| `topic` | `topic-NN-*/topic.md` | Contains units, sides, and direct resources |
| `unit` / `side` | `unit-N-*/`, `side-N-*/` | Horizontal groupings of resources |
| `talk` | `talk-N-*/` + PDF | Slide deck |
| `lab` | `book-N-*/` + numbered step `.md` files | Steps: `01-intro.md`, `02-setup.md`, ... |
| `note` | `note-N-*/note.md` | Standalone markdown |
| `web` | `web-N-*/weburl` | External link (URL stored in `weburl` file) |
| `github` | `github-N-*/weburl` | Repository link |
| `archive` | `archive-N-*/` + zip | Downloadable archive |
| `tutorial` | `tutorial-N-*/` | Markdown + optional PDF |
| `panelvideo` / `paneltalk` / `panelnote` | `panelvideo-N-*/videoid`, etc. | Rendered inline on the topic page |
| `podcast` | `podcast-N-*/` + audio | Audio learning object |

Every Lo carries `id` (uuid), `type`, `title`, `summary`, markdown `content`, an optional `imageAssetId` / `pdfAssetId` / `archiveAssetId` (pointers into IndexedDB), plus type-specific fields (`url`, `videoId`, lab `steps[]`).

## Module Responsibilities

### `lib/course-builder/` — model layer (no React except store)

- **`types.ts`** — All TypeScript types: `LoType`, the discriminated union of learning objects, `Course`, selection types, and validation/import result shapes. The single source of truth for the model.
- **`defaults.ts`** — Factory functions (`createLo`, `createCourse`, `createSampleCourse`) that produce new objects with sensible default markdown and titles. Also defines which child types each container allows.
- **`store.tsx`** — `CourseProvider` React context with a reducer. Actions: load/replace course, update course metadata, add/update/delete/move/reorder Los, lab step CRUD, and selection. Autosaves the serialized course to `localStorage` (debounced) and rehydrates on mount.
- **`assets.ts`** — Thin IndexedDB wrapper (`putAsset`, `getAsset`, `deleteAsset`, `getAssetUrl`). Binary files never touch localStorage; the course JSON only stores asset ids. Object URLs are created on demand for previews.
- **`export.ts`** — Model → ZIP. Walks the course tree and emits the canonical Tutors source layout: `course.md`, `properties.yaml` (via `yaml`), prefixed folders (`topic-01-slug/`, `unit-1-slug/`, `talk-1-slug/`...), `weburl` / `videoid` files, numbered lab step files, and binary assets pulled from IndexedDB (with generated placeholder images where required). Also runs `validateCourse`, returning warnings (missing images, PDFs, URLs) surfaced in the export dialog. Uses `jszip`.
- **`import.ts`** — ZIP → model. The inverse of export: unzips a course source folder (tolerating a wrapping directory such as a GitHub archive root), parses `course.md` / `properties.yaml`, walks prefixed topic/unit/side/resource folders, reads `weburl` / `videoid` files and lab steps, extracts front-matter-free markdown titles/summaries, and stores binary assets into IndexedDB. Returns a parse summary with non-fatal warnings.

### `components/builder/` — UI layer

- **`builder-shell.tsx`** — App shell. Wraps everything in `CourseProvider`, renders the header (course title, Import, Export, New/Sample buttons) and the Edit/Preview tab switch. Routes preview "Edit this" actions back to the editor by setting selection and switching tabs.
- **`course-tree.tsx`** — Collapsible structure sidebar. Renders the course hierarchy, handles selection, add (type-aware dropdown per container), reorder (up/down), and delete.
- **`lo-meta.tsx`** — Shared per-type metadata: icons (lucide), labels, reader-style short labels (`LO_META_LABELS`), and per-type accent color classes used by both the tree and the preview cards.
- **`lo-editor.tsx`** — Generic type-aware editor: title/summary fields, markdown content, plus conditional sections (URL for web/github, video id for panel video, PDF upload for talks/tutorials, archive upload, image upload). Delegates to specialized editors where needed.
- **`editors/course-editor.tsx`** — Course metadata editor (title, credits, icon, properties).
- **`editors/lab-editor.tsx`** — Lab-specific editor with step list management (add, rename, reorder, delete) and per-step markdown editing.
- **`markdown-editor.tsx`** — Reusable Write / Preview / Split markdown editor built on `react-markdown` + `remark-gfm`.
- **`asset-upload.tsx`** — Reusable file upload (image/PDF/zip/audio) that stores files via `assets.ts` and previews from object URLs.
- **`course-preview.tsx`** — Reader-fidelity preview modeled on [next-js-tutors-reader](https://github.com/jouwdan/next-js-tutors-reader): `LoCard` (image header, icon + uppercase mono type label, clamped summary), `CardGrid` and unit sections with hairline-divider headings, a sticky breadcrumb top bar, in-pane navigation (course home → topic → lab), and a `LabShell` with a numbered step sidebar, prev/next footer, and arrow-key navigation. Each page has an Edit button that jumps to the corresponding editor.
- **`import-dialog.tsx`** — ZIP import flow: drag-drop/file picker → `parseCourseZip` → parse summary with warnings → "Load into builder" (replaces the current course).
- **`export-dialog.tsx`** — Validation report (warnings from `validateCourse`) and ZIP download via `exportCourseZip`.

## Data Flow

1. **Editing** — UI components dispatch reducer actions through the `useCourse` context hook. The reducer produces a new immutable course tree; a debounced effect serializes it to `localStorage`.
2. **Assets** — Uploads go straight to IndexedDB; the model stores only the asset id. Preview and export resolve ids to blobs/object URLs on demand.
3. **Import** — `parseCourseZip(file)` builds a complete `Course` + asset map, writes assets to IndexedDB, and the dialog dispatches a full course replace.
4. **Export** — `exportCourseZip(course)` validates, then streams the tree and IndexedDB assets into a `jszip` archive that mirrors the Tutors source folder conventions, downloaded client-side.

## Round-Trip Compatibility

Import and export are deliberately symmetric: a course exported from the builder re-imports losslessly, and a real Tutors course source repo (e.g. [tutors-reference-course](https://github.com/tutors-sdk/tutors-reference-course)) imports directly from its GitHub ZIP. The exported ZIP is intended to be consumed by `tutors-publish` from [tutors-apps](https://github.com/tutors-sdk/tutors-apps) to generate the JSON the Tutors Reader serves.

## Persistence Model

| Data | Store | Why |
| --- | --- | --- |
| Course tree (JSON) | `localStorage` | Small, serializable, synchronous rehydrate on load |
| Binary assets | IndexedDB | Blobs are too large for localStorage; ids referenced from the model |

There is no server: closing the browser keeps work (per device/browser), and the ZIP export is the durable hand-off format.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Sample** to load a reference course, **Import** to load an existing Tutors course ZIP, and **Export Course** to download the source folder ZIP.

## Built with v0

This repository is linked to a [v0](https://v0.app) project. Start new chats to make changes, and v0 will push commits directly to this repo.

[Continue working on v0 →](https://v0.app/chat/projects/prj_1rM34vj81fWlPaMGwAyDfMWWqsuY)
