import { NextResponse } from "next/server"

export const runtime = "nodejs"

const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY

export async function POST(request: Request) {
  if (!PAGARME_SECRET_KEY) {
    return NextResponse.json({ error: "Configuração de pagamento ausente (Server Key)." }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { customer, card, items, amount } = body

    // Formatação para Pagar.me (Centavos)
    const amountInCents = Math.round(amount * 100)

    // Header de Autenticação Basic Auth (Pagar.me V5)
    const basicAuth = btoa(`${PAGARME_SECRET_KEY}:`)

    const payload = {
      customer: {
        name: customer.name,
        email: customer.email,
        type: "individual",
        document: customer.document.replace(/\D/g, ""),
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: customer.phone.substring(0, 2),
            number: customer.phone.substring(2).replace(/\D/g, ""),
          },
        },
      },
      items: items.map((item: any) => ({
        amount: Math.round((item.price || 0) * 100),
        description: item.name.substring(0, 255),
        quantity: 1,
        code: item.id.substring(0, 50),
      })),
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            card: {
              number: card.number.replace(/\s/g, ""),
              holder_name: card.holder_name,
              exp_month: Number.parseInt(card.exp_month),
              exp_year: Number.parseInt(card.exp_year),
              cvv: card.cvv,
            },
            operation_type: "auth_and_capture",
            installments: 1,
            statement_descriptor: "ESPELHOMEU",
          },
        },
      ],
      antifraud: {
        type: "clearsale",
        clearsale: {
          login: true,
        },
      },
    }

    console.log("[Pagar.me] Iniciando transação...")

    const response = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Pagar.me] Erro:", JSON.stringify(data))
      const errorMessage = data.message || "Erro no processamento do pagamento."
      const detailedError = data.errors ? Object.values(data.errors)[0] : ""
      return NextResponse.json({ error: `${errorMessage} ${detailedError}` }, { status: 400 })
    }

    console.log("[Pagar.me] Sucesso:", data.id)

    return NextResponse.json({
      success: true,
      transactionId: data.id,
      status: data.status,
    })
  } catch (error: any) {
    console.error("[Pagar.me] Exception:", error)
    return NextResponse.json({ error: "Erro interno ao comunicar com gateway." }, { status: 500 })
  }
}
