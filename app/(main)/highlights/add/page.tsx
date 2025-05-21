"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Book, NewHighlight } from "@/types/database"

export default function AddHighlightPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [formData, setFormData] = useState<NewHighlight & { page_number?: string }>({
    content: "",
    book_id: "",
    page_number: "",
  })

  // Fetch user's books
  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return

      try {
        setIsLoadingBooks(true)
        const { data, error } = await supabase.from("books").select("*").order("title", { ascending: true })

        if (error) {
          throw error
        }

        setBooks(data || [])
      } catch (error) {
        console.error("Error fetching books:", error)
      } finally {
        setIsLoadingBooks(false)
      }
    }

    fetchBooks()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, book_id: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      setMessage({ type: "error", text: "Highlight content is required" })
      return
    }

    if (!formData.book_id) {
      setMessage({ type: "error", text: "Please select a book" })
      return
    }

    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to add a highlight" })
      return
    }

    try {
      setIsSubmitting(true)
      setMessage(null)

      const { data, error } = await supabase
        .from("highlights")
        .insert({
          content: formData.content.trim(),
          book_id: formData.book_id,
          user_id: user.id,
        })
        .select()

      if (error) {
        throw error
      }

      setMessage({ type: "success", text: "Highlight added successfully!" })

      // Reset form
      setFormData({ content: "", book_id: "", page_number: "" })

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/highlights")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error adding highlight:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to add highlight. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thêm Highlight Mới</h1>
        <p className="text-muted-foreground mt-2">Thêm highlight mới từ sách của bạn</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push("/highlights/add/upload")}
          >
            <Upload className="h-4 w-4" />
            Upload file
          </Button>
        </div>

        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Chi tiết Highlight</CardTitle>
              <CardDescription>Nhập thông tin highlight bạn muốn thêm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="book_id" className="text-sm font-medium leading-none">
                  Sách <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.book_id}
                  onValueChange={handleSelectChange}
                  disabled={isLoadingBooks || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sách" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title} {book.author ? `- ${book.author}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {books.length === 0 && !isLoadingBooks && (
                  <p className="text-sm text-muted-foreground">Không tìm thấy sách. Vui lòng thêm sách trước.</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium leading-none">
                  Nội dung Highlight <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Nhập nội dung highlight"
                  className="min-h-[120px]"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || books.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  "Thêm Highlight"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {message && (
        <Alert
          className={`border ${
            message.type === "success"
              ? "border-green-500/20 bg-green-500/10"
              : "border-destructive/20 bg-destructive/10"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
