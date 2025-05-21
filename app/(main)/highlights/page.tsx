"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HighlightCard } from "@/components/highlight-card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Tag, HighlightWithTags } from "@/types/database"

interface HighlightWithBook extends HighlightWithTags {
  book: {
    title: string
    author: string | null
  }
}

interface TagGroup {
  tagId: string
  tagName: string
  highlights: HighlightWithBook[]
}

export default function HighlightsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [highlightsByTag, setHighlightsByTag] = useState<TagGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .order("name", { ascending: true })

        if (error) throw error
        setTags(data || [])
      } catch (error) {
        console.error("Error fetching tags:", error)
      }
    }

    fetchTags()
  }, [user])

  const fetchHighlights = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data: highlights, error: highlightsError } = await supabase
        .from("highlights")
        .select(`
          id,
          content,
          created_at,
          book_id,
          books:book_id (
            title,
            author
          ),
          tags:highlight_tags(
            tag:tags(*)
          )
        `)
        .order("created_at", { ascending: false })

      if (highlightsError) throw highlightsError

      // Group highlights by tag
      const groupedHighlights: Record<string, TagGroup> = {}
      const untaggedHighlights: HighlightWithBook[] = []

      highlights.forEach((highlight: any) => {
        const highlightWithBook: HighlightWithBook = {
          ...highlight,
          book: highlight.books,
          tags: highlight.tags.map((t: any) => t.tag),
        }

        if (highlight.tags.length === 0) {
          untaggedHighlights.push(highlightWithBook)
        } else {
          highlight.tags.forEach((t: any) => {
            const tag = t.tag
            if (!groupedHighlights[tag.id]) {
              groupedHighlights[tag.id] = {
                tagId: tag.id,
                tagName: tag.name,
                highlights: [],
              }
            }
            groupedHighlights[tag.id].highlights.push(highlightWithBook)
          })
        }
      })

      // Add untagged group if there are any untagged highlights
      if (untaggedHighlights.length > 0) {
        groupedHighlights["untagged"] = {
          tagId: "untagged",
          tagName: "Untagged",
          highlights: untaggedHighlights,
        }
      }

      setHighlightsByTag(Object.values(groupedHighlights))
    } catch (err: any) {
      console.error("Error fetching highlights:", err)
      setError(err.message || "Failed to load highlights")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchHighlights()
    }
  }, [user])

  const handleAddHighlight = () => {
    router.push("/highlights/add")
  }

  const handleEditHighlight = (id: string) => {
    router.push(`/highlights/${id}/edit`)
  }

  const handleDeleteHighlight = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("highlights").delete().eq("id", id)

      if (error) throw error

      // Refresh the highlights list
      fetchHighlights()
    } catch (err: any) {
      console.error("Error deleting highlight:", err)
      setError(err.message || "Failed to delete highlight")
    }
  }

  const handleAddTag = async (highlightId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from("highlight_tags")
        .insert({ highlight_id: highlightId, tag_id: tagId })

      if (error) throw error

      // Refresh the highlights list
      fetchHighlights()
    } catch (error) {
      console.error("Error adding tag:", error)
      setError("Failed to add tag. Please try again.")
    }
  }

  const handleRemoveTag = async (highlightId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from("highlight_tags")
        .delete()
        .eq("highlight_id", highlightId)
        .eq("tag_id", tagId)

      if (error) throw error

      // Refresh the highlights list
      fetchHighlights()
    } catch (error) {
      console.error("Error removing tag:", error)
      setError("Failed to remove tag. Please try again.")
    }
  }

  const handleCreateTag = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name })
        .select()
        .single()

      if (error) throw error

      // Refresh tags list
      const { data: updatedTags, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true })

      if (tagsError) throw tagsError
      setTags(updatedTags || [])

      return data
    } catch (error) {
      console.error("Error creating tag:", error)
      setError("Failed to create tag. Please try again.")
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Highlights</h1>
          <p className="text-muted-foreground mt-2">Browse all your saved highlights organized by tags.</p>
        </div>
        <Button onClick={handleAddHighlight}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Highlight
        </Button>
      </div>

      {error && (
        <Alert className="border border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {highlightsByTag.length === 0 && !isLoading && !error ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No highlights found</h3>
          <p className="text-muted-foreground mb-6">Add your first highlight to get started</p>
          <Button onClick={handleAddHighlight}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Your First Highlight
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {highlightsByTag.map((tagGroup) => (
            <div key={tagGroup.tagId} className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-xl font-semibold">{tagGroup.tagName}</h2>
                <p className="text-sm text-muted-foreground">{tagGroup.highlights.length} highlights</p>
              </div>
              <div className="space-y-4">
                {tagGroup.highlights.map((highlight) => (
                  <HighlightCard
                    key={highlight.id}
                    id={highlight.id}
                    content={highlight.content}
                    bookTitle={highlight.book.title}
                    author={highlight.book.author || undefined}
                    createdAt={new Date(highlight.created_at)}
                    tags={highlight.tags}
                    availableTags={tags}
                    onEdit={handleEditHighlight}
                    onDelete={handleDeleteHighlight}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                    onCreateTag={handleCreateTag}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
