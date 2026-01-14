"use client"

import { AllStoresView } from "@/components/views/AllStoresView"
import { useRouter } from "next/navigation"

export default function LojasPage() {
  const router = useRouter()

  const handleNavigateToStore = (storeId: string) => {
    router.push(`/loja/${storeId}`)
  }

  const handleBack = () => {
    router.push("/")
  }

  return <AllStoresView onNavigateToStore={handleNavigateToStore} onBack={handleBack} />
}
