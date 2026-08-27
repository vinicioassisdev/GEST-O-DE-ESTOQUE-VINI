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

## 🗄️ Integração com Banco de Dados Externo

Atualmente o sistema possui persistência local com exportação/importação de backups JSON. Caso deseje conectar a um **Banco de Dados Externo na Nuvem ou On-Premise** (como **PostgreSQL**, **Supabase**, **MySQL** ou **Firebase Firestore**), siga os passos abaixo para cada arquitetura:

---

### Opção 1: PostgreSQL / Supabase / MySQL (Recomendado via Express)

Como a aplicação já possui o backend **`server.ts`** em Express, você pode criar uma camada de persistência com **Prisma ORM** ou **Drizzle ORM**.

#### 1. Instalar as dependências do ORM e Driver
```bash
# Exemplo com Prisma e PostgreSQL:
npm install @prisma/client
npm install -D prisma

# Ou se preferir usar Drizzle:
# npm install drizzle-orm pg
# npm install -D drizzle-kit @types/pg
```

#### 2. Inicializar o Prisma
```bash
npx prisma init
```

#### 3. Configurar a variável de conexão no arquivo `.env`
Crie um arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://usuario:senha@seu-host.com:5432/almoxarifado?schema=public"
```

#### 4. Definir o Schema dos Modelos no `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id           String   @id @default(uuid())
  code         String   @unique
  name         String
  category     String
  quantity     Float    @default(0)
  minQuantity  Float    @default(0)
  unitPrice    Float    @default(0)
  costPrice    Float    @default(0)
  unit         String   @default("UN")
  location     String?
  supplier     String?
  barcode      String?
  equipmentTag String?
  description  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model WorkOrder {
  id              String   @id @default(uuid())
  osNumber        String   @unique
  requesterName   String
  mechanicName    String?
  serviceType     String
  priority        String
  operationalArea String?
  notes           String?
  totalCost       Float    @default(0)
  totalQuantity   Float    @default(0)
  status          String   @default("ABERTA") // ABERTA, PARCIAL, CONCLUIDA, CANCELADA
  authorizedBy    String?
  createdAt       DateTime @default(now())
  items           WorkOrderItem[]
}

model WorkOrderItem {
  id                 String    @id @default(uuid())
  workOrderId        String
  workOrder          WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  productId          String
  productCode        String
  productName        String
  quantity           Float
  dischargedQuantity Float     @default(0)
  returnedQuantity   Float     @default(0)
  unitPrice          Float
  unit               String?
}

model Movement {
  id           String   @id @default(uuid())
  type         String   // ENTRY, EXIT, RECONCILE, RETURN
  productId    String
  productCode  String
  productName  String
  quantity     Float
  reason       String
  date         DateTime @default(now())
  user         String
  workOrderId  String?
  osNumber     String?
  documentNumber String?
}
```

#### 5. Executar as Migrações
```bash
npx prisma migrate dev --name init
```

#### 6. Criar as Rotas de API no `server.ts`
No arquivo `server.ts`, adicione as rotas REST para conectar o Frontend ao banco:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Listar produtos
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

// Salvar / atualizar produto
app.post('/api/products', async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  res.json(product);
});

// Listar Ordens de Serviço
app.get('/api/work-orders', async (req, res) => {
  const orders = await prisma.workOrder.findMany({ include: { items: true } });
  res.json(orders);
});
```

---

### Opção 2: Firebase Firestore (Cloud NoSQL em Tempo Real)

Se preferir um banco NoSQL gerenciado em nuvem sem necessidade de gerenciar servidor:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Crie um banco **Cloud Firestore**.
3. Instale o SDK:
   ```bash
   npm install firebase
   ```
4. Crie o arquivo `src/lib/firebase.ts`:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };

   export const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
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
