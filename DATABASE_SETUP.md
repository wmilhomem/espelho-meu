# Configuração do Banco de Dados Supabase

## Status Atual
O banco de dados está **vazio** e precisa ser configurado antes de usar a aplicação.

## Instrução de Configuração

### Passo 1: Executar os Scripts SQL

Execute os scripts SQL na seguinte ordem no Supabase:

1. **scripts/01_create_tables.sql** - Cria todas as tabelas necessárias
2. **scripts/02_row_level_security.sql** - Configura as políticas de segurança RLS
3. **scripts/03_seed_demo_data.sql** (Opcional) - Adiciona dados de demonstração

#### Como executar no v0:
Os scripts estão na pasta `/scripts` do projeto. O v0 pode executá-los automaticamente.

#### Como executar no Supabase Dashboard:
1. Acesse https://vbzsvedibj dvrdauvcet.supabase.co
2. Vá em "SQL Editor"
3. Cole o conteúdo de cada script
4. Clique em "Run" para executar

### Passo 2: Estrutura das Tabelas

Após executar os scripts, você terá:

**profiles**
- Armazena perfis de usuários e configurações de loja
- Campos principais: name, avatar_url, plan, preferences (JSONB), store_name, is_sales_enabled

**assets**
- Armazena produtos, modelos, banners, avatares
- Tipos: 'product', 'model', 'banner', 'avatar'
- Campos: name, description, category, type, public_url, price, published

**jobs**
- Armazena jobs de Virtual Try-On
- Status: 'pending', 'processing', 'completed', 'failed'
- Campos: product_id, model_id, style, result_public_url

**orders** e **order_items**
- Sistema de pedidos e e-commerce
- Rastreia compras e itens do carrinho

### Passo 3: Configurar Storage Bucket

A aplicação usa um bucket chamado `assets` para armazenar imagens:

1. Vá em "Storage" no Supabase Dashboard
2. Crie um bucket público chamado `assets`
3. Configure as políticas de acesso:
   - SELECT: public (authenticated users can read)
   - INSERT: authenticated users only
   - UPDATE: owner only
   - DELETE: owner only

### Passo 4: Configurar Authentication

1. Vá em "Authentication" > "Providers"
2. Habilite "Email" provider
3. (Opcional) Habilite "Google" OAuth para login social
4. Configure o redirect URL: `https://seu-dominio.vercel.app/auth/callback`

### Passo 5: Criar Primeiro Usuário

Após configurar tudo:
1. Acesse `/login` na aplicação
2. Clique em "Cadastre-se"
3. Preencha seus dados
4. Verifique seu email para confirmar a conta
5. Faça login

### Verificação

Para verificar se tudo está funcionando:
1. Faça login na aplicação
2. O sistema deve criar automaticamente um perfil na tabela `profiles`
3. Acesse o dashboard principal
4. Você deve ver o menu principal carregado

## Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas:

```
NEXT_PUBLIC_SUPABASE_URL=https://vbzsvedibj dvrdauvcet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (para operações admin)
GEMINI_API_KEY=AIza... (para Virtual Try-On)
PAGARME_SECRET_KEY=sk_... (para pagamentos)
```

## Troubleshooting

### Erro: "0 tables found"
Execute os scripts SQL na ordem correta.

### Erro de autenticação após login
1. Verifique se a tabela `profiles` foi criada
2. Verifique se as políticas RLS estão ativas
3. Limpe os cookies e tente novamente

### Imagens não carregam
1. Verifique se o bucket `assets` existe e é público
2. Verifique as políticas de storage
3. Confirme que `NEXT_PUBLIC_ASSETS_BUCKET=espelho-assets` está configurado

## Suporte

Se encontrar problemas, verifique:
1. Logs do Supabase (Dashboard > Logs)
2. Console do navegador para erros JavaScript
3. Rede do navegador (tab Network) para erros de API
