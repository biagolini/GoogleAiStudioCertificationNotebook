# 🎓 CertStudy — Plataforma Aberta de Estudos para Certificações de TI

[![Live Site](https://img.shields.io/badge/Live_Site-study.biagolini.click-amber?style=for-the-badge&logo=googlechrome&logoColor=white)](https://study.biagolini.click/)
[![GitHub Pages](https://img.shields.io/badge/Deployed_on-GitHub_Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)](https://study.biagolini.click/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![BYOS](https://img.shields.io/badge/Storage-BYOS_%2F_Google_Drive-34A853?logo=googledrive&logoColor=white)](#-arquitetura-byos-bring-your-own-storage)

> 🚀 **Aplicação no ar (Live Demo)**: [https://study.biagolini.click/](https://study.biagolini.click/)

---

### ⚠️ AVISO LEGAL E DE SEGURANÇA (DISCLAIMER) — PROJETO EXPERIMENTAL "VIBE CODED"

> **ATENÇÃO: LEIA ANTES DE UTILIZAR ESTE SOFTWARE**
>
> 1. **Desenvolvimento via "Vibe Coding" com IA**: Este projeto foi construído inteiramente na modalidade *vibe coding* em colaboração direta com um motor de inteligência artificial generativa de código (**Google AI Studio Build / assistente avançado de software baseado em modelos Google Gemini**). A IA atuou como o principal engenheiro de implementação a partir de instruções em linguagem natural.
> 2. **Finalidade Exclusivamente Experimental e de Estudo**: O propósito central da criação deste repositório foi **testar, avaliar e estressar a capacidade da própria ferramenta de IA** para arquitetura, prototipação rápida e desenvolvimento de aplicações web completas. O objetivo é puramente acadêmico e de exploração do estado da arte da tecnologia de IA geradora de código — **NÃO de produzir uma aplicação empresarial ou pronta para ambientes críticos de produção**.
> 3. **Ausência de Auditoria e Testes Rígidos de Segurança**: Este código **NÃO passou por testes de segurança rigorosos**, pentests, auditoria estática profissional de vulnerabilidades ou revisões formais de conformidade de segurança. Portanto, **ESTE SOFTWARE NÃO DEVE SER CONSIDERADO SEGURO**.
> 4. **NUNCA Conecte Contas Pessoais ou Corporativas Reais**:
>    - **NUNCA** utilize suas contas pessoais principais do Google nem autorize acesso a dados sensíveis, pastas pessoais ou documentos confidenciais do seu Google Drive/Google Docs.
>    - Caso deseje testar as funcionalidades de integração com a nuvem (Google Drive/Docs OAuth ou Google Gemini API), utilize **exclusivamente contas descartáveis de teste (sandbox / burner accounts)** e chaves de API sem dados reais.
> 5. **Isenção Total de Responsabilidade**: Os autores, criadores e colaboradores **não assumem nenhuma responsabilidade legal, técnica ou operacional** por qualquer problema de segurança, vazamento de credenciais, corrupção ou perda de dados, acesso indevido ou indisponibilidade relacionado ao uso, implantação ou execução deste projeto. **Você utiliza este software 100% por sua própria conta e risco**.

---

> **CertStudy** é um companheiro de estudos pessoal e gratuito para certificações profissionais de tecnologia (AWS, Google Cloud, Microsoft Azure, Kubernetes, Terraform, CompTIA, Cisco, entre outras). Construído com uma arquitetura **100% Client-Side** e **BYOS (Bring Your Own Storage)**, garantindo privacidade absoluta, custo zero de infraestrutura e sincronização entre PC e smartphone via Google Drive e Google Docs.

---

## 🌟 Por que o CertStudy é Diferente?

1. **Custo $0,00 de Infraestrutura**: Não exige servidores backend complexos ou bancos de dados caros na nuvem.
2. **Privacidade e Posse dos Dados (BYOS)**: Todos os seus simulados, respostas, anotações e progresso pertencem exclusivamente a você. Nada é salvo em servidores de terceiros.
3. **Sincronização PC ↔ Celular**: Estude no computador de mesa, faça backup na sua pasta pessoal do Google Drive (`/CertStudy`) com um clique e continue seus simulados no smartphone exatamente de onde parou.
4. **Integração Nativa com Google Docs**: Transforme suas notas de revisão em documentos formatados no seu Google Docs pessoal para ler offline ou imprimir.
5. **100% Aberto e Customizável**: Clone o projeto, adicione suas próprias questões ou compartilhe o link pronto com sua audiência e colegas de estudo.

---

## 🚀 Funcionalidades Principais

### 🎯 Simulados de Exame (Mock Exams)
- **Modo Exame Real**: Cronômetro regressivo com contagem oficial da certificação.
- **Acomodação de Tempo (ESL Accommodation)**: Adiciona automaticamente +30 minutos para estudantes que não possuem o inglês como idioma nativo.
- **Marcação para Revisão (Flag for Review)**: Marque questões duvidosas para revisar antes de finalizar a prova.
- **Modo Prático / Estudo**: Visualize gabarito instantâneo e explicações didáticas para cada alternativa.
- **Histórico & Desempenho**: Gráficos de pontuação, taxa de aprovação e detalhamento por domínio de conhecimento.

### 📝 Editor de Notas & Sincronização com Google Docs
- Bloco de anotações organizado por certificação e módulo.
- Formatação em texto rico e suporte a tags temáticas.
- **Botão "Sync with Google Docs"**: Cria ou atualiza automaticamente o arquivo de anotações no seu Google Docs com formatação estruturada, tópicos e data da última sincronização.

### 📚 Banco de Questões (Question Bank)
- Suporte a questões de **escolha única** e **múltipla escolha (Multiple Response)**.
- Classificação por domínios de conhecimento e níveis de dificuldade.
- Importação e exportação de simulados em formato `.json`.
- Acompanha presets com questões de exemplo para certificações de nuvem (AWS Solutions Architect, Google Cloud Associate, Azure Fundamentals).

### ☁️ Sincronização em Nuvem (Google Drive BYOS)
- Autenticação transparente via popup do Google usando **Google Identity Services (OAuth 2.0 PKCE)**.
- Criação e detecção automática da pasta `/CertStudy` no seu Google Drive.
- Backup completo (`certstudy_cloud_backup.json`) com um clique em **Settings > Backup to Drive**.
- Restauração instantânea em novos dispositivos em **Settings > Restore from Drive**.

### 🤖 Tutor, Copiloto e Importação em Lote com Google Gemini AI (BYOK)
- **Importação em Lote via ZIP (.zip, .html, .md)**: Envie um arquivo compactado `.zip` contendo documentos HTML ou Markdown. O sistema descompacta no navegador e a IA do Gemini divide o documento, identifica os enunciados, extrai as alternativas, detecta a resposta correta e categoriza por domínio do exame.
- **Tutor de Questões em Simulados e Bancos**: Tire dúvidas sobre qualquer questão de prova; o Gemini analisa o enunciado, alternativas e gabarito, explicando os distratores, pegadinhas e dicas de prova.
- **Copiloto Inteligente de Notas (Markdown)**: Janela retrátil ao lado da nota com acesso ao texto em tempo real. O Gemini pode resumir, expandir tópicos, gerar flashcards e **editar o texto Markdown diretamente** com botões *"Substituir Nota"* ou *"Adicionar ao Final"*.
- **Arquitetura 100% BYOK (Bring Your Own Key)**: Chave gratuita do [Google AI Studio](https://aistudio.google.com/apikey) salva apenas localmente no navegador, sem custos ou servidores de terceiros.

### 🌓 Interface Moderna & Acessível
- Suporte a **Dark Mode** e **Light Mode**.
- Totalmente responsivo para navegadores móveis (Android e iOS) e telas ultrawide.
- Suporte multilíngue integrado: Português (PT-BR), Inglês (EN-US) e Espanhol (ES).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones & Animações**: [Lucide React](https://lucide.dev/) e [Motion](https://motion.dev/)
- **Efeitos de Vitória**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Autenticação e APIs**: [Google Identity Services (GSI)](https://developers.google.com/identity/gsi/web), [Google Drive API v3](https://developers.google.com/drive) e [Google Docs API v1](https://developers.google.com/docs)
- **CI/CD**: GitHub Actions para deploy estático no **GitHub Pages**

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior (ou [Bun](https://bun.sh/))
- Git

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (Opcional)
Copie o arquivo de exemplo para `.env`:
```bash
cp .env.example .env
```
*(Para uso padrão local, nenhuma chave obrigatória é necessária. O app funciona 100% offline via localStorage. Se você quiser testar a integração com o Google Drive usando suas próprias credenciais OAuth, veja a seção abaixo).*

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra o navegador no endereço: [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deploy no GitHub Pages (Passo a Passo)

O repositório já está configurado e publicado em produção no **GitHub Pages** através do domínio customizado:
🔗 **[https://study.biagolini.click/](https://study.biagolini.click/)**

O arquivo de automação `.github/workflows/deploy.yml` cuida do build com Bun e publicação estática automática. Para fazer o deploy da sua própria versão:

1. Faça o push do código para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat: initial commit with CertStudy companion"
   git push origin main
   ```
2. No seu repositório no GitHub, clique na aba **Settings**.
3. No menu lateral esquerdo, clique em **Pages** (dentro da seção *Code and automation*).
4. Em **Build and deployment > Source**, selecione a opção **GitHub Actions**.
5. Pronto! Acesse a aba **Actions** no topo do repositório para acompanhar o build. Em poucos segundos seu site estará publicado em:
   `https://<seu-usuario>.github.io/<nome-do-repositorio>/` (ou no seu domínio customizado especificado em `public/CNAME`, como `https://study.biagolini.click/`).

---

## 🔑 Como Configurar o Google Drive & Docs (OAuth 2.0)

O CertStudy se conecta diretamente com a API do Google pelo próprio navegador do usuário (Client-Side OAuth).

Caso você queira utilizar suas próprias credenciais do Google Cloud para a sua versão no GitHub Pages ou domínio personalizado:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto (ex: `CertStudy`).
3. Vá em **APIs e Serviços > Biblioteca** e ative:
   - **Google Drive API**
   - **Google Docs API**
4. Vá em **Tela de Permissão OAuth** (OAuth Consent Screen):
   - Escolha o tipo de usuário **Externo**.
   - Preencha o nome do app e email de suporte.
   - Nos escopos, adicione:
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/documents`
5. Vá em **Credenciais > Criar Credenciais > ID do cliente OAuth**:
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Em **Origens JavaScript autorizadas** (Authorized JavaScript origins), adicione:
     - `http://localhost:3000` (para desenvolvimento local)
     - `http://localhost:5173` (caso use Vite em outra porta local)
     - `https://<seu-usuario>.github.io` (para seu GitHub Pages padrão)
     - `https://study.seudominio.com` (se você utiliza um **domínio personalizado / CNAME**, adicione a URL exata do seu domínio)
   > ⚠️ **Atenção Crítica — Evite o `Error 400: origin_mismatch`**:
   > Se o seu site estiver rodando em um domínio personalizado (ex: `https://study.seudominio.com`) ou subdomínio e você não cadastrar exatamente essa origem em **Origens JavaScript autorizadas**, o Google exibirá o erro:
   > `Access blocked: Authorization Error - Não é possível fazer login no app porque ele não obedece à política do OAuth 2.0 do Google. Se você é o desenvolvedor do app, registre a origem JavaScript no Console do Google Cloud. Error 400: origin_mismatch`.
   > **Regras de preenchimento:**
   > - Não adicione barra no final (`/`) da URL (use `https://study.seudominio.com`, e **não** `https://study.seudominio.com/`).
   > - Deve conter o protocolo exato (`https://`).
   > - Alterações de origens no console do Google Cloud podem levar de 2 a 5 minutos para propagar globalmente.
6. Copie o **ID do cliente** gerado e adicione no arquivo `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
   ```
   *(Caso faça deploy no GitHub Pages via GitHub Actions, você pode adicionar esse valor em **Settings > Secrets and variables > Actions > New repository secret** com o nome `VITE_GOOGLE_CLIENT_ID`)*.

📖 **Guias Passo a Passo (Anônimos):**  
- 👉 **[`docs/google-cloud-oauth-setup.md`](docs/google-cloud-oauth-setup.md)**: Configuração inicial do OAuth 2.0 no GCP, origens JavaScript e variáveis de ambiente.
- 👉 **[`docs/google-oauth-app-verification-and-demo-video.md`](docs/google-oauth-app-verification-and-demo-video.md)**: Como contornar o aviso *"Google hasn't verified this app"*, gravar o vídeo de demonstração exigido e aprovar o app no Google.
- 👉 **[`docs/oauth-homepage-domain-verification.md`](docs/oauth-homepage-domain-verification.md)**: Verificação de propriedade de domínio via Google Search Console e registro DNS TXT.

---

## 📂 Estrutura de Diretórios

```text
├── .github/
│   └── workflows/
│       └── deploy.yml            # Pipeline de automação do GitHub Pages
├── public/                       # Favicon e arquivos estáticos
├── src/
│   ├── components/               # Componentes visuais do app
│   │   ├── Header.tsx            # Barra superior com status de nuvem e atalhos
│   │   ├── SettingsModal.tsx     # Configurações, backup no Drive e preferências
│   │   ├── Home/                 # Visão geral de certificações cadastradas
│   │   ├── MockExams/            # Execução de simulados, timers e resultados
│   │   ├── Notes/                # Editor de notas e sincronização Google Docs
│   │   ├── QuestionBanks/        # Gestão e visualização de questões
│   │   └── Workspace/            # Área de trabalho focada por exame
│   ├── context/
│   │   ├── AppContext.tsx        # Estado global (certificações, questões, progresso)
│   │   └── GoogleWorkspaceContext.tsx # Contexto de autenticação e sync no Drive/Docs
│   ├── data/
│   │   ├── certificationPresets.json # Presets oficiais de exames
│   │   └── sampleStarterData.ts      # Dados e questões iniciais de exemplo
│   ├── i18n/
│   │   ├── LanguageContext.tsx   # Alternador de idiomas
│   │   └── translations.ts       # Textos em PT-BR, EN e ES
│   ├── services/
│   │   └── googleWorkspaceService.ts # Integração com GSI, Drive v3 e Docs v1
│   ├── App.tsx                   # Roteamento e orquestração de abas
│   ├── index.css                 # Configuração do Tailwind CSS v4
│   ├── main.tsx                  # Ponto de entrada do React
│   └── types.ts                  # Definições de interfaces TypeScript
├── .env.example                  # Template de variáveis de ambiente
├── index.html                    # Estrutura HTML principal com SEO e OpenGraph
├── package.json                  # Dependências e scripts do projeto
├── tsconfig.json                 # Configurações do compilador TypeScript
└── vite.config.ts                # Configurações do Vite (com base relativa para Pages)
```

---

## 🤝 Como Contribuir

Contribuições são super bem-vindas! Você pode colaborar de várias formas:
- 💡 **Novos Bancos de Questões**: Adicione novas questões ou presets de certificações em `src/data/certificationPresets.json`.
- 🐛 **Correções de Bugs & Melhorias**: Abra uma [Issue](https://github.com/SEU-USUARIO/SEU-REPOSITORIO/issues) relatando comportamentos inesperados.
- 🎨 **Melhorias de UI/UX**: Envie sugestões de design ou novos recursos para o simulador.

Para enviar código:
1. Faça um Fork do projeto.
2. Crie uma branch para sua funcionalidade: `git checkout -b feature/minha-melhoria`.
3. Faça commit das alterações: `git commit -m 'feat: adicionar simulado para CKA'`.
4. Envie para o branch: `git push origin feature/minha-melhoria`.
5. Abra um **Pull Request**.

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Você é livre para usar, clonar, estudar, modificar e compartilhar o código livremente.

---

<p align="center">
  Desenvolvido com foco no aprendizado contínuo e na aprovação em certificações de tecnologia 🚀
</p>
