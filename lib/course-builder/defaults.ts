import type { AnyLo, Course, LabStep, LoType, TopicLo } from "./types"

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function createLabStep(index: number): LabStep {
  const isIntro = index === 0
  return {
    id: uid(),
    shortTitle: isIntro ? "Intro" : `Step ${index}`,
    markdown: isIntro
      ? `# Lab Introduction\n\nDescribe the objectives of this lab.\n`
      : `# Step ${index}\n\nDescribe this step.\n`,
  }
}

export function createLo(type: Exclude<LoType, "course">): AnyLo {
  const base = { id: uid(), markdown: "", hidden: false }
  switch (type) {
    case "topic":
      return {
        ...base,
        type: "topic",
        title: "New Topic",
        markdown: "# New Topic\n\nTopic summary goes here.\n",
        children: [],
      }
    case "unit":
      return {
        ...base,
        type: "unit",
        title: "New Unit",
        markdown: "# New Unit\n",
        children: [],
      }
    case "side":
      return {
        ...base,
        type: "side",
        title: "New Side Unit",
        markdown: "# New Side Unit\n",
        children: [],
      }
    case "talk":
      return {
        ...base,
        type: "talk",
        title: "New Talk",
        markdown: "# New Talk\n\nTalk summary.\n",
      }
    case "lab":
      return {
        ...base,
        type: "lab",
        title: "New Lab",
        markdown: "",
        steps: [createLabStep(0), createLabStep(1)],
        images: [],
      }
    case "note":
      return {
        ...base,
        type: "note",
        title: "New Note",
        markdown: "# New Note\n\nNote content in markdown.\n",
      }
    case "web":
      return {
        ...base,
        type: "web",
        title: "New Web Link",
        markdown: "# New Web Link\n\nDescription of the linked resource.\n",
        url: "https://",
      }
    case "github":
      return {
        ...base,
        type: "github",
        title: "New GitHub Repo",
        markdown: "# New GitHub Repo\n\nDescription of the repository.\n",
        repoId: "",
      }
    case "archive":
      return {
        ...base,
        type: "archive",
        title: "New Archive",
        markdown: "# New Archive\n\nDownloadable resource.\n",
      }
    case "tutorial":
      return {
        ...base,
        type: "tutorial",
        title: "New Tutorial",
        markdown: "# New Tutorial\n\nTutorial summary.\n",
      }
    case "panelvideo":
      return {
        ...base,
        type: "panelvideo",
        title: "New Panel Video",
        markdown: "# New Panel Video\n",
        videoId: "",
      }
    case "paneltalk":
      return {
        ...base,
        type: "paneltalk",
        title: "New Panel Talk",
        markdown: "# New Panel Talk\n",
      }
    case "panelnote":
      return {
        ...base,
        type: "panelnote",
        title: "New Panel Note",
        markdown: "# New Panel Note\n\nPanel note content.\n",
      }
    case "podcast":
      return {
        ...base,
        type: "podcast",
        title: "New Podcast",
        markdown: "# New Podcast\n",
        audioUrl: "",
      }
  }
}

export function createCourse(): Course {
  return {
    id: uid(),
    title: "My New Course",
    markdown:
      "# My New Course\n\nA short description of the course, rendered on the course card and home page.\n",
    properties: {
      credits: "Your name here",
      companions: [],
      labStepsAutoNumber: true,
      iconset: "fluentui",
    },
    topics: [],
    updatedAt: Date.now(),
  }
}

/** A small starter course inspired by tutors-reference-course */
export function createSampleCourse(): Course {
  const course = createCourse()
  course.title = "Reference Course"
  course.markdown =
    "# Reference Course\n\nA sample course demonstrating the Tutors learning object structure: topics, units, talks, labs, notes and more.\n"
  course.properties.credits = "Tutors Course Builder"

  const topic = createLo("topic") as TopicLo
  topic.title = "Introduction"
  topic.markdown = "# Introduction\n\nGetting started with the course.\n"

  const talk = createLo("talk")
  talk.title = "Welcome Talk"
  talk.markdown = "# Welcome Talk\n\nIntroductory lecture slides.\n"

  const lab = createLo("lab")
  lab.title = "Lab 01 - Setup"

  const web = createLo("web")
  web.title = "Tutors Website"
  web.markdown = "# Tutors Website\n\nThe Tutors open source project.\n"
  if (web.type === "web") web.url = "https://tutors.dev"

  topic.children = [talk, lab, web] as TopicLo["children"]
  course.topics = [topic]
  return course
}
