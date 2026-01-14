"use client"

import { useState, useEffect } from "react"
import {
  getAssets,
  getJobs,
  getStatsCount,
  createAsset,
  saveAsset,
  deleteAssetWithStrategy,
  deleteJobFull,
  toggleAssetFavorite,
  toggleJobFavorite,
  uploadBlobToStorage,
  failJob,
  getStoreNamesByIds,
  updateAsset, // Added updateAsset import
} from "../services/storageService"
import type { User, ImageAsset, TryOnJob } from "../types"

export const useAppData = (currentUser: User | null, currentView: string) => {
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [assets, setAssets] = useState<ImageAsset[]>([])
  const [jobs, setJobs] = useState<TryOnJob[]>([])
  const [stats, setStats] = useState({ products: 0, models: 0, jobs: 0, processing: 0 })

  // Tempo limite para considerar um job como "travado" (10 minutos)
  const STALE_JOB_TIMEOUT_MS = 10 * 60 * 1000

  const loadData = async () => {
    if (!currentUser) return
    setIsLoadingData(true)
    const timeoutId = setTimeout(() => setIsLoadingData(false), 10000)
    try {
      if (currentView === "dashboard") {
        const [fetchedJobs, fetchedStats] = await Promise.all([getJobs(4), getStatsCount()])

        // Verificação de Jobs Estagnados (Dashboard)
        fetchedJobs.forEach((job) => {
          if (job.status === "processing" && job.createdAt) {
            const createdTime = new Date(job.createdAt).getTime()
            if (Date.now() - createdTime > STALE_JOB_TIMEOUT_MS) {
              // Marca como falha no DB (sem await para não travar UI)
              if (job.id) failJob(job.id)
              // Atualiza visualmente para o usuário imediatamente
              job.status = "failed"
            }
          }
        })

        setJobs(fetchedJobs)
        setStats(fetchedStats)
        const allAssets = await getAssets()
        setAssets(allAssets)
      } else if (currentView === "products" || currentView === "models" || currentView === "studio") {
        const fetchedAssets = await getAssets()
        setAssets(fetchedAssets)
      } else if (currentView === "gallery") {
        const fetchedJobs = await getJobs(50)

        // 1. Identificar donos de produtos externos (Lojas Parceiras)
        const externalOwnerIds = Array.from(
          new Set(fetchedJobs.map((j) => j.productOwnerId).filter((id): id is string => !!id && id !== currentUser.id)),
        )

        // 2. Buscar nomes das lojas em batch
        const storeMap = await getStoreNamesByIds(externalOwnerIds)

        // 3. Enriquecer Jobs e Verificar Estagnados
        let hasStale = false
        const cleanedJobs = fetchedJobs.map((job) => {
          // Verificar Timeout
          if (job.status === "processing" && job.createdAt) {
            const createdTime = new Date(job.createdAt).getTime()
            if (Date.now() - createdTime > STALE_JOB_TIMEOUT_MS) {
              if (job.id) failJob(job.id)
              hasStale = true
              return { ...job, status: "failed" } as TryOnJob
            }
          }

          // Adicionar Nome da Loja se aplicável
          if (job.productOwnerId && job.productOwnerId !== currentUser.id) {
            job.storeName = storeMap[job.productOwnerId]
          }

          return job
        })

        setJobs(cleanedJobs)
        if (hasStale) {
          // Recarrega stats se houve mudança para atualizar contadores
          getStatsCount().then(setStats)
        }

        if (assets.length < 2) setAssets(await getAssets())
      }
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      clearTimeout(timeoutId)
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (currentUser && currentView !== "auth" && currentView !== "landing") {
      loadData()
    }
  }, [currentView, currentUser])

  const handleImportAsset = async (type: "product" | "model", assetData: any) => {
    console.log("[v0] handleImportAsset - Iniciado", { type, hasId: !!assetData.id })

    if (!currentUser) {
      console.error("[v0] handleImportAsset - Erro: Usuário não autenticado")
      throw new Error("Sessão expirada. Faça login novamente.")
    }

    // If assetData has an ID, it's an update operation
    if (assetData.id) {
      console.log("[v0] handleImportAsset - Atualizando asset existente:", assetData.id)

      await updateAsset(assetData.id, {
        name: assetData.name,
        description: assetData.description,
        category: assetData.category,
        price: assetData.price,
        published: assetData.published,
      })

      console.log("[v0] handleImportAsset - Asset atualizado com sucesso")

      // Update local state
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetData.id
            ? {
                ...a,
                name: assetData.name,
                description: assetData.description,
                category: assetData.category,
                price: assetData.price,
                published: assetData.published,
              }
            : a,
        ),
      )

      return assets.find((a) => a.id === assetData.id)
    }

    // Create new asset (existing logic)
    console.log("[v0] handleImportAsset - Criando novo asset")
    let savedAsset: ImageAsset | null = null
    const folder = type === "product" ? "products" : "models"

    try {
      if (assetData.storagePath) {
        console.log("[v0] handleImportAsset - Usando storagePath existente")
        savedAsset = await createAsset({
          user_id: currentUser.id,
          name: assetData.name,
          description: assetData.description,
          category: assetData.category,
          type,
          source: "file",
          preview: assetData.preview,
          storage_path: assetData.storagePath,
          mimeType: assetData.mimeType,
          isFavorite: false,
          data: "",
          price: assetData.price,
          published: assetData.published,
        })
      } else if (assetData.file) {
        console.log("[v0] handleImportAsset - Fazendo upload de arquivo", {
          fileName: assetData.file.name,
          fileSize: assetData.file.size,
          fileType: assetData.file.type,
        })

        const uploadResult = await uploadBlobToStorage(assetData.file, currentUser.id, folder as any)
        console.log("[v0] handleImportAsset - Upload concluído:", uploadResult)

        console.log("[v0] handleImportAsset - Criando registro no banco de dados")
        savedAsset = await createAsset({
          user_id: currentUser.id,
          name: assetData.name,
          description: assetData.description,
          category: assetData.category,
          type,
          source: "file",
          preview: uploadResult.publicUrl,
          storage_path: uploadResult.path,
          mimeType: assetData.mimeType,
          isFavorite: false,
          data: "",
          price: assetData.price,
          published: assetData.published,
        })
        console.log("[v0] handleImportAsset - Registro criado com sucesso:", savedAsset?.id)
      } else {
        if (assetData.source === "url") {
          console.log("[v0] handleImportAsset - Salvando URL diretamente")
          savedAsset = await saveAsset(
            currentUser.id,
            {
              name: assetData.name,
              description: assetData.description,
              category: assetData.category,
              type,
              source: "url",
              preview: assetData.originalUrl || assetData.preview,
              mimeType: assetData.mimeType,
              isFavorite: false,
              price: assetData.price,
              published: assetData.published,
            },
            assetData.data,
          )
        } else {
          console.log("[v0] handleImportAsset - Convertendo data URL e fazendo upload")
          const res = await fetch(assetData.data)
          const blob = await res.blob()
          console.log("[v0] handleImportAsset - Blob criado, iniciando upload", { size: blob.size })

          const uploadResult = await uploadBlobToStorage(blob, currentUser.id, folder as any)
          console.log("[v0] handleImportAsset - Upload de data URL concluído:", uploadResult)

          savedAsset = await createAsset({
            user_id: currentUser.id,
            name: assetData.name,
            description: assetData.description,
            category: assetData.category,
            type,
            source: "file",
            preview: uploadResult.publicUrl,
            storage_path: uploadResult.path,
            mimeType: assetData.mimeType,
            isFavorite: false,
            data: "",
            price: assetData.price,
            published: assetData.published,
          })
        }
      }
    } catch (uploadError: any) {
      console.error("[v0] handleImportAsset - ERRO DURANTE UPLOAD:", uploadError)
      throw new Error(`Falha no upload: ${uploadError.message || "Erro desconhecido"}`)
    }

    if (!savedAsset) {
      console.error("[v0] handleImportAsset - Erro: savedAsset é null")
      throw new Error("Falha ao salvar asset no banco de dados.")
    }

    console.log("[v0] handleImportAsset - Asset salvo com sucesso:", savedAsset.id)

    const cleanAsset = { ...savedAsset, data: undefined, file: undefined }

    setAssets((prev) => [cleanAsset, ...prev])
    setStats((prev) => ({
      ...prev,
      products: type === "product" ? prev.products + 1 : prev.products,
      models: type === "model" ? prev.models + 1 : prev.models,
    }))

    console.log("[v0] handleImportAsset - Estado atualizado com sucesso")
    return cleanAsset
  }

  const handleToggleLikeAsset = async (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, isFavorite: !a.isFavorite } : a)))
    try {
      await toggleAssetFavorite(assetId, asset.isFavorite || false)
    } catch (err) {}
  }

  const handleToggleLikeJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, isFavorite: !j.isFavorite } : j)))
    try {
      await toggleJobFavorite(jobId, job.isFavorite || false)
    } catch (err) {}
  }

  const handleDeleteAsset = async (assetId: string, strategy: "keep-history" | "delete-all") => {
    await deleteAssetWithStrategy(assetId, strategy)
    setAssets((prev) => prev.filter((a) => a.id !== assetId))
    if (strategy === "delete-all") loadData()
  }

  const handleDeleteJob = async (jobId: string) => {
    await deleteJobFull(jobId)
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
  }

  return {
    isLoadingData,
    assets,
    jobs,
    stats,
    setJobs,
    handleImportAsset,
    handleToggleLikeAsset,
    handleToggleLikeJob,
    handleDeleteAsset,
    handleDeleteJob,
    loadData,
  }
}
