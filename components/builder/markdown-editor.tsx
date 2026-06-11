"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function MarkdownPreview({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose-sm max-w-none text-sm leading-relaxed",
        "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h1:first-child]:mt-0",
        "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_a]:text-primary [&_a]:underline",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_pre]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_table]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 14,
  label,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  label?: string
}) {
  return (
    <Tabs defaultValue="write" className="w-full">
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="split">Split</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          aria-label={label ?? "Markdown content"}
          className="resize-y font-mono text-sm leading-relaxed"
          placeholder="# Title&#10;&#10;Write markdown here..."
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="min-h-32 rounded-md border border-border bg-card p-4">
          {value.trim() ? (
            <MarkdownPreview markdown={value} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="split">
        <div className="grid gap-3 md:grid-cols-2">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            aria-label={label ?? "Markdown content"}
            className="resize-y font-mono text-sm leading-relaxed"
          />
          <div className="overflow-y-auto rounded-md border border-border bg-card p-4" style={{ maxHeight: `${rows * 1.7}rem` }}>
            <MarkdownPreview markdown={value} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
