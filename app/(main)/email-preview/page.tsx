"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { EmailPreview } from "@/components/email-preview"
import { Loader2, RefreshCw, AlertCircle, Send } from "lucide-react"

export default function EmailPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<any[]>([])
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [selectedHighlight, setSelectedHighlight] = useState<any | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("preview")
  const [userName, setUserName] = useState<string>("")

  // Get user's name if available
  useEffect(() => {
    if (user?.email) {
      // Extract name from email as fallback
      const nameFromEmail = user.email.split("@")[0]
      setUserName(nameFromEmail)

      // Try to get actual name from profile
      const fetchUserName = async () => {
        try {
          const { data } = await supabase.from("users").select("name").eq("id", user.id).single()

          if (data?.name) {
            setUserName(data.name)
          }
        } catch (error) {
          console.log("Error fetching user name:", error)
        }
      }

      fetchUserName()
    }
  }, [user])

  // Check if a highlight ID was provided in the URL
  useEffect(() => {
    const highlightId = searchParams.get("highlight")
    if (highlightId) {
      setSelectedHighlightId(highlightId)
    }
  }, [searchParams])

  // Fetch highlights from Supabase
  useEffect(() => {
    const fetchHighlights = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("highlights")
          .select(`
            id, 
            content, 
            book_id, 
            books:book_id (
              title, 
              author
            )
          `)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) {
          throw error
        }

        setHighlights(data || [])

        // If we have a selected highlight ID, find it in the data
        if (selectedHighlightId && data) {
          const highlight = data.find((h) => h.id === selectedHighlightId)
          if (highlight) {
            setSelectedHighlight(highlight)
          } else if (data.length > 0) {
            // If the selected ID wasn't found but we have highlights, select the first one
            setSelectedHighlightId(data[0].id)
            setSelectedHighlight(data[0])
          }
        } else if (data && data.length > 0) {
          // If no highlight was selected but we have data, select the first one
          setSelectedHighlightId(data[0].id)
          setSelectedHighlight(data[0])
        }
      } catch (err: any) {
        console.error("Error fetching highlights:", err)
        setError(err.message || "Failed to load highlights")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHighlights()
  }, [user, selectedHighlightId])

  // Update selected highlight when the ID changes
  useEffect(() => {
    if (selectedHighlightId && highlights.length > 0) {
      const highlight = highlights.find((h) => h.id === selectedHighlightId)
      setSelectedHighlight(highlight || null)
    }
  }, [selectedHighlightId, highlights])

  const handleHighlightChange = (id: string) => {
    setSelectedHighlightId(id)
    // Update the URL with the selected highlight ID
    router.push(`/email-preview?highlight=${id}`)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
    setSendResult(null)

    // Re-fetch the data
    const fetchHighlights = async () => {
      try {
        const { data, error } = await supabase
          .from("highlights")
          .select(`
            id, 
            content, 
            book_id, 
            books:book_id (
              title, 
              author
            )
          `)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) {
          throw error
        }

        setHighlights(data || [])

        // If we have a selected highlight, find it in the new data
        if (selectedHighlightId && data) {
          const highlight = data.find((h) => h.id === selectedHighlightId)
          if (highlight) {
            setSelectedHighlight(highlight)
          }
        }
      } catch (err: any) {
        console.error("Error refreshing highlights:", err)
        setError(err.message || "Failed to refresh highlights")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHighlights()
  }

  const handleSendTestEmail = async () => {
    if (!selectedHighlight || !user?.email) return

    try {
      setIsSending(true)
      setSendResult(null)
      setError(null)

      const response = await fetch("/api/send-preview-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          highlightId: selectedHighlight.id,
          recipientName: userName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test email")
      }

      setSendResult(data)
      setActiveTab("sent")
    } catch (err: any) {
      console.error("Error sending test email:", err)
      setError(err.message || "Failed to send test email")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Preview</h1>
        <p className="text-muted-foreground mt-2">Preview how your highlights will look when sent as emails</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Select Highlight</h2>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : highlights.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No highlights found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select value={selectedHighlightId || ""} onValueChange={handleHighlightChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a highlight" />
                      </SelectTrigger>
                      <SelectContent>
                        {highlights.map((highlight) => (
                          <SelectItem key={highlight.id} value={highlight.id}>
                            {highlight.books?.title || "Unknown Book"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedHighlight && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Book:</span> {selectedHighlight.books?.title || "Unknown Book"}
                        </div>
                        {selectedHighlight.books?.author && (
                          <div className="text-sm">
                            <span className="font-medium">Author:</span> {selectedHighlight.books.author}
                          </div>
                        )}
                        <div className="text-sm line-clamp-3">
                          <span className="font-medium">Content:</span> {selectedHighlight.content}
                        </div>
                      </div>
                    )}

                    <Button onClick={handleSendTestEmail} disabled={isSending || !selectedHighlight} className="w-full">
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Test Email
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="sent">Sent Emails</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : selectedHighlight ? (
                <EmailPreview
                  title={selectedHighlight.books?.title || "Unknown Book"}
                  author={selectedHighlight.books?.author || "Unknown Author"}
                  content={selectedHighlight.content}
                  recipientName={userName}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <p className="text-muted-foreground">Select a highlight to preview</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {sendResult ? (
                    <div className="space-y-4">
                      <Alert className="border border-green-500/20 bg-green-500/10">
                        <AlertDescription>
                          Test email sent successfully!
                          <div className="mt-2 text-xs">
                            <div>
                              <span className="font-medium">Email ID:</span> {sendResult.data?.id}
                            </div>
                            <div>
                              <span className="font-medium">Sent to:</span> {sendResult.data?.to}
                            </div>
                            <div>
                              <span className="font-medium">Time:</span> {new Date().toLocaleString()}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                      <p className="text-sm text-muted-foreground">
                        Check your inbox to see how the email looks. If you don't see it, check your spam folder.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No emails sent yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Select a highlight and click "Send Test Email" to send a test email
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
