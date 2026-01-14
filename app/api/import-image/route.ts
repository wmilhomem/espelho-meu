import { createAdminClient, createAuthClient } from "@/lib/supabase-server"

interface ImportParams {
  url: string
  bucket: string
  dest_path: string
  make_public?: boolean
  fetch_og_only?: boolean
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const fetchWithTimeout = async (input: RequestInfo, init?: RequestInit, timeout = 15000): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { ok: false, error: "Missing or Invalid Authorization header" },
      { status: 401, headers: corsHeaders },
    )
  }

  const token = authHeader.split(" ")[1]
  const supabaseAuth = createAuthClient()
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token)

  if (authError || !user) {
    console.warn("[Import API] Token inválido ou expirado")
    return Response.json({ ok: false, error: "Unauthorized: Invalid Token" }, { status: 401, headers: corsHeaders })
  }

  try {
    const { url, bucket, dest_path, make_public = true, fetch_og_only = false }: ImportParams = await req.json()

    if (!url || !bucket || !dest_path) {
      return Response.json(
        { ok: false, error: "Missing required parameters (url, bucket, dest_path)" },
        { status: 400, headers: corsHeaders },
      )
    }

    if (!dest_path.startsWith(`${user.id}/`)) {
      console.warn(`[Import API] Tentativa de escrita não autorizada: User ${user.id} -> Path ${dest_path}`)
      return Response.json({ ok: false, error: "Unauthorized path prefix" }, { status: 403, headers: corsHeaders })
    }

    if (dest_path.includes("..")) {
      return Response.json(
        { ok: false, error: 'Invalid destination path (contains "..")' },
        { status: 400, headers: corsHeaders },
      )
    }

    console.log(`[Import API] Processing: ${url} -> ${bucket}/${dest_path} (User: ${user.id})`)

    let imageUrl = url
    const isDirectImage = /\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i.test(url.split("?")[0])

    if (!isDirectImage || fetch_og_only) {
      try {
        const pageRes = await fetchWithTimeout(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ImportBot/1.0)",
            Accept: "text/html,application/xhtml+xml,application/xml",
          },
        })

        if (pageRes.ok && (pageRes.headers.get("content-type") || "").includes("text/html")) {
          const html = await pageRes.text()

          const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
          const twitterMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)
          const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)

          if (ogMatch && ogMatch[1]) imageUrl = ogMatch[1].replace(/&amp;/g, "&")
          else if (twitterMatch && twitterMatch[1]) imageUrl = twitterMatch[1].replace(/&amp;/g, "&")
          else if (!fetch_og_only && imgMatch && imgMatch[1]) imageUrl = imgMatch[1]
        }
      } catch (e: any) {
        console.warn(`[Import API] Scraping error (ignorado): ${e.message}`)
      }
    }

    if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl
    if (imageUrl.startsWith("/")) {
      try {
        const origin = new URL(url).origin
        imageUrl = origin + imageUrl
      } catch (e) {}
    }

    let imageBuffer: ArrayBuffer
    let contentType: string

    try {
      const imgRes = await fetchWithTimeout(imageUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      })

      if (!imgRes.ok) {
        return Response.json(
          { ok: false, error: `Failed to fetch image: Status ${imgRes.status}` },
          { status: 422, headers: corsHeaders },
        )
      }

      contentType = imgRes.headers.get("content-type") || "application/octet-stream"
      if (!contentType.startsWith("image/")) {
        contentType = "image/jpeg"
      }

      imageBuffer = await imgRes.arrayBuffer()

      if (imageBuffer.byteLength > 10 * 1024 * 1024) {
        return Response.json(
          { ok: false, error: "Payload Too Large (Max 10MB)" },
          { status: 413, headers: corsHeaders },
        )
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        return Response.json(
          { ok: false, error: "Image download timed out (15s)" },
          { status: 408, headers: corsHeaders },
        )
      }
      return Response.json(
        { ok: false, error: `Image download failed: ${e.message}` },
        { status: 500, headers: corsHeaders },
      )
    }

    const supabaseAdmin = createAdminClient()

    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(dest_path, imageBuffer, {
      contentType: contentType,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      if ((uploadError as any).statusCode === "409" || uploadError.message.includes("already exists")) {
        return Response.json({ ok: false, error: "File already exists" }, { status: 409, headers: corsHeaders })
      }
      console.error("[Import API] Storage Upload Error:", uploadError.message)
      return Response.json({ ok: false, error: "Failed to save to storage" }, { status: 500, headers: corsHeaders })
    }

    let finalUrl = ""
    let signedUrl = ""

    if (make_public) {
      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(dest_path)
      finalUrl = data.publicUrl
    } else {
      const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(dest_path, 60 * 60)
      if (data) signedUrl = data.signedUrl
    }

    return Response.json(
      {
        ok: true,
        publicUrl: finalUrl,
        signedUrl: signedUrl,
        dest_path: dest_path,
        bucket: bucket,
      },
      { headers: corsHeaders },
    )
  } catch (error: any) {
    console.error("[Import API] Internal Request Error:", error)
    return Response.json(
      { ok: false, error: error.message || "Internal server error during processing" },
      { status: 500, headers: corsHeaders },
    )
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders })
}
