# Configuração de Variáveis de Ambiente

Este projeto requer as seguintes variáveis de ambiente para funcionar corretamente.

## Supabase (Banco de Dados e Storage)

Credenciais do Supabase existente:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vbzsvedibjdvrdauvcet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZienN2ZWRpYmpkdnJkYXV2Y2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTYxNDksImV4cCI6MjA4MDM5MjE0OX0.gqLBTjBXUEo0vB1Fky99u3ZuenQkJI23-pYyV9xAQTk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZienN2ZWRpYmpkdnJkYXV2Y2V0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgxNjE0OSwiZXhwIjoyMDgwMzkyMTQ5fQ.GyB03LsZSeHpfYNy7lU71vH1ECb7S30WjvcRcbmsY2A
```

**Onde obter a Service Role Key:**
1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto (vbzsvedibjdvrdauvcet)
3. Vá em **Settings** → **API**
4. Copie a chave **service_role** (⚠️ NUNCA exponha no frontend!)

## Google Gemini AI (Virtual Try-On)

Para usar o serviço de Virtual Try-On com IA:

```bash
GEMINI_API_KEY=AIzaSyC1w6WXJeXNPiGf-oqDfrJzfonb7ZSFBGw
```

**Como obter:**
1. Acesse: https://aistudio.google.com/app/apikey
2. Crie ou selecione um projeto
3. Gere uma nova API Key
4. Copie e adicione como variável de ambiente

## Pagar.me (Pagamentos) - Opcional

Se você deseja processar pagamentos:

```bash
PAGARME_SECRET_KEY=sua_secret_key_do_pagarme_aqui
```

**Como obter:**
1. Crie uma conta em: https://pagar.me
2. Acesse o Dashboard
3. Vá em **Configurações** → **Chaves de API**
4. Copie a **Secret Key** (teste ou produção)

## Bucket do Supabase Storage

```bash
NEXT_PUBLIC_ASSETS_BUCKET=espelho-assets
```

## Como adicionar variáveis de ambiente no v0:

1. Clique no ícone de **Vars** (⚙️) na barra lateral esquerda do chat
2. Adicione cada variável com seu respectivo valor:
   - `NEXT_PUBLIC_SUPABASE_URL` (já configurado)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (já configurado)
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **OBRIGATÓRIO**
   - `GEMINI_API_KEY` ⚠️ **OBRIGATÓRIO**
   - `PAGARME_SECRET_KEY` (opcional)
   - `NEXT_PUBLIC_ASSETS_BUCKET` (opcional, padrão: espelho-assets)
3. As variáveis estarão disponíveis automaticamente no código

## Como adicionar variáveis de ambiente na Vercel (após deploy):

1. Acesse seu projeto na Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável listada acima
4. Marque em quais ambientes cada variável deve estar disponível (Production, Preview, Development)
5. Clique em **Save**
6. Faça um novo deploy para aplicar as mudanças

## Verificação de Configuração

Acesse `/api/debug-env` para verificar se as variáveis estão configuradas corretamente. A rota retorna status booleano (não expõe valores reais):

```json
{
  "check_status": "ok",
  "env_vars": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "GEMINI_API_KEY": true
  }
}
```

## Estrutura do Banco de Dados Supabase

O banco de dados deve ter as seguintes tabelas:

### users
- `id` (uuid, PK)
- `email` (text)
- `name` (text)
- `avatar_url` (text, nullable)
- `store_name` (text, nullable)
- `bio` (text, nullable)
- `created_at` (timestamp)

### assets
- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id)
- `type` (text: 'product' | 'model')
- `name` (text)
- `description` (text, nullable)
- `category` (text)
- `source` (text: 'file' | 'url')
- `preview` (text)
- `storage_path` (text, nullable)
- `mime_type` (text)
- `is_favorite` (boolean)
- `price` (numeric, nullable)
- `published` (boolean)
- `created_at` (timestamp)

### jobs
- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id)
- `product_id` (uuid, FK → assets.id)
- `model_id` (uuid, FK → assets.id)
- `product_owner_id` (uuid, FK → users.id, nullable)
- `style` (text)
- `status` (text: 'pending' | 'processing' | 'completed' | 'failed')
- `result_url` (text, nullable)
- `result_path` (text, nullable)
- `is_favorite` (boolean)
- `created_at` (timestamp)
- `completed_at` (timestamp, nullable)

### orders
- `id` (uuid, PK)
- `buyer_id` (uuid, FK → users.id)
- `seller_id` (uuid, FK → users.id)
- `job_id` (uuid, FK → jobs.id)
- `product_id` (uuid, FK → assets.id)
- `amount` (numeric)
- `status` (text)
- `created_at` (timestamp)

## Buckets do Supabase Storage

O projeto requer os seguintes buckets públicos:

- `products` - Para armazenar imagens de produtos
- `models` - Para armazenar imagens de modelos
- `results` - Para armazenar resultados de try-ons

### Configurar Buckets:

1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Crie cada bucket listado acima
4. Configure como **público** (public: true)
5. Configure políticas RLS para permitir:
   - INSERT para usuários autenticados
   - SELECT público
   - DELETE/UPDATE apenas para o dono
