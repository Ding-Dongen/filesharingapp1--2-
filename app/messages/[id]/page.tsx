import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar } from "lucide-react"
import { CommentList } from "@/components/posts/comment-list"
import { createClient } from "@/lib/supabase/server"

interface MessagePageProps {
  params: {
    id: string
  }
}

export default async function MessagePage({ params }: MessagePageProps) {
  const supabase = createClient()

  const { data: message, error } = await supabase
    .from("posts")
    .select("*, profiles(full_name, avatar_url, role)")
    .eq("id", params.id)
    .single()

  if (error || !message) {
    notFound()
  }

  const formattedDate = new Date(message.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/messages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={message.profiles?.avatar_url || ""} alt={message.profiles?.full_name || "User"} />
                <AvatarFallback>{message.profiles?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{message.profiles?.full_name || "Anonymous User"}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formattedDate}
                </div>
              </div>
            </div>

            {message.is_admin_post && <Badge variant="secondary">Announcement</Badge>}
          </div>

          <h1 className="text-3xl font-bold mb-4">{message.title}</h1>

          <div className="prose max-w-none">
            {message.content.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Suspense fallback={<CommentSkeleton />}>
          <CommentList postId={params.id} />
        </Suspense>
      </div>
    </div>
  )
}

function CommentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

