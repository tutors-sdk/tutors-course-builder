# create-tutors-course

Interactive CLI wizard to scaffold a [Tutors](https://tutors.dev) course folder structure.

## Usage

```bash
npx create-tutors-course
```

Or specify an output directory:

```bash
npx create-tutors-course --output-dir ./my-courses
```

## What it does

The wizard walks you through five steps:

1. **Course Details** — title, description, credits
2. **Topics** — how many topics and their titles
3. **Content** — for each topic, configure units with talks, labs, and notes
4. **Review** — see the full course structure before generating
5. **Generate** — creates the folder structure with placeholder files

## Output

The generated structure follows Tutors conventions and is fully compatible with:

- The [Course Builder](https://github.com/tutors-sdk/tutors-course-builder) web app (import via ZIP)
- `npx tutors-publish` for direct publishing

```
my-course/
  course.md
  course.png
  properties.yaml
  topic-01-introduction/
    topic.md
    topic.png
    unit-01-getting-started/
      getting-started.md
      talk-01-welcome/
        talk.md
        talk.pdf
        talk.png
      book-01-first-lab/
        00.Intro.md
        01.Step-1.md
        02.Step-2.md
        img/
        first-lab.png
      note-01-key-concepts/
        note.md
        note.png
```

## Features

- **Color-coded placeholder images** — each content type gets a visually distinct PNG (blue for course, green for topics, peach for talks, plum for labs, yellow for notes)
- **Placeholder PDFs** — talks include a valid placeholder PDF for slides
- **Zero native dependencies** — uses pure JavaScript PNG generation, works on any platform
- **Progress reporting** — real-time file creation progress in the terminal

## Development

```bash
pnpm install
pnpm --filter create-tutors-course build
```
