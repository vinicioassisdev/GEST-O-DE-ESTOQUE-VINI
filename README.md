# 📦 Almoxarifado Industrial & Controle de Sobressalentes (O.S.)

Sistema completo para gestão de estoque industrial, controle de sobressalentes, inventário de manutenção, emissão e baixa de Ordens de Serviço (O.S.) e devolução de sobras.

---

## 🚀 Funcionalidades Principais

- **📦 Controle de Estoque & Sobressalentes**:
  - Cadastro completo com código interno, código de barras/EAN, categoria, localização no armazém, tag de equipamento, fornecedor e preço de custo.
  - Alertas automáticos de estoque mínimo e crítico.
  - Scanner de código de barras integrado (via câmera ou leitor USB).
  - Auditoria e conciliação rápida de inventário físico vs. sistema.

- **🛠️ Gestão de Ordens de Serviço (O.S.) & Manutenção**:
  - Emissão de Guias de Liberação/Separação de campo (Status: `ABERTA`).
  - Geração automática de PDF nos formatos: **Via de Campo/Técnica** (sem valores) e **Via Administrativa** (com custos e totalização).
  - Baixa física de materiais efetivamente utilizados (suporte a baixa parcial).
  - Controle de devolução de sobras não utilizadas ao almoxarifado.

- **📊 Movimentações & Histórico**:
  - Registro de Entradas (compras, devoluções) e Saídas (manutenção, preventiva, corretiva).
  - Histórico completo rastreável por data, responsável, O.S. e motivo.

- **👥 Controle de Acesso & Perfis**:
  - Perfis de usuário (Administrador, Almoxarife, Técnico/Mecânico).
  - Gestão de áreas e estações operacionais.

- **💾 Segurança de Dados**:
  - Backup completo em formato JSON (exportação e restauração com um clique).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones & Animações**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Relatórios & PDF**: [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Leitura de Código de Barras**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **Backend / Servidor**: [Express](https://expressjs.com/), [Node.js](https://nodejs.org/), [Vite](https://vitejs.dev/)

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior recomendada)
- **npm**, **yarn** ou **pnpm**

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
   cd NOME-DO-REPOSITORIO
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra `http://localhost:3000`

---

## 📦 Como Gerar a Versão de Produção (Build)

Para compilar o frontend e o servidor backend para produção:

```bash
npm run build
```

Para iniciar a aplicação compilada:

```bash
npm start
```

---

## 📁 Estrutura do Projeto

```text
├── public/                 # Arquivos estáticos
├── src/
│   ├── components/         # Modais, Tabelas e Telas do Sistema
│   │   ├── InventoryView.tsx          # Gestão do Inventário e Peças
│   │   ├── WorkOrdersView.tsx         # Listagem e Ações de O.S.
│   │   ├── WorkOrderGeneratorModal.tsx# Emissor de O.S. e Guia de Campo
│   │   ├── WorkOrderDischargeModal.tsx# Baixa de Materiais Utilizados
│   │   ├── WorkOrderReturnModal.tsx   # Devolução de Sobras de O.S.
│   │   ├── EntriesView.tsx            # Histórico de Entradas
│   │   ├── ExitsView.tsx              # Histórico de Saídas
│   │   ├── ProductFormModal.tsx       # Cadastro / Edição de Peças
│   │   └── ...
│   ├── lib/                # Funções utilitárias e geração de PDF
│   ├── types.ts            # Interfaces TypeScript
│   ├── App.tsx             # Componente Principal e Estado Global
│   └── main.tsx            # Ponto de Entrada React
├── server.ts               # Servidor Express / SSR Middleware
├── package.json            # Dependências e Scripts
└── README.md               # Documentação do Projeto
```

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
