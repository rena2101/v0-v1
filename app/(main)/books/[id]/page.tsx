"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HighlightCard } from "@/components/highlight-card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Book, Tag, HighlightWithTags } from "@/types/database"

interface HighlightWithBook extends HighlightWithTags {
  book: {
    title: string
    author: string | null
  }
}

export default function BookPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [highlights, setHighlights] = useState<HighlightWithBook[]>([])
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

  const fetchBookAndHighlights = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // Fetch book details
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", params.id)
        .single()

      if (bookError) throw bookError
      setBook(bookData)

      // Fetch highlights with tags
      const { data: highlightsData, error: highlightsError } = await supabase
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
        .eq("book_id", params.id)
        .order("created_at", { ascending: false })

      if (highlightsError) throw highlightsError

      // Format highlights data
      const formattedHighlights: HighlightWithBook[] = (highlightsData || []).map((h: any) => ({
        id: h.id,
        content: h.content,
        created_at: new Date(h.created_at),
        book: {
          title: h.books?.title || "Unknown Book",
          author: h.books?.author,
        },
        tags: h.tags?.map((t: any) => t.tag) || [],
      }))

      setHighlights(formattedHighlights)
    } catch (error: any) {
      console.error("Error fetching book data:", error)
      setError(error.message || "Failed to load book data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBookAndHighlights()
    }
  }, [user, params.id])

  const handleAddHighlight = () => {
    router.push(`/highlights/add?bookId=${params.id}`)
  }

  const handleEditHighlight = (id: string) => {
    router.push(`/highlights/${id}/edit`)
  }

  const handleDeleteHighlight = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("highlights").delete().eq("id", id)

      if (error) throw error

      // Refresh highlights
      fetchBookAndHighlights()
    } catch (error: any) {
      console.error("Error deleting highlight:", error)
      setError(error.message || "Failed to delete highlight")
    }
  }

  const handleAddTag = async (highlightId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from("highlight_tags")
        .insert({ highlight_id: highlightId, tag_id: tagId })

      if (error) throw error

      // Refresh highlights
      fetchBookAndHighlights()
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

      // Refresh highlights
      fetchBookAndHighlights()
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

  if (!book) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Book not found</h3>
        <p className="text-muted-foreground mb-6">The book you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => router.push("/books")}>Back to Books</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
          {book.author && <p className="text-muted-foreground mt-2">by {book.author}</p>}
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

      {highlights.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No highlights yet</h3>
          <p className="text-muted-foreground mb-6">Add your first highlight for this book</p>
          <Button onClick={handleAddHighlight}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Your First Highlight
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {highlights.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              id={highlight.id}
              content={highlight.content}
              bookTitle={highlight.book.title}
              author={highlight.book.author || undefined}
              createdAt={highlight.created_at}
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
      )}
    </div>
  )
}
