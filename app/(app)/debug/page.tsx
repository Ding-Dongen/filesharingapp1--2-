"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        setStatus("loading")
        setMessage("Testing Supabase connection...")

        const supabase = createClient()

        // Test auth
        setMessage("Testing authentication...")
        const { data: authData, error: authError } = await supabase.auth.getSession()

        if (authError) {
          throw new Error(`Auth error: ${authError.message}`)
        }

        // Test database
        setMessage("Testing database connection...")
        const { count, error: dbError } = await supabase.from("files").select("*", { count: "exact", head: true })

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`)
        }

        // Test storage
        setMessage("Testing storage connection...")
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets()

        if (storageError) {
          throw new Error(`Storage error: ${storageError.message}`)
        }

        setStatus("success")
        setMessage("All connections successful!")
        setDetails({
          auth: authData,
          database: { fileCount: count },
          storage: { buckets },
        })
      } catch (error: any) {
        console.error("Connection test error:", error)
        setStatus("error")
        setMessage(error.message || "Unknown error")
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Debug</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                status === "loading" ? "bg-yellow-500" : status === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <p>{message}</p>
          </div>

          {status === "error" && (
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>

      {status === "success" && details && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Authentication</h3>
                <p>Session: {details.auth.session ? "Active" : "None"}</p>
              </div>

              <div>
                <h3 className="font-medium">Database</h3>
                <p>File Count: {details.database.fileCount}</p>
              </div>

              <div>
                <h3 className="font-medium">Storage</h3>
                <p>Buckets: {details.storage.buckets.length}</p>
                <ul className="list-disc pl-5 mt-2">
                  {details.storage.buckets.map((bucket: any) => (
                    <li key={bucket.id}>{bucket.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

