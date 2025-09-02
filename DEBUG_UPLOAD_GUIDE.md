# 🔍 Guia de Debug - Upload e Processamento de Livros

## 🚨 **Problema Identificado**
O upload parece estar funcionando, mas o arquivo não está sendo enviado para o bucket e nem gerando o RAG no Supabase.

## 🔧 **Solução Implementada**

### **1. Logs Detalhados Adicionados**
- ✅ **Upload**: Logs para verificar se o arquivo está sendo enviado
- ✅ **Database**: Logs para verificar se o registro está sendo criado
- ✅ **Processing**: Logs para verificar se o processamento está sendo iniciado
- ✅ **DocumentProcessor**: Logs detalhados em cada etapa

### **2. Processamento Automático**
- ✅ **Upload → Processamento**: Processamento automático após upload
- ✅ **Error Handling**: Tratamento de erros sem quebrar o fluxo
- ✅ **Status Updates**: Atualização de status em tempo real

## 🧪 **Como Testar e Debuggar**

### **1. Abra o Console do Navegador**
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá para a aba **Console**
- Mantenha aberto durante o teste

### **2. Faça o Upload de um Arquivo**
- Use um arquivo **PDF** ou **TXT** (DOC/DOCX ainda não implementado)
- Preencha título e autor
- Clique em "Enviar Livro"

### **3. Verifique os Logs no Console**
Você deve ver uma sequência como esta:

```
Uploading file to storage: books/1756776501686-nome_do_arquivo.pdf
File uploaded successfully to storage
Creating book record in database
Book record created successfully
Getting book ID for processing
Starting automatic processing for book: [ID]
[DocumentProcessor] Starting processing for book: [ID]
[DocumentProcessor] Book found: [Título] [Caminho]
[DocumentProcessor] Updating status to processing
[DocumentProcessor] Downloading file from storage: [Caminho]
[DocumentProcessor] File downloaded, size: [Tamanho] bytes
[DocumentProcessor] Extracting text from [Tipo] file
[DocumentProcessor] Text extracted, length: [Tamanho] characters
[DocumentProcessor] Splitting text into chunks
[DocumentProcessor] Created [Número] chunks
[DocumentProcessor] Generating embeddings for [Número] chunks
[DocumentProcessor] Generated embeddings for [Número] chunks
[DocumentProcessor] Saving chunks to database
[DocumentProcessor] Chunks saved successfully
[DocumentProcessor] Updating status to ready
Book processing completed successfully
```

### **4. Identifique Onde Para**
- Se para no **"Uploading file to storage"** → Problema no Supabase Storage
- Se para no **"Creating book record"** → Problema nas políticas RLS
- Se para no **"Starting automatic processing"** → Problema no processamento
- Se para no **"Downloading file"** → Problema no download do arquivo
- Se para no **"Extracting text"** → Problema na extração de texto
- Se para no **"Generating embeddings"** → Problema com API key do OpenAI

## 🚨 **Possíveis Problemas e Soluções**

### **1. "Upload error" no Console**
**Problema**: Erro no Supabase Storage
**Solução**: 
- Verifique se o bucket `books` existe
- Verifique as políticas RLS do bucket
- Confirme se está logado no sistema

### **2. "Database insert error" no Console**
**Problema**: Erro nas políticas RLS da tabela `books`
**Solução**: 
- Execute a migração `20250901240000_fix_books_rls.sql`
- Verifique se o usuário tem permissão para inserir

### **3. "No OpenAI API key found" no Console**
**Problema**: Usuário não configurou API key
**Solução**: 
- Vá para **Configurações LLM** no sistema
- Configure sua chave API do OpenAI
- Teste novamente

### **4. "DOC/DOCX processing not yet implemented"**
**Problema**: Tipo de arquivo não suportado
**Solução**: 
- Use arquivos **PDF** ou **TXT**
- DOC/DOCX será implementado futuramente

### **5. "PDF appears to be empty or corrupted"**
**Problema**: PDF não pode ser lido
**Solução**: 
- Use um PDF válido
- Tente converter para TXT
- Verifique se o arquivo não está corrompido

## 🔍 **Verificações Adicionais**

### **1. Verificar no Supabase Dashboard**
- Vá para **Storage** → **books**
- Confirme se o arquivo está lá
- Verifique o tamanho e nome

### **2. Verificar na Tabela books**
- Vá para **Table Editor** → **books**
- Confirme se o registro foi criado
- Verifique o status (deve ser "ready" após processamento)

### **3. Verificar na Tabela book_chunks**
- Vá para **Table Editor** → **book_chunks**
- Confirme se os chunks foram criados
- Verifique se há embeddings

## 📊 **Status Esperado**

| Etapa | Status Esperado | Log Esperado |
|-------|----------------|--------------|
| Upload | ✅ Sucesso | "File uploaded successfully" |
| Database | ✅ Sucesso | "Book record created successfully" |
| Processing | ✅ Sucesso | "Starting automatic processing" |
| Download | ✅ Sucesso | "File downloaded, size: X bytes" |
| Extract | ✅ Sucesso | "Text extracted, length: X characters" |
| Chunks | ✅ Sucesso | "Created X chunks" |
| Embeddings | ✅ Sucesso | "Generated embeddings for X chunks" |
| Save | ✅ Sucesso | "Chunks saved successfully" |
| Final | ✅ Sucesso | "Book processing completed successfully" |

## 🚀 **Próximos Passos**

1. **Teste o upload** com um arquivo PDF ou TXT
2. **Verifique os logs** no console do navegador
3. **Identifique onde para** o processamento
4. **Me informe o erro** específico que apareceu
5. **Vamos corrigir** o problema identificado

**Teste agora e me informe o que aparece no console!** 🔍
