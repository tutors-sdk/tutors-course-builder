"use client"

import { FileUp, ImageIcon, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteAsset, getAssetUrl, saveAsset } from "@/lib/course-builder/assets"
import type { AssetRef } from "@/lib/course-builder/types"

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AssetUpload({
  label,
  accept,
  asset,
  onChange,
  imagePreview,
}: {
  label: string
  accept: string
  asset?: AssetRef
  onChange: (asset?: AssetRef) => void
  imagePreview?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string>()

  useEffect(() => {
    let url: string | undefined
    let cancelled = false
    if (asset && imagePreview) {
      getAssetUrl(asset.id).then((u) => {
        if (cancelled) {
          if (u) URL.revokeObjectURL(u)
          return
        }
        url = u
        setPreviewUrl(u)
      })
    } else {
      setPreviewUrl(undefined)
    }
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [asset, imagePreview])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (asset) await deleteAsset(asset.id).catch(() => {})
    const ref = await saveAsset(file)
    onChange(ref)
  }

  async function handleRemove() {
    if (asset) await deleteAsset(asset.id).catch(() => {})
    onChange(undefined)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-label={label}
      />
      {asset ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
          {imagePreview && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl || "/placeholder.svg"}
              alt={`Preview of ${asset.name}`}
              className="size-14 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <FileUp className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{asset.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(asset.size)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
            Replace
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={handleRemove}>
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          {imagePreview ? <ImageIcon className="size-4" /> : <FileUp className="size-4" />}
          Click to upload
        </button>
      )}
    </div>
  )
}
