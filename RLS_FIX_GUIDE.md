# 🔧 Correção de Erro RLS - Upload de Livros

## 🚨 **Problema Identificado**
Erro: `new row violates row-level security policy`

**Causa**: As políticas RLS da tabela `books` só permitiam que **admins** fizessem upload de livros, mas usuários regulares também precisam dessa permissão.

## ✅ **Solução Implementada**

### **1. Nova Migração** (`supabase/migrations/20250901240000_fix_books_rls.sql`)
- ✅ **Políticas para usuários**: Podem fazer upload de seus próprios livros
- ✅ **Políticas para admins**: Podem gerenciar todos os livros
- ✅ **Políticas para chunks**: Usuários podem acessar chunks de seus livros
- ✅ **Segurança mantida**: Cada usuário só vê seus próprios livros

## 🚀 **Como Aplicar a Correção**

### **Opção 1: Supabase Dashboard (Recomendado)**

1. **Acesse o Supabase Dashboard**:
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Execute a Migração**:
   - Vá para **SQL Editor**
   - Clique em **New Query**
   - Copie e cole o conteúdo do arquivo `supabase/migrations/20250901240000_fix_books_rls.sql`
   - Clique em **Run**

### **Opção 2: Via Terminal (Se tiver Supabase CLI configurado)**

```bash
# Se tiver o projeto linkado
npx supabase db push

# Ou se quiser aplicar apenas esta migração
npx supabase db push --include-all
```

## 📋 **Conteúdo da Migração**

```sql
-- Fix RLS policies for books table to allow regular users to upload books
-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;

-- Create new policies that allow both admins and regular users to manage books
-- Users can insert their own books
CREATE POLICY "Users can insert their own books" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- Users can view their own books
CREATE POLICY "Users can view their own books" 
ON public.books 
FOR SELECT 
USING (auth.uid() = uploaded_by);

-- Users can update their own books
CREATE POLICY "Users can update their own books" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = uploaded_by);

-- Users can delete their own books
CREATE POLICY "Users can delete their own books" 
ON public.books 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Admins can view all books
CREATE POLICY "Admins can view all books" 
ON public.books 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all books
CREATE POLICY "Admins can update all books" 
ON public.books 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete all books
CREATE POLICY "Admins can delete all books" 
ON public.books 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Also fix book_chunks policies to allow users to access chunks from their own books
DROP POLICY IF EXISTS "Admins can access book chunks" ON public.book_chunks;

-- Users can view chunks from their own books
CREATE POLICY "Users can view chunks from their own books" 
ON public.book_chunks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Users can insert chunks for their own books
CREATE POLICY "Users can insert chunks for their own books" 
ON public.book_chunks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Users can update chunks for their own books
CREATE POLICY "Users can update chunks for their own books" 
ON public.book_chunks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Users can delete chunks for their own books
CREATE POLICY "Users can delete chunks for their own books" 
ON public.book_chunks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Admins can access all chunks
CREATE POLICY "Admins can access all chunks" 
ON public.book_chunks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

## 🔍 **O Que a Correção Faz**

### **Antes (Problemático):**
- ❌ Apenas **admins** podiam fazer upload de livros
- ❌ Usuários regulares recebiam erro RLS
- ❌ Sistema inacessível para usuários normais

### **Depois (Corrigido):**
- ✅ **Usuários** podem fazer upload de seus próprios livros
- ✅ **Admins** podem gerenciar todos os livros
- ✅ **Segurança mantida**: Cada usuário só vê seus livros
- ✅ **Chunks acessíveis**: Usuários podem processar seus livros

## 🧪 **Teste Após a Correção**

### **1. Execute a Migração**:
- Aplique o SQL no Supabase Dashboard
- Confirme que executou sem erros

### **2. Teste o Upload**:
- Tente fazer upload do mesmo arquivo
- Deve funcionar sem erro RLS
- Livro deve aparecer na lista

### **3. Teste o Processamento**:
- Clique no botão "Play" para processar
- Deve funcionar sem problemas
- Status deve mudar para "processing" → "ready"

## 🎯 **Benefícios da Correção**

- ✅ **Acessibilidade**: Usuários regulares podem usar o sistema
- ✅ **Segurança**: Cada usuário só vê seus próprios livros
- ✅ **Flexibilidade**: Admins mantêm controle total
- ✅ **Funcionalidade**: Sistema RAG funciona para todos

## 🚨 **Troubleshooting**

### **"Policy already exists"**
- Normal, a migração usa `DROP POLICY IF EXISTS`
- Continue executando o resto do SQL

### **"Permission denied"**
- Verifique se está logado como admin do projeto
- Confirme que tem permissões no Supabase

### **Upload ainda não funciona**
- Recarregue a página (Ctrl+F5)
- Verifique se a migração foi aplicada
- Confirme que está logado no sistema

## 🚀 **Próximos Passos**

1. **Execute a migração** no Supabase Dashboard
2. **Teste o upload** novamente
3. **Confirme que funciona** sem erros
4. **Continue com o processamento** do livro
5. **Teste o sistema RAG** completo

**Execute a migração e teste o upload novamente!** 🎉
