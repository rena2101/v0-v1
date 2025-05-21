export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          author?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string | null
          user_id?: string
          created_at?: string
        }
      }
      highlights: {
        Row: {
          id: string
          content: string
          book_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          book_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          book_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Book = Database["public"]["Tables"]["books"]["Row"]
export type Highlight = Database["public"]["Tables"]["highlights"]["Row"]

export type NewBook = Omit<Database["public"]["Tables"]["books"]["Insert"], "user_id" | "id" | "created_at">
export type NewHighlight = Omit<Database["public"]["Tables"]["highlights"]["Insert"], "user_id" | "id" | "created_at">

export interface Book {
  id: string
  title: string
  author: string | null
  created_at: string
  user_id: string
}

export interface Highlight {
  id: string
  content: string
  book_id: string
  created_at: string
  user_id: string
  page_number?: number
}

export interface NewHighlight {
  content: string
  book_id: string
  page_number?: number
}

export interface Tag {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export interface HighlightTag {
  highlight_id: string
  tag_id: string
  created_at: string
}

export interface HighlightWithTags extends Highlight {
  tags: Tag[]
}
