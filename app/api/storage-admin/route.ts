import { createAdminClient, createAuthClient } from "@/lib/supabase-server"

const ASSETS_BUCKET = process.env.NEXT_PUBLIC_ASSETS_BUCKET || "espelho-assets"

export async function POST(req: Request) {
  try {
    const supabase = createAuthClient()
    const supabaseAdmin = createAdminClient()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ ok: false, message: "Missing Authorization header" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token)

    if (userErr || !user) {
      return Response.json({ ok: false, message: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const { action, assetId, path } = body

    if (action === "delete") {
      let storagePath = path

      if (!storagePath && assetId) {
        const { data: asset, error: fetchErr } = await supabaseAdmin
          .from("assets")
          .select("storage_path, user_id")
          .eq("id", assetId)
          .single()

        if (fetchErr || !asset) {
          return Response.json({ ok: false, message: "Asset not found" }, { status: 404 })
        }

        if (asset.user_id && asset.user_id !== user.id) {
          return Response.json({ ok: false, message: "Unauthorized action on this asset" }, { status: 403 })
        }

        storagePath = asset.storage_path
      }

      if (!storagePath && path) {
        if (!path.startsWith(`${user.id}/`)) {
          return Response.json({ ok: false, message: "Unauthorized path" }, { status: 403 })
        }
        storagePath = path
      }

      if (!storagePath) {
        return Response.json({ ok: false, message: "No valid path found for deletion" }, { status: 400 })
      }

      const { error: storageErr } = await supabaseAdmin.storage.from(ASSETS_BUCKET).remove([storagePath])

      if (storageErr) {
        console.error("[Storage Admin] Storage delete failed:", storageErr)
        return Response.json({ ok: false, message: "Failed to remove file from storage" }, { status: 500 })
      }

      if (assetId) {
        await supabaseAdmin.from("jobs").delete().or(`product_id.eq.${assetId},model_id.eq.${assetId}`)
        const { error: dbErr } = await supabaseAdmin.from("assets").delete().eq("id", assetId)
        if (dbErr) {
          return Response.json({ ok: false, message: "File deleted but DB record failed" }, { status: 500 })
        }
      }

      return Response.json({ ok: true, message: "Deleted successfully" })
    }

    return Response.json({ ok: false, message: "Unknown action" }, { status: 400 })
  } catch (error: any) {
    console.error("[Storage Admin] Error:", error)
    return Response.json({ ok: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
