"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PublicStoreView from "../../../components/views/PublicStoreView"
import { CheckoutView } from "../../../components/views/CheckoutView"
import { getUser } from "@/services/userService"
import type { CartItem, ImageAsset, User } from "../../../types"

type View = "store" | "checkout"

export default function PublicStorePage({ params }: { params: { storeId: string } }) {
  const router = useRouter()
  const { storeId } = params
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentView, setCurrentView] = useState<View>("store")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      console.log("[v0] PublicStorePage - Loading user")
      try {
        const user = await getUser()
        setCurrentUser(user)
        console.log("[v0] User loaded:", user ? user.name : "Not authenticated")
      } catch (error) {
        console.error("[v0] Error loading user:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  const handleAddToCart = (product: ImageAsset) => {
    console.log("[v0] Adding product to cart:", product.id, product.name)

    const existingItemIndex = cart.findIndex((item) => item.id === product.id)

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity = (updatedCart[existingItemIndex].quantity || 1) + 1
      setCart(updatedCart)
      console.log("[v0] Incremented quantity for product:", product.id)
    } else {
      const cartItem: CartItem = {
        ...product,
        cartId: `${product.id}-${Date.now()}`,
        quantity: 1,
      }
      setCart([...cart, cartItem])
      console.log("[v0] Added new product to cart:", product.id, "Total items:", cart.length + 1)
    }
  }

  const handleRemoveFromCart = (cartId: string) => {
    console.log("[v0] Removing item from cart:", cartId)
    const updatedCart = cart.filter((item) => item.cartId !== cartId)
    setCart(updatedCart)
    console.log("[v0] Cart updated. Remaining items:", updatedCart.length)
  }

  const handleTryOn = (product: ImageAsset) => {
    console.log("[v0] Try-on button clicked for product:", product.id)

    if (!currentUser) {
      console.log("[v0] User not authenticated, redirecting to login")
      // Save the return URL with product info
      const returnUrl = `/loja/${storeId}?tryOn=${product.id}`
      router.push(`/login?redirectTo=${encodeURIComponent(returnUrl)}`)
      return
    }

    console.log("[v0] User authenticated, navigating to atelier with product")
    // Navigate to atelier with product to try on
    router.push(`/atelier?tryOnProduct=${product.id}&tryOnStore=${storeId}`)
  }

  const handleNavigate = (view: string) => {
    console.log("[v0] Navigating to:", view)
    if (view === "checkout") {
      setCurrentView("checkout")
    } else if (view === "auth" || view === "landing") {
      router.push(view === "auth" ? "/login" : "/")
    } else {
      setCurrentView("store")
    }
  }

  const handleClearCart = () => {
    console.log("[v0] Clearing cart")
    setCart([])
  }

  const handleBackToStore = () => {
    console.log("[v0] Navigating back to store")
    setCurrentView("store")
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando loja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {currentView === "store" ? (
        <PublicStoreView
          storeId={storeId}
          onNavigate={handleNavigate}
          onTryOn={handleTryOn}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          cart={cart}
          currentUser={currentUser}
        />
      ) : (
        <CheckoutView
          cart={cart}
          storeId={storeId}
          onNavigate={handleNavigate}
          onBack={handleBackToStore}
          onClearCart={handleClearCart}
          onRemoveItem={handleRemoveFromCart}
        />
      )}
    </div>
  )
}
