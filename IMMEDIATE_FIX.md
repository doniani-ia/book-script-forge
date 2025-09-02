# 🚨 CORREÇÃO IMEDIATA - Erro RLS e Storage

## 🔍 **Problemas Identificados**

### **1. Erro RLS (Row Level Security)**
```
StorageApiError: new row violates row-level security policy
```
**Causa**: A migração `20250901240000_fix_books_rls.sql` não foi aplicada ainda.

### **2. Erro 400 Bad Request no Storage**
```
POST https://xlpvszragcssmncyniyn.supabase.co/storage/v1/object/books/books/175...
400 (Bad Request)
```
**Causa**: Possível problema com as políticas RLS do bucket `books`.

## ✅ **SOLUÇÃO IMEDIATA**

### **PASSO 1: Execute a Migração RLS**

1. **Acesse o Supabase Dashboard**:
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Execute a Migração**:
   - Vá para **SQL Editor**
   - Clique em **New Query**
   - Copie e cole o conteúdo do arquivo `supabase/migrations/20250901240000_fix_books_rls.sql`
   - Clique em **Run**

### **PASSO 2: Verifique as Políticas do Bucket**

1. **Vá para Storage**:
   - No Supabase Dashboard, vá para **Storage**
   - Clique no bucket **books**

2. **Verifique as Políticas**:
   - Vá para a aba **Policies**
   - Deve ter as políticas que criamos manualmente

3. **Se não tiver, crie manualmente**:
   - Clique em **New Policy**
   - Use as políticas do arquivo `STORAGE_SETUP.md`

### **PASSO 3: Teste Novamente**

Após executar a migração, teste o upload novamente.

## 🔧 **ALTERNATIVA: Desabilitar RLS Temporariamente**

Se a migração não funcionar, podemos desabilitar RLS temporariamente para testar:

```sql
-- ATENÇÃO: Apenas para teste! Não use em produção
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chunks DISABLE ROW LEVEL SECURITY;
```

**⚠️ IMPORTANTE**: Reative o RLS após o teste:
```sql
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chunks ENABLE ROW LEVEL SECURITY;
```

## 🚀 **EXECUTE AGORA**

1. **Execute a migração RLS** no Supabase Dashboard
2. **Teste o upload** novamente
3. **Me informe** se funcionou ou se deu outro erro

**O problema está nas políticas RLS que não foram aplicadas ainda!** 🎯
