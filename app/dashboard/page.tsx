"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HighlightCard } from "@/components/highlight-card"
import { NewHighlightForm } from "@/components/new-highlight-form"
import { BookOpen, BookMarked, Mail, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import type { Book, Tag } from "@/types/database"

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [recentHighlights, setRecentHighlights] = useState<any[]>([])
  const [totalBooks, setTotalBooks] = useState(0)
  const [totalHighlights, setTotalHighlights] = useState(0)
  const [userName, setUserName] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])

  // Hàm để lấy dữ liệu dashboard
  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // Lấy danh sách tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true })

      if (tagsError) throw tagsError
      setTags(tagsData || [])

      // Thử sử dụng stored procedure để lấy tất cả dữ liệu trong một request
      const { data: statsData, error: statsError } = await supabase.rpc("get_dashboard_stats", {
        user_id_param: user.id,
      })

      if (!statsError && statsData) {
        // Nếu stored procedure hoạt động, sử dụng dữ liệu từ đó
        setTotalBooks(statsData.total_books || 0)
        setTotalHighlights(statsData.total_highlights || 0)
        setBooks(statsData.books || [])

        // Format highlights với thông tin sách và tags
        const formattedHighlights = await Promise.all(
          (statsData.recent_highlights || []).map(async (highlight: any) => {
            const { data: highlightTags } = await supabase
              .from("highlight_tags")
              .select("tag:tags(*)")
              .eq("highlight_id", highlight.id)

            return {
              id: highlight.id,
              content: highlight.content,
              bookTitle: highlight.book_title || "Unknown Book",
              author: highlight.book_author || undefined,
              createdAt: new Date(highlight.created_at),
              tags: highlightTags?.map((t: any) => t.tag) || [],
            }
          }),
        )

        setRecentHighlights(formattedHighlights)
      } else {
        // Fallback: Nếu stored procedure không hoạt động, sử dụng các request riêng biệt
        console.warn("Stored procedure failed, falling back to separate requests", statsError)

        // Lấy tổng số sách
        const { count: bookCount, error: bookCountError } = await supabase
          .from("books")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (bookCountError) throw bookCountError
        setTotalBooks(bookCount || 0)

        // Lấy tổng số highlight
        const { count: highlightCount, error: highlightCountError } = await supabase
          .from("highlights")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (highlightCountError) throw highlightCountError
        setTotalHighlights(highlightCount || 0)

        // Lấy danh sách sách
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("*")
          .eq("user_id", user.id)
          .order("title", { ascending: true })

        if (booksError) throw booksError
        setBooks(booksData || [])

        // Lấy highlight gần đây
        const { data: highlightsData, error: highlightsError } = await supabase
          .from("highlights")
          .select("id, content, created_at, book_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3)

        if (highlightsError) throw highlightsError

        // Lấy thông tin sách và tags cho mỗi highlight
        const highlightsWithBooks = await Promise.all(
          (highlightsData || []).map(async (highlight) => {
            const { data: bookData } = await supabase
              .from("books")
              .select("title, author")
              .eq("id", highlight.book_id)
              .single()

            const { data: highlightTags } = await supabase
              .from("highlight_tags")
              .select("tag:tags(*)")
              .eq("highlight_id", highlight.id)

            return {
              id: highlight.id,
              content: highlight.content,
              bookTitle: bookData?.title || "Unknown Book",
              author: bookData?.author,
              createdAt: new Date(highlight.created_at),
              tags: highlightTags?.map((t: any) => t.tag) || [],
            }
          }),
        )

        setRecentHighlights(highlightsWithBooks)
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Lấy dữ liệu khi component mount hoặc user thay đổi
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  useEffect(() => {
    const loadUserName = async () => {
      if (!user) return

      try {
        // Lấy tên từ cột name của bảng public.users
        const { data, error } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single()

        if (error) throw error
        setUserName(data?.name || null)
      } catch (error) {
        console.error("Error loading user name:", error)
      }
    }

    loadUserName()
  }, [user])

  const handleAddHighlight = async (values: { content: string; bookId: string }) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("highlights")
        .insert({
          content: values.content.trim(),
          book_id: values.bookId,
          user_id: user.id,
        })
        .select()

      if (error) throw error

      // Refresh the dashboard data
      fetchDashboardData()
    } catch (error) {
      console.error("Error adding highlight:", error)
    }
  }

  const handleAddBook = (book: { title: string; author?: string }) => {
    router.push("/books/add")
  }

  const handleEditHighlight = (id: string) => {
    router.push(`/highlights/${id}/edit`)
  }

  const handleDeleteHighlight = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("highlights").delete().eq("id", id)

      if (error) throw error

      // Refresh the dashboard data
      fetchDashboardData()
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

      // Refresh the dashboard data
      fetchDashboardData()
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

      // Refresh the dashboard data
      fetchDashboardData()
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading your dashboard data...</p>
        <div className="text-xs text-muted-foreground">Counting books and highlights</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {userName 
            ? `Welcome back, ${userName}!`
            : `Welcome back, ${user?.email?.split("@")[0] || ""}!`}
        </h1>
        <p className="text-muted-foreground mt-2">
          {userName 
            ? "Here's an overview of your reading progress."
            : "Complete your profile in Settings to personalize your experience."}
        </p>
      </div>

      {error && (
        <Alert className="border border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBooks}</div>
            <p className="text-xs text-muted-foreground">Books in your library</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Highlights</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHighlights}</div>
            <p className="text-xs text-muted-foreground">Highlights saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Delivery</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">Daily highlight delivery</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <NewHighlightForm books={books} onSubmit={handleAddHighlight} onAddBook={handleAddBook} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Highlights</h2>
          <div className="space-y-4">
            {recentHighlights.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                id={highlight.id}
                content={highlight.content}
                bookTitle={highlight.bookTitle}
                author={highlight.author}
                createdAt={highlight.createdAt}
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
      </div>
    </div>
  )
}
