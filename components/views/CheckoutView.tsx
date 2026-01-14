"use client"

import type React from "react"
import { useState } from "react"
import type { CartItem } from "../../types"
import LazyImage from "../LazyImage"
import { createOrder } from "../../services/storageService"

interface CheckoutViewProps {
  cart: CartItem[]
  storeId: string | null
  onNavigate: (view: any) => void
  onBack: () => void
  onClearCart: () => void
  onRemoveItem: (cartId: string) => void
}

// CHANGE: Renamed to CheckoutView as per the task
export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  storeId,
  onNavigate,
  onBack,
  onClearCart,
  onRemoveItem,
}) => {
  const [step, setStep] = useState(1) // 1: Dados, 2: Pagamento/Revisão, 3: Sucesso
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zip: "",
    phone: "",
    document: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  })

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price || 0), 0)
  const shipping = subtotal > 299 ? 0 : 25.0
  const discount = subtotal > 500 ? subtotal * 0.05 : 0
  const grandTotal = subtotal + shipping - discount

  // Data estimada (5 dias úteis)
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 5)
  const deliveryDateString = deliveryDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.email || !formData.address || !formData.document || !formData.phone) {
        alert("Por favor, preencha todos os campos obrigatórios (incluindo CPF e Telefone).")
        return
      }
      setStep(2)
    }
  }

  const handlePlaceOrder = async () => {
    if (!storeId) {
      alert("Erro: Loja não identificada.")
      return
    }

    if (!formData.cardNumber || !formData.cardCvc || !formData.cardExpiry) {
      alert("Preencha os dados do pagamento.")
      return
    }

    setLoading(true)
    try {
      const [expMonth, expYear] = formData.cardExpiry.split("/")

      const paymentPayload = {
        amount: grandTotal,
        items: cart,
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          document: formData.document,
          phone: formData.phone,
        },
        card: {
          number: formData.cardNumber,
          holder_name: formData.cardName,
          exp_month: expMonth,
          exp_year: `20${expYear}`,
          cvv: formData.cardCvc,
        },
      }

      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Pagamento recusado pela operadora.")
      }

      await createOrder(
        storeId,
        {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          zip: formData.zip,
        },
        cart,
        grandTotal,
      )

      onClearCart()
      setStep(3)
    } catch (err: any) {
      console.error(err)
      alert("Erro ao processar pedido: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-serif text-gray-800 font-bold">Sua sacola está vazia</h2>
        <p className="text-gray-500 mt-2 text-sm">Adicione itens exclusivos para continuar.</p>
        <button
          onClick={onBack}
          className="mt-8 bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Voltar para a Loja
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 animate-[fadeIn_0.5s]">
      {/* STEPPER HEADER */}
      {step < 3 && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-300 -z-10"></div>

            <div
              className={`flex flex-col items-center gap-2 bg-[#f8f9fa] px-4 ${step >= 1 ? "text-black" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step >= 1 ? "border-black bg-black text-white" : "border-gray-300 bg-white"}`}
              >
                1
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Identificação</span>
            </div>

            <div
              className={`flex flex-col items-center gap-2 bg-[#f8f9fa] px-4 ${step >= 2 ? "text-black" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step >= 2 ? "border-black bg-black text-white" : "border-gray-300 bg-white"}`}
              >
                2
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Pagamento</span>
            </div>

            <div
              className={`flex flex-col items-center gap-2 bg-[#f8f9fa] px-4 ${step >= 3 ? "text-black" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step >= 3 ? "border-black bg-black text-white" : "border-gray-300 bg-white"}`}
              >
                3
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Conclusão</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        {/* LEFT: ORDER SUMMARY (Always Visible) */}
        <div className="w-full lg:w-1/3 bg-gray-50 p-8 lg:p-10 border-r border-gray-100 order-1 lg:order-1 flex flex-col h-full">
          <h3 className="text-xl font-serif font-bold text-black mb-6 flex items-center gap-2">
            Resumo do Pedido
            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length}</span>
          </h3>

          <div className="flex-1 space-y-6 mb-6 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                <div className="w-16 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  <LazyImage src={item.preview} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mb-1">{item.category}</p>
                  <p className="text-xs font-mono text-black">R$ {item.price?.toFixed(2)}</p>
                </div>
                {step === 1 && (
                  <button
                    onClick={() => onRemoveItem(item.cartId)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Remover"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Desconto Especial</span>
                <span>- R$ {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Entrega</span>
              <span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-bold uppercase text-xs">Grátis</span>
                ) : (
                  `R$ ${shipping.toFixed(2)}`
                )}
              </span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            <div className="flex justify-between items-end">
              <span className="text-base font-bold text-black uppercase tracking-wider">Total</span>
              <div className="text-right">
                <span className="text-2xl font-serif font-bold text-black block leading-none">
                  R$ {grandTotal.toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-400">em até 10x sem juros</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: STEPS FORM */}
        <div className="w-full lg:w-2/3 p-8 lg:p-12 relative order-2 lg:order-2 flex flex-col">
          {step < 3 && (
            <button
              onClick={step === 1 ? onBack : () => setStep(1)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest group"
            >
              <svg
                className="w-3 h-3 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {step === 1 ? "Voltar para Loja" : "Voltar para Dados"}
            </button>
          )}

          {step === 1 && (
            <div className="animate-[fadeInRight_0.3s] max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
              <h2 className="text-2xl font-serif text-black mb-1">Dados & Entrega</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">Passo 1 de 2</p>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Nome
                    </label>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                      placeholder="Ex: Ana"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Sobrenome
                    </label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                      placeholder="Silva"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      CPF (Obrigatório)
                    </label>
                    <input
                      name="document"
                      value={formData.document}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Celular (DDD + N°)
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                      placeholder="11999999999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    E-mail
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                    placeholder="ana.silva@exemplo.com"
                  />
                </div>

                <div className="pt-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Endereço de Entrega
                  </label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                    placeholder="Rua, Número, Bairro"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Cidade
                    </label>
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      CEP
                    </label>
                    <input
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-300 py-2 text-sm focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="mt-10 w-full bg-black text-white font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg group"
              >
                Ir para Pagamento
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-[fadeInRight_0.3s] max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
              <h2 className="text-2xl font-serif text-black mb-1">Pagamento</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
                Passo 2 de 2 • Ambiente Seguro{" "}
                <svg className="w-3 h-3 inline text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Entrega Estimada</p>
                  <p className="text-sm font-bold text-black">{deliveryDateString}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {formData.address}, {formData.city}
                  </p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-black underline font-bold">
                  Alterar
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Número do Cartão
                  </label>
                  <div className="flex items-center gap-3 border border-gray-300 rounded-xl p-3 bg-white focus-within:border-black transition-colors">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <input
                      name="cardNumber"
                      onChange={handleInputChange}
                      placeholder="0000 0000 0000 0000"
                      className="flex-1 outline-none text-sm bg-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Validade
                    </label>
                    <input
                      name="cardExpiry"
                      onChange={handleInputChange}
                      placeholder="MM/AA"
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-black outline-none bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      CVC
                    </label>
                    <input
                      name="cardCvc"
                      onChange={handleInputChange}
                      placeholder="123"
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-black outline-none bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Nome no Cartão
                  </label>
                  <input
                    name="cardName"
                    onChange={handleInputChange}
                    placeholder="COMO NO CARTÃO"
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-black outline-none bg-white transition-colors uppercase"
                  />
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-10 w-full bg-black text-white font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  `Pagar R$ ${grandTotal.toFixed(2)}`
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-[zoomIn_0.5s]">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-4xl font-serif text-black mb-3">Pedido Confirmado!</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-2 leading-relaxed">
                Obrigado pela compra, <strong>{formData.firstName}</strong>.
              </p>
              <p className="text-gray-400 text-xs mb-8">Enviamos a confirmação para {formData.email}.</p>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 w-full max-w-sm mb-8">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">Chega em</p>
                <p className="text-lg font-bold text-black">{deliveryDateString}</p>
              </div>

              <button
                onClick={() => onNavigate("landing")}
                className="bg-black text-white px-12 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Voltar para a Loja
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
