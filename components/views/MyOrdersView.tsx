"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Order } from "../../types"
import { getUserOrders } from "../../services/storageService"
import LazyImage from "../LazyImage"

interface MyOrdersViewProps {
  onNavigate: (view: any) => void
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getUserOrders()
        setOrders(data)
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "shipped":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "delivered":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago"
      case "shipped":
        return "Enviado"
      case "delivered":
        return "Entregue"
      case "cancelled":
        return "Cancelado"
      case "pending":
        return "Pendente"
      default:
        return status
    }
  }

  return (
    <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-serif">Meus Pedidos</h2>
          <p className="text-gray-400 text-sm font-light">Acompanhe suas compras de luxo.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center border border-white/10 rounded-2xl bg-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-500 text-sm mb-6">Explore nossas vitrines e faça sua primeira compra.</p>
          <button
            onClick={() => onNavigate("dashboard")}
            className="gold-gradient-bg px-6 py-2 rounded-full text-black text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Explorar Loja
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="glass-card-block p-6 rounded-xl border border-white/10 bg-[#0a0112] hover:border-theme-accent/30 transition-all group"
            >
              {/* Header do Pedido */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-white/5 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white font-serif">
                      {order.store_name || "Loja Espelho Meu"}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">
                    Pedido #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-theme-accent text-xl font-bold">R$ {order.total_amount.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total da Compra</p>
                </div>
              </div>

              {/* Lista de Itens (Visual) */}
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex-shrink-0 w-24 group/item">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden border border-white/10 bg-black/50 mb-2 relative">
                      <LazyImage
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity"
                      />
                      <div className="absolute bottom-0 right-0 bg-black/80 px-1.5 py-0.5 text-[9px] text-white font-bold rounded-tl">
                        x{item.quantity}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{item.product_name}</p>
                  </div>
                ))}
              </div>

              {/* Rodapé do Card */}
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Enviado para:{" "}
                  <span className="text-gray-300">
                    {order.customer_details.address}, {order.customer_details.city}
                  </span>
                </div>
                <button className="text-theme-accent text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                  Ajuda
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
