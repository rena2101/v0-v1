import { Book } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface BookCardProps {
  id: string
  title: string
  author?: string
  highlightCount: number
}

export function BookCard({ id, title, author, highlightCount }: BookCardProps) {
  return (
    <Link href={`/books/${id}`}>
      <Card className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {highlightCount} {highlightCount === 1 ? "highlight" : "highlights"}
            </Badge>
          </div>
          {author && <p className="text-sm text-muted-foreground">{author}</p>}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-muted-foreground">
            <Book className="h-4 w-4 mr-2" />
            <span className="text-xs">Added to your library</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
