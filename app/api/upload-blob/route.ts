import { adminClient, authClient } from "@/lib/supabase-server"
const BUCKET_NAME = "espelho-assets"

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  console.log(`[API/upload-blob][${requestId}] 🕒 START`)

  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn(`[API/upload-blob][${requestId}] ⛔ Unauthorized: Missing Token`)
      return new Response(JSON.stringify({ error: "Unauthorized: Missing Bearer Token" }), { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token)

    if (authError || !user) {
      console.warn(`[API/upload-blob][${requestId}] ⛔ Unauthorized: Invalid Token`, authError)
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid Token" }), { status: 401 })
    }

    console.log(`[API/upload-blob][${requestId}] 👤 Authenticated User: ${user.id}`)

    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const folder = formData.get("folder") as string

    if (userId !== user.id) {
      console.warn(`[API/upload-blob][${requestId}] ⚠️ ID Mismatch: Token(${user.id}) vs Body(${userId})`)
    }

    if (!file?.size || !userId || !folder) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const timestamp = Date.now()
    const filePath = `${userId}/${folder}/${timestamp}_${safeName}`

    console.log(`[API/upload-blob][${requestId}] 📤 Uploading to path: ${filePath}`)

    const { data, error } = await adminClient.storage.from(BUCKET_NAME).upload(filePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    })

    if (error) {
      console.error(`[API/upload-blob][${requestId}] 💥 Storage Error:`, JSON.stringify(error))
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(data!.path as string)

    return new Response(
      JSON.stringify({
        publicUrl,
        path: data!.path,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (e: any) {
    console.error(`[API/upload-blob][${requestId}] 💥 FATAL:`, e)
    return new Response(JSON.stringify({ error: e.message || "Internal Server Error" }), { status: 500 })
  }
}
