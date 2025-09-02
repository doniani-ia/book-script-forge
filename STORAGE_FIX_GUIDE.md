# 🚨 CORREÇÃO DO STORAGE - Erro 400 Bad Request

## 🔍 **Problema Identificado**

O erro está acontecendo no **upload para o Supabase Storage** (400 Bad Request), não na inserção da tabela `books`. Isso indica que:

1. **Bucket não existe** ou está mal configurado
2. **Políticas RLS do bucket** estão bloqueando o upload
3. **Configuração do bucket** está incorreta

## ✅ **SOLUÇÃO EM 2 PASSOS**

### **PASSO 1: Execute o SQL do Storage**

1. **Acesse o Supabase Dashboard**:
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Execute o SQL**:
   - Vá para **SQL Editor**
   - Clique em **New Query**
   - Copie e cole o conteúdo do arquivo `SIMPLE_STORAGE_FIX.sql`
   - Clique em **Run**

### **PASSO 2: Execute o SQL do RLS (se ainda não executou)**

1. **Execute o SQL**:
   - Vá para **SQL Editor**
   - Clique em **New Query**
   - Copie e cole o conteúdo do arquivo `QUICK_RLS_FIX.sql`
   - Clique em **Run**

### **PASSO 3: Teste o Upload**

Após executar ambos os SQLs, teste o upload novamente.

## 🔧 **O Que o SQL do Storage Faz**

1. **Cria o bucket `books`** se não existir
2. **Configura limites** (50MB, tipos de arquivo permitidos)
3. **Remove políticas conflitantes**
4. **Cria políticas simples** que permitem upload para usuários autenticados

## 🚨 **ALTERNATIVA: Desabilitar RLS do Storage**

Se ainda der erro, execute este SQL para desabilitar RLS do storage temporariamente:

```sql
-- ATENÇÃO: Apenas para teste!
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ LEMBRE-SE**: Reative o RLS após o teste:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## 🎯 **EXECUTE AGORA**

1. **Execute o SQL do Storage** (`SIMPLE_STORAGE_FIX.sql`)
2. **Execute o SQL do RLS** (`QUICK_RLS_FIX.sql`)
3. **Teste o upload** novamente
4. **Me informe** o resultado

**O problema está na configuração do bucket de storage!** 🚀
