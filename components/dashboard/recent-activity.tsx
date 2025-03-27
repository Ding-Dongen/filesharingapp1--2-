import Link from "next/link"
import { FileText, MessageSquare } from "lucide-react"

interface RecentActivityProps {
  files?: any[]
  posts?: any[]
}

export function RecentActivity({ files = [], posts = [] }: RecentActivityProps) {
  // Combine and sort by date
  const activities = [
    ...files.map((file) => ({
      type: "file",
      id: file.id,
      title: file.name,
      user: file.profiles?.full_name,
      date: new Date(file.created_at),
    })),
    ...posts.map((post) => ({
      type: "post",
      id: post.id,
      title: post.title,
      user: post.profiles?.full_name,
      date: new Date(post.created_at),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  if (activities.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No recent activity</div>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4 rounded-lg border p-3">
          {activity.type === "file" ? (
            <FileText className="h-8 w-8 text-purple-500" />
          ) : (
            <MessageSquare className="h-8 w-8 text-blue-500" />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-medium">
              {activity.type === "file" ? (
                <Link href={`/files/${activity.id}`} className="hover:underline">
                  {activity.title}
                </Link>
              ) : (
                <Link href={`/messages`} className="hover:underline">
                  {activity.title}
                </Link>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.type === "file" ? "Uploaded" : "Posted"} by {activity.user} on{" "}
              {activity.date.toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

