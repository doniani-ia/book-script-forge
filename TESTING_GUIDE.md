# 🧪 Guia de Teste - Sistema RAG com API Keys por Usuário

## 📋 Configuração Inicial

### 1. Configure sua API Key do OpenAI
1. **Acesse**: https://platform.openai.com/api-keys
2. **Crie uma nova API key**
3. **No sistema**:
   - Clique em "Configurações LLM" na navbar
   - Adicione sua API key do OpenAI
   - Selecione um modelo (ex: GPT-4 Mini)
   - Clique em "Salvar Configurações"

### 2. Execute a Migração SQL
Execute o arquivo `supabase/migrations/20250901220000_add_semantic_search.sql` no painel do Supabase.

## 🧪 Teste Completo do Sistema

### **Passo 1: Upload e Processamento de Livro**

1. **Vá para a página Admin**
2. **Faça upload de um arquivo**:
   - **PDF**: Use um arquivo PDF simples com texto
   - **TXT**: Use um arquivo de texto (.txt)
3. **Preencha os dados**:
   - Título do livro
   - Autor (opcional)
4. **Clique em "Enviar Livro"**
5. **Processe o livro**:
   - Clique no botão "Play" (▶️) na tabela
   - Aguarde o status mudar para "ready"

### **Passo 2: Geração de Roteiro com RAG**

1. **Vá para a página "Gerador"**
2. **Preencha o formulário**:
   - **Tema**: Algo relacionado ao conteúdo do livro
   - **Duração**: 10 minutos
   - **Estilo**: Descontraída
   - **Ambiente**: Educativo
3. **Clique em "Gerar Roteiro"**
4. **Observe**:
   - O sistema buscará conteúdo relevante do livro
   - O roteiro será gerado com base no conteúdo encontrado
   - Verifique se há referências ao conteúdo do livro

### **Passo 3: Verificação do RAG**

**Para confirmar que o RAG está funcionando:**

1. **Gere um roteiro** sobre um tema **não relacionado** ao livro
2. **Gere outro roteiro** sobre um tema **relacionado** ao livro
3. **Compare os resultados**:
   - O roteiro relacionado deve ter mais profundidade
   - Deve conter informações específicas do livro

## 🔍 O que Observar

### ✅ **Sucesso Esperado:**
- Livro processado com status "ready"
- Roteiros gerados com conteúdo relevante
- Sistema busca automaticamente no livro
- Embeddings gerados usando sua API key

### ❌ **Possíveis Problemas:**
- **"No OpenAI API key found"**: Configure sua API key
- **"Book not found"**: Verifique se o upload foi bem-sucedido
- **"RAG search failed"**: Verifique se há livros processados
- **Erro de processamento**: Verifique o formato do arquivo

## 📊 Monitoramento

### **Console do Navegador (F12)**
- Logs de processamento
- Erros de API
- Status de embeddings

### **Banco de Dados (Supabase)**
- Tabela `books`: Status dos livros
- Tabela `book_chunks`: Chunks com embeddings
- Tabela `user_settings`: Suas configurações

## 🎯 Testes Específicos

### **Teste 1: Processamento Básico**
- Upload de arquivo TXT simples
- Verificar se gera chunks
- Verificar se cria embeddings

### **Teste 2: RAG Funcional**
- Gerar roteiro sobre tema do livro
- Verificar se usa conteúdo do livro
- Comparar com roteiro sem contexto

### **Teste 3: Múltiplos Usuários**
- Cada usuário com sua própria API key
- Processar livros independentemente
- Verificar isolamento de dados

## 🚨 Troubleshooting

### **"No OpenAI API key found"**
- Verifique se configurou a API key
- Confirme se salvou as configurações
- Verifique se está logado

### **"Failed to process book"**
- Verifique o formato do arquivo
- Confirme se a API key é válida
- Verifique os logs no console

### **"RAG search failed"**
- Verifique se há livros processados
- Confirme se a API key está configurada
- Verifique se a migração SQL foi executada

## 📝 Logs Importantes

```javascript
// Sucesso no processamento
"Successfully processed book {id} with {chunks} chunks"

// RAG funcionando
"RAG search found {count} relevant chunks"

// Erro de API key
"No OpenAI API key found for user, skipping embeddings generation"
```

**Teste cada etapa e me avise se encontrou algum problema!** 🚀
