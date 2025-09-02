# Configuração do Processamento de Livros

## 📋 Pré-requisitos

Para o processamento de livros funcionar completamente, você precisa:

### 1. API Key do OpenAI (por usuário)
- Acesse: https://platform.openai.com/api-keys
- Crie uma nova API key
- **Configure na interface do sistema**:
  - Vá para "Configurações LLM" na navbar
  - Adicione sua API key do OpenAI
  - Salve as configurações

**Importante**: Cada usuário deve configurar sua própria API key para processar livros e gerar embeddings.

### 2. Executar Migração do Banco
Execute a migração SQL no Supabase para adicionar as funções de busca semântica:

```sql
-- Execute o arquivo: supabase/migrations/20250901220000_add_semantic_search.sql
```

## 🔧 Como Funciona

### Processamento Automático
1. **Upload**: Livro é enviado via interface admin
2. **Extração**: Texto é extraído do arquivo (PDF, TXT)
3. **Chunking**: Texto é dividido em pedaços menores
4. **Embeddings**: Cada chunk recebe um embedding vetorial
5. **Armazenamento**: Chunks são salvos no banco com embeddings

### Busca Semântica (RAG)
1. **Query**: Usuário digita tema do roteiro
2. **Embedding**: Query é convertida em vetor
3. **Busca**: Sistema encontra chunks similares
4. **Contexto**: Conteúdo relevante é usado na geração

## 📁 Formatos Suportados

- ✅ **PDF**: Extração básica de texto
- ✅ **TXT**: Suporte completo
- ⚠️ **DOC/DOCX**: Não implementado ainda
- ⚠️ **EPUB**: Não implementado ainda

## 🚀 Testando o Sistema

### 1. Upload de Livro
- Vá para a página Admin
- Faça upload de um arquivo PDF ou TXT
- Clique no botão "Play" para processar

### 2. Geração com RAG
- Vá para o Gerador
- Digite um tema relacionado ao livro
- O sistema buscará conteúdo relevante automaticamente

## 🔍 Monitoramento

### Status dos Livros
- **uploading**: Arquivo enviado
- **processing**: Sendo processado
- **ready**: Pronto para uso
- **error**: Erro no processamento

### Logs
Verifique o console do navegador para logs de processamento.

## ⚠️ Limitações Atuais

1. **PDF**: Extração básica (pode não funcionar com PDFs complexos)
2. **DOC/EPUB**: Não implementados
3. **Embeddings**: Requer API key do OpenAI **por usuário**
4. **Processamento**: Manual via interface (não automático)
5. **RAG**: Só funciona se o usuário tiver API key configurada

## 🛠️ Próximos Passos

1. Implementar processamento automático via webhook
2. Melhorar extração de PDF com bibliotecas especializadas
3. Adicionar suporte para DOC/EPUB
4. Implementar processamento em background
