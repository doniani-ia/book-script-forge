# 📚 Book Script Forge

> **Transforme livros em roteiros de vídeo profissionais com Inteligência Artificial**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.56.1-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🚀 Sobre o Projeto

O **Book Script Forge** é uma plataforma inovadora que utiliza Inteligência Artificial para transformar livros em roteiros de vídeo profissionais. Desenvolvido para criadores de conteúdo, educadores e produtores de mídia, a aplicação oferece uma solução completa para conversão de conteúdo textual em formatos audiovisuais otimizados.

### ✨ Principais Funcionalidades

- 🤖 **Geração de Roteiros com IA**: Transforme livros em roteiros estruturados usando modelos de linguagem avançados
- 📖 **Processamento de Documentos**: Upload e processamento inteligente de livros em PDF
- 🌍 **Sistema de Tradução**: Traduza roteiros para múltiplos idiomas automaticamente
- 📊 **Gerenciamento de Scripts**: Organize, edite e gerencie seus roteiros em uma interface intuitiva
- 🔐 **Autenticação Segura**: Sistema completo de autenticação com Supabase
- 🎯 **Personalização Avançada**: Configure duração, estilo, ambiente e público-alvo dos vídeos
- 📱 **Interface Responsiva**: Design moderno e adaptável para todos os dispositivos

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca para interfaces de usuário
- **TypeScript 5.8.3** - Superset tipado do JavaScript
- **Vite 5.4.19** - Build tool moderna e rápida
- **Tailwind CSS 3.4.17** - Framework CSS utilitário
- **shadcn/ui** - Componentes de UI modernos e acessíveis
- **React Router DOM** - Roteamento client-side
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### Backend & Infraestrutura
- **Supabase** - Backend-as-a-Service com PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança a nível de linha
- **Storage** - Armazenamento de arquivos
- **Real-time** - Atualizações em tempo real

### Integrações
- **OpenAI/Anthropic** - Modelos de linguagem para geração de conteúdo
- **Embeddings** - Busca semântica e processamento de texto
- **Translation APIs** - Serviços de tradução automática

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Chaves de API para serviços de IA

### 1. Clone o Repositório
```bash
git clone https://github.com/doniani-ia/book-script-forge.git
cd book-script-forge
```

### 2. Instale as Dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Configure o Supabase
Execute as migrações do banco de dados:

```bash
# Instale o Supabase CLI
npm install -g supabase

# Faça login no Supabase
supabase login

# Aplique as migrações
supabase db push
```

### 5. Execute o Projeto
```bash
npm run dev
# ou
yarn dev
```

Acesse `http://localhost:5173` no seu navegador.

## 📁 Estrutura do Projeto

```
book-script-forge/
├── src/
│   ├── components/          # Componentes React
│   │   ├── auth/           # Autenticação
│   │   ├── layout/         # Layout e navegação
│   │   ├── translation/    # Sistema de tradução
│   │   └── ui/             # Componentes de UI
│   ├── hooks/              # Custom hooks
│   ├── integrations/       # Integrações externas
│   │   └── supabase/       # Cliente Supabase
│   ├── lib/                # Utilitários e serviços
│   │   ├── book-processing-service.ts
│   │   ├── document-processor.ts
│   │   ├── llm-service.ts
│   │   └── translation-service.ts
│   ├── pages/              # Páginas da aplicação
│   └── main.tsx           # Ponto de entrada
├── supabase/
│   └── migrations/        # Migrações do banco
└── public/                # Arquivos estáticos
```

## 🎯 Como Usar

### 1. **Autenticação**
- Crie uma conta ou faça login
- Configure suas preferências de IA

### 2. **Upload de Livros**
- Acesse a página de Upload
- Faça upload de arquivos PDF
- Aguarde o processamento automático

### 3. **Geração de Roteiros**
- Configure os parâmetros do vídeo:
  - Tema e foco
  - Duração desejada
  - Estilo de linguagem
  - Ambiente e público-alvo
- Clique em "Gerar Roteiro"
- Aguarde a IA processar o conteúdo

### 4. **Gerenciamento**
- Visualize todos os roteiros na página Scripts
- Edite, traduza ou exclua conforme necessário
- Exporte para diferentes formatos

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Build para produção
npm run build:dev    # Build para desenvolvimento

# Qualidade de Código
npm run lint         # Executa ESLint

# Preview
npm run preview      # Preview do build de produção
```

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/doniani-ia/book-script-forge/issues)
- **Documentação**: Consulte os guias na pasta raiz do projeto
- **Email**: [Seu email de contato]

## 🎉 Agradecimentos

- [Supabase](https://supabase.com/) - Backend e autenticação
- [shadcn/ui](https://ui.shadcn.com/) - Componentes de UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Vite](https://vitejs.dev/) - Build tool
- [React](https://reactjs.org/) - Biblioteca de UI

---

<div align="center">
  <p>Feito com ❤️ por <strong>Doniani</strong></p>
  <p>
    <a href="https://github.com/doniani-ia/book-script-forge">⭐ Dê uma estrela</a> •
    <a href="https://github.com/doniani-ia/book-script-forge/issues">🐛 Reporte bugs</a> •
    <a href="https://github.com/doniani-ia/book-script-forge/pulls">💡 Sugira features</a>
  </p>
</div>