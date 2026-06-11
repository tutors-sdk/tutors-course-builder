# Tutors Course Builder — Architecture

A visual, browser-based course builder for the [Tutors](https://tutors.dev) open learning platform. Authors construct a course following the Tutors learning object structure, preview it exactly as the [NextJS Tutors Reader](https://github.com/tutors-sdk/next-js-tutors-reader) renders it, and exchange courses with the official toolchain via ZIPs of the canonical Tutors source folder layout — import an existing course, export one ready for `tutors-publish`.

The application is entirely client-side: Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui, with no backend, no auth, and no server persistence. The browser is the runtime, the editor, and the database.

## System Overview

```
+--------------------------------------------------------------+
|                        app/page.tsx                          |
|                   (renders BuilderShell)                      |
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
| lo-editor.tsx           |   |  breadcrumb bar, lab shell)   |
| editors/* (per type)    |   |                               |
+------------+------------+   +----------+--------------------+
             |                           |
+------------v---------------------------v---------------------+
|                  lib/course-builder/ (model layer)            |
|  types.ts   defaults.ts   store.tsx   assets.ts               |
|  import.ts (ZIP -> model)        export.ts (model -> ZIP)     |
+------------+---------------------------+---------------------+
             |                           |
+------------v------------+   +----------v--------------------+
| localStorage            |   | IndexedDB                     |
| (course JSON, autosave) |   | (binary assets: images, PDFs, |
|                         |   |  zips, audio — by asset id)   |
+-------------------------+   +-------------------------------+
```

Two strict layers:

- **`lib/course-builder/`** — the model layer. Pure TypeScript (the store is the only React file). Owns the domain types, factories, state management, persistence, and the ZIP codec (import/export).
- **`components/builder/`** — the UI layer. Everything React-rendered. Talks to the model layer exclusively through the `useCourse` context hook and the asset helpers.

## Domain Model

The model mirrors the Tutors learning object (Lo) hierarchy defined by `tutors-model-lib` and exemplified by the [reference course](https://github.com/tutors-sdk/tutors-reference-course):

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
| `course` | `course.md` + `properties.yaml` | Root object: credits, icon, properties |
| `topic` | `topic-NN-*/topic.md` | Contains units, sides, and direct resources |
| `unit` / `side` | `unit-N-*/`, `side-N-*/` | Horizontal groupings of resources |
| `talk` | `talk-N-*/` + PDF | Slide deck |
| `lab` | `book-N-*/` + numbered step files | Steps: `01-intro.md`, `02-setup.md`, ... |
| `note` | `note-N-*/note.md` | Standalone markdown |
| `web` | `web-N-*/weburl` | External link; URL stored in a `weburl` file |
| `github` | `github-N-*/weburl` | Repository link |
| `archive` | `archive-N-*/` + zip | Downloadable archive |
| `tutorial` | `tutorial-N-*/` | Markdown + optional PDF |
| `panelvideo` / `paneltalk` / `panelnote` | `panelvideo-N-*/videoid`, etc. | Rendered inline on the topic page |
| `podcast` | `podcast-N-*/` + audio | Audio learning object |

Every Lo carries an `id` (uuid), `type`, `title`, `summary`, markdown `content`, optional asset pointers (`imageAssetId`, `pdfAssetId`, `archiveAssetId` — ids into IndexedDB, never blobs), and type-specific fields (`url`, `videoId`, lab `steps[]`). The Lo union is discriminated on `type`, so editors and the exporter can switch exhaustively.

## Model Layer (`lib/course-builder/`)

| Module | Responsibility |
| --- | --- |
| `types.ts` | All domain types: `LoType`, the discriminated Lo union, `Course`, selection, validation and import-result shapes. Single source of truth. |
| `defaults.ts` | Factories (`createLo`, `createCourse`, `createSampleCourse`) producing objects with sensible default markdown, plus the allowed-children map governing what each container may hold. |
| `store.tsx` | `CourseProvider` context + reducer. Actions: course load/replace, metadata updates, Lo add/update/delete/move/reorder, lab step CRUD, selection. Debounced autosave to localStorage; rehydrates on mount. |
| `assets.ts` | Thin IndexedDB wrapper (`putAsset`, `getAsset`, `deleteAsset`, `getAssetUrl`). Object URLs created on demand for previews. |
| `export.ts` | Model → ZIP via `jszip`. Walks the tree emitting the canonical source layout: `course.md`, `properties.yaml` (via `yaml`), prefixed folders, `weburl` / `videoid` files, numbered lab steps, and binary assets from IndexedDB (placeholder images generated where required). Also `validateCourse`, producing warnings (missing images, PDFs, URLs). |
| `import.ts` | ZIP → model; the exact inverse. Unzips a source folder (tolerating a wrapping directory such as a GitHub archive root), parses `course.md` / `properties.yaml`, walks prefixed folders, reads `weburl` / `videoid` files and lab steps, extracts titles/summaries from markdown, stores binaries in IndexedDB, and returns a parse summary with non-fatal warnings. |

## UI Layer (`components/builder/`)

| Component | Responsibility |
| --- | --- |
| `builder-shell.tsx` | App shell: wraps everything in `CourseProvider`, renders the header (title, Import, Export, New/Sample) and the Edit/Preview tabs. Routes preview "Edit" actions back to the editor by setting selection and switching tabs. |
| `course-tree.tsx` | Collapsible structure sidebar: hierarchy rendering, selection, type-aware add menus per container, reorder, delete. |
| `lo-meta.tsx` | Shared per-type metadata: lucide icons, labels, reader-style short labels, accent color classes — used by both tree and preview. |
| `lo-editor.tsx` | Generic type-aware editor: title/summary, markdown content, and conditional sections (URL, video id, PDF/archive/image uploads) driven by the Lo type. |
| `editors/course-editor.tsx` | Course metadata: title, credits, icon, properties. |
| `editors/lab-editor.tsx` | Lab steps: add, rename, reorder, delete, per-step markdown. |
| `markdown-editor.tsx` | Reusable Write / Preview / Split editor on `react-markdown` + `remark-gfm`. |
| `asset-upload.tsx` | Reusable upload (image/PDF/zip/audio) storing via `assets.ts`, previewing from object URLs. |
| `course-preview.tsx` | Reader-fidelity preview modeled on [next-js-tutors-reader](https://github.com/tutors-sdk/next-js-tutors-reader): `LoCard` (image header, icon + uppercase mono type label, clamped summary), `CardGrid` and unit sections with hairline-divider headings, sticky breadcrumb bar, in-pane navigation (course → topic → lab), and a `LabShell` with numbered step sidebar, prev/next footer, and arrow-key navigation. Every page links back to its editor. |
| `import-dialog.tsx` | Drag-drop/file picker → `parseCourseZip` → parse summary with warnings → load into builder. |
| `export-dialog.tsx` | Validation report from `validateCourse` + ZIP download via `exportCourseZip`. |

## Data Flow

1. **Editing** — components dispatch reducer actions through `useCourse`; the reducer returns a new immutable tree; a debounced effect serializes it to localStorage.
2. **Assets** — uploads go straight to IndexedDB; the model stores only ids. Preview and export resolve ids to blobs/object URLs on demand.
3. **Import** — `parseCourseZip(file)` builds a complete `Course` plus asset map, writes assets to IndexedDB, and the dialog dispatches a full course replace.
4. **Export** — `exportCourseZip(course)` validates, then streams the tree and IndexedDB assets into a `jszip` archive mirroring the Tutors source conventions, downloaded client-side.

## Persistence

| Data | Store | Rationale |
| --- | --- | --- |
| Course tree (JSON) | localStorage | Small, serializable, synchronous rehydrate on load |
| Binary assets | IndexedDB | Blobs exceed localStorage limits; referenced by id from the model |

There is no server. Work persists per device/browser; the exported ZIP is the durable hand-off format.

## Round-Trip Compatibility

Import and export are deliberately symmetric:

- A course exported from the builder re-imports losslessly.
- A real Tutors source repo (e.g. [tutors-reference-course](https://github.com/tutors-sdk/tutors-reference-course)) imports directly from its GitHub ZIP.
- The exported ZIP is consumable by `tutors-publish` from [tutors-apps](https://github.com/tutors-sdk/tutors-apps) to generate the JSON the Tutors Reader serves.
