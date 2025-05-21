"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { NewBook } from "@/types/database"

export default function AddBookPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState<NewBook>({
    title: "",
    author: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "Book title is required" })
      return
    }

    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to add a book" })
      return
    }

    try {
      setIsSubmitting(true)
      setMessage(null)

      const { data, error } = await supabase
        .from("books")
        .insert({
          title: formData.title.trim(),
          author: formData.author?.trim() || null,
          user_id: user.id,
        })
        .select()

      if (error) {
        throw error
      }

      setMessage({ type: "success", text: "Book added successfully!" })

      // Reset form
      setFormData({ title: "", author: "" })

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/library")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error adding book:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to add book. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Book</h1>
        <p className="text-muted-foreground mt-2">Add a new book to your library</p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>Enter the details of the book you want to add</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium leading-none">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter book title"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="author" className="text-sm font-medium leading-none">
                Author (optional)
              </label>
              <Input
                id="author"
                name="author"
                value={formData.author || ""}
                onChange={handleChange}
                placeholder="Enter author name"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Book...
                </>
              ) : (
                "Add Book"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

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
