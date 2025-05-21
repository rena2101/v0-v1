"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Pencil, Trash2, Tag } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface HighlightCardProps {
  id: string
  content: string
  bookTitle: string
  author?: string
  createdAt: Date
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function HighlightCard({
  id,
  content,
  bookTitle,
  author,
  createdAt,
  onEdit,
  onDelete,
}: HighlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const displayContent = isExpanded ? content : content.length > 150 ? `${content.substring(0, 150)}...` : content

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(id);
      } else {
        console.warn("onDelete function is not provided.");
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-base font-medium font-charter">{bookTitle}</CardTitle>
          {author && <p className="text-sm text-gray-600">{author}</p>}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm leading-relaxed">{displayContent}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <span className="text-xs text-gray-400">{format(new Date(createdAt), "MMM d, yyyy")}</span>

        <div className="flex items-center space-x-4 text-gray-500">
          {onEdit && (
            <button className="flex items-center space-x-1 hover:text-blue-600" onClick={() => onEdit(id)}>
              <Pencil size={16} />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                 <button className="flex items-center space-x-1 hover:text-red-600">
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa Highlight</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa highlight này không? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
