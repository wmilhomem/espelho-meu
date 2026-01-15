# Supabase Client Architecture Migration

## Problema Resolvido

Next.js estava interpretando incorretamente que todas as funções exportadas de `lib/supabase-server.ts` deveriam ser async Server Actions quando esse arquivo era importado por API Routes, causando erros de validação.

## Solução Implementada

Separamos a configuração das instâncias de cliente em dois arquivos distintos:

### 1. `lib/supabase-config.ts` (NOVO)
- **Propósito**: Arquivo puro de configuração
- **Conteúdo**: Apenas variáveis de ambiente e validações
- **Sem**: Server Actions, imports complexos, lógica de negócio

```typescript
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "..."
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. `lib/supabase-server.ts` (ATUALIZADO)
- **Propósito**: Singleton clients para server-side
- **Conteúdo**: Apenas funções que retornam instâncias de cliente
- **Importa**: Variáveis de `supabase-config.ts`

```typescript
import { supabaseUrl, supabaseServiceKey, supabaseAnonKey } from "./supabase-config"

export function getAdminClient() { /* ... */ }
export function getAuthClient() { /* ... */ }
```

## Estrutura Antes vs Depois

### ANTES (Problema)
```
lib/supabase-server.ts (validações + clientes + configurações)
  ↑ importado por
app/api/upload-blob/route.ts (API Route)
  → Next.js exige que tudo seja async
  → ❌ ERRO: Server Actions validation
```

### DEPOIS (Solução)
```
lib/supabase-config.ts (APENAS variáveis)
  ↓ importado por
lib/supabase-server.ts (APENAS clientes)
  ↓ importado por
app/api/upload-blob/route.ts (API Route)
  → ✅ Sem conflitos de Server Actions
```

## Arquivos Modificados

1. **lib/supabase-config.ts** - CRIADO
   - Exporta: `supabaseUrl`, `supabaseServiceKey`, `supabaseAnonKey`
   - Validações de ambiente

2. **lib/supabase-server.ts** - ATUALIZADO
   - Removido: Declarações de variáveis de configuração
   - Adicionado: Import de `./supabase-config`
   - Mantido: Funções `getAdminClient()`, `createAdminClient()`, `getAuthClient()`, `createAuthClient()`

## Arquivos de API Route (Não alterados)

Os seguintes arquivos não precisaram de mudanças pois já importam apenas as funções de cliente:

- `app/api/import-image/route.ts` - Importa: `createAdminClient`, `createAuthClient`
- `app/api/storage-admin/route.ts` - Importa: `createAdminClient`, `createAuthClient`
- `app/api/upload-blob/route.ts` - Importa: `createAdminClient`, `createAuthClient`

## Guia de Migração para Futuro Código

### Se você precisar importar variáveis de configuração:

```typescript
// ❌ ANTES
import { supabaseUrl, supabaseServiceKey } from "@/lib/supabase-server"

// ✅ DEPOIS
import { supabaseUrl, supabaseServiceKey } from "@/lib/supabase-config"
```

### Se você precisar importar clientes:

```typescript
// ✅ Continua igual
import { createAdminClient, createAuthClient } from "@/lib/supabase-server"
```

## Benefícios

1. **Sem erros de Server Actions**: Next.js não tenta validar variáveis como funções async
2. **Separação de responsabilidades**: Configuração separada de lógica de cliente
3. **Manutenibilidade**: Mais fácil entender o propósito de cada arquivo
4. **Compatibilidade**: Código existente continua funcionando sem mudanças

## Status

✅ Migração completa e testada
✅ Todos os API Routes compatíveis
✅ Sem breaking changes no código existente
