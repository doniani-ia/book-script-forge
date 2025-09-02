# 🗂️ Configuração do Storage - Supabase

## 🚨 **Problema Identificado**
O bucket `books` não existe no Supabase, causando erro ao tentar fazer upload de livros.

## ✅ **Solução**

### **Passo 1: Executar Migração SQL**

Execute o arquivo `supabase/migrations/20250901230000_setup_storage.sql` no painel do Supabase:

1. **Acesse o painel do Supabase**: https://supabase.com/dashboard
2. **Vá para o seu projeto**
3. **Clique em "SQL Editor"**
4. **Execute o seguinte SQL**:

```sql
-- Configuração do Storage para upload de livros

-- Criar bucket 'books' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'books',
  'books',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/epub+zip'
  ]
)
ON CONFLICT (id) DO NOTHING;
```

### **Passo 2: Configurar Políticas de Segurança**

**IMPORTANTE**: As políticas devem ser configuradas manualmente no painel do Supabase:

1. **Vá para "Storage"** no painel do Supabase
2. **Clique no bucket "books"**
3. **Vá para a aba "Policies"**
4. **Clique em "New Policy"** e crie as seguintes políticas:

#### **Política 1: Upload (INSERT)**
- **Name**: `Admins can upload books`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'books' AND
EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
```

#### **Política 2: Download (SELECT)**
- **Name**: `Admins can download books`
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'books' AND
EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
```

#### **Política 3: Delete (DELETE)**
- **Name**: `Admins can delete books`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'books' AND
EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
```

#### **Política 4: Update (UPDATE)**
- **Name**: `Admins can update books`
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'books' AND
EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
```

### **Passo 3: Verificar Configuração**

1. **Vá para "Storage"** no painel do Supabase
2. **Verifique se o bucket "books" foi criado**
3. **Confirme as configurações**:
   - ✅ **Público**: Não
   - ✅ **Limite de arquivo**: 50MB
   - ✅ **Tipos permitidos**: PDF, TXT, DOC, DOCX, EPUB

### **Passo 4: Testar Upload**

1. **Faça login** na aplicação
2. **Vá para a página Admin**
3. **Tente fazer upload** de um arquivo de teste
4. **Verifique se não há mais erros**

## 🔧 **Configurações do Bucket**

### **Especificações:**
- **Nome**: `books`
- **Público**: Não (apenas admins podem acessar)
- **Limite de arquivo**: 50MB
- **Tipos permitidos**:
  - `application/pdf` - Arquivos PDF
  - `text/plain` - Arquivos de texto
  - `application/msword` - Documentos Word (.doc)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - Documentos Word (.docx)
  - `application/epub+zip` - Livros EPUB

### **Políticas de Segurança:**
- ✅ **Upload**: Apenas usuários com role 'admin'
- ✅ **Download**: Apenas usuários com role 'admin'
- ✅ **Delete**: Apenas usuários com role 'admin'
- ✅ **Update**: Apenas usuários com role 'admin'

## 🧪 **Teste Completo**

### **1. Teste de Upload:**
- Faça upload de um arquivo PDF pequeno
- Verifique se aparece na tabela de livros
- Confirme se o status é "uploading"

### **2. Teste de Processamento:**
- Clique no botão "Play" para processar
- Aguarde o status mudar para "ready"
- Verifique se não há erros no console

### **3. Teste de RAG:**
- Vá para o Gerador
- Digite um tema relacionado ao livro
- Verifique se o sistema busca conteúdo relevante

## 🚨 **Troubleshooting**

### **"Bucket not found"**
- Execute a migração SQL
- Verifique se o bucket foi criado no painel

### **"Access denied"**
- Verifique se você tem role 'admin'
- Confirme se as políticas foram criadas

### **"File too large"**
- Reduza o tamanho do arquivo
- Verifique o limite de 50MB

### **"Invalid file type"**
- Use apenas PDF, TXT, DOC, DOCX ou EPUB
- Verifique a extensão do arquivo

## 📊 **Monitoramento**

### **Painel do Supabase:**
- **Storage**: Ver arquivos enviados
- **Logs**: Verificar erros de upload
- **Policies**: Confirmar políticas ativas

### **Console do Navegador:**
- Logs de upload
- Erros de processamento
- Status de conexão

**Execute a migração SQL e teste o upload de livros!** 🚀
