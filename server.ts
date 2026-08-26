import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Database file path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory-db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_industrial_mro_salt_2026').digest('hex');
}

export type UserRole = 'ADMIN' | 'ALMOXARIFE' | 'PCM_ENG' | 'MECANICO' | 'CONSULTA';

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  passwordHash: string;
  active: boolean;
  department?: string;
  avatarColor?: string;
  createdAt: string;
  lastLogin?: string;
}

interface DBStructure {
  products: Array<{
    id: string;
    code: string;
    barcode?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock?: number;
    costPrice: number;
    sellingPrice: number;
    supplier?: string;
    location?: string;
    equipmentTag?: string;
    criticality?: 'HIGH' | 'MEDIUM' | 'LOW';
    createdAt: string;
    updatedAt: string;
  }>;
  movements: Array<{
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    previousStock: number;
    newStock: number;
    unitPrice: number;
    totalPrice: number;
    reason: string;
    documentNumber?: string;
    contactName?: string;
    responsible: string;
    notes?: string;
    timestamp: string;
  }>;
  users: Array<UserRecord>;
  workOrders: Array<{
    id: string;
    osNumber: string;
    date: string;
    serviceType: string;
    application: string;
    equipmentTag?: string;
    requesterName: string;
    requesterRole?: string;
    authorizedBy: string;
    warehouseKeeper?: string;
    sector?: string;
    priority: string;
    items: Array<{
      productId: string;
      productCode: string;
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
      currentStock: number;
    }>;
    totalCost: number;
    totalQuantity: number;
    status: string;
    notes?: string;
    createdAt: string;
  }>;
}

const initialSeedData: DBStructure = {
  users: [
    {
      id: 'usr-admin',
      name: 'Vinício de Assis (Gestor)',
      username: 'admin',
      email: 'viniciodeassisotlengenharia@gmail.com',
      role: 'ADMIN',
      passwordHash: hashPassword('admin123'),
      active: true,
      department: 'Gestão Geral & Engenharia',
      avatarColor: 'bg-purple-600',
      createdAt: '2026-08-01T08:00:00.000Z',
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-geral',
      name: 'Acesso Geral (Operação Completa)',
      username: 'geral',
      email: 'geral@empresa.com.br',
      role: 'ADMIN',
      passwordHash: hashPassword('geral123'),
      active: true,
      department: 'Operação Geral de Almoxarifado',
      avatarColor: 'bg-indigo-600',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'usr-consulta',
      name: 'Usuário Consulta (Somente Leitura)',
      username: 'consulta',
      email: 'consulta@empresa.com.br',
      role: 'CONSULTA',
      passwordHash: hashPassword('consulta123'),
      active: true,
      department: 'Consulta & Visualização Externa',
      avatarColor: 'bg-slate-600',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'usr-heliel',
      name: 'Heliel (Mecânica & Manutenção)',
      username: 'heliel',
      email: 'heliel.manutencao@empresa.com.br',
      role: 'MECANICO',
      passwordHash: hashPassword('heliel123'),
      active: true,
      department: 'Manutenção Mecânica de Fábrica',
      avatarColor: 'bg-amber-600',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'usr-almox',
      name: 'Carlos Almoxarife',
      username: 'carlos.almoxarife',
      email: 'almoxarifado@empresa.com.br',
      role: 'ALMOXARIFE',
      passwordHash: hashPassword('almox123'),
      active: true,
      department: 'Almoxarifado Central & MRO',
      avatarColor: 'bg-emerald-600',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'usr-pcm',
      name: 'André PCM (Planejamento)',
      username: 'andre.pcm',
      email: 'pcm@empresa.com.br',
      role: 'PCM_ENG',
      passwordHash: hashPassword('pcm123'),
      active: true,
      department: 'Planejamento e Controle de Manutenção',
      avatarColor: 'bg-blue-600',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'usr-mec',
      name: 'Renato Eletromecânico',
      username: 'renato.mecanico',
      email: 'manutencao.campo@empresa.com.br',
      role: 'MECANICO',
      passwordHash: hashPassword('mec123'),
      active: true,
      department: 'Oficina Mecânica & Elétrica',
      avatarColor: 'bg-amber-600',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
  ],
  products: [
    {
      id: 'prod-1',
      code: 'MNT-001',
      barcode: '7891000100011',
      name: 'Rolamento Autocompensador 22216 EK',
      description: 'Rolamento de rolos esféricos para redutor principal de esteira',
      category: 'Rolamentos & Mancais',
      unit: 'UN',
      currentStock: 6,
      minStock: 2,
      maxStock: 10,
      costPrice: 420.0,
      sellingPrice: 420.0,
      supplier: 'SKF Distribuidora Brasil',
      location: 'Gaveteiro M-02 / Prateleira A',
      equipmentTag: 'EST-CV-01 / RED-04',
      criticality: 'HIGH',
      createdAt: '2026-08-01T08:30:00.000Z',
      updatedAt: '2026-08-20T10:15:00.000Z',
    },
    {
      id: 'prod-2',
      code: 'MNT-002',
      barcode: '7891000100028',
      name: 'Válvula Solenoide Direcional 5/2 Vias 24VCC',
      description: 'Válvula pneumática para acionamento de cilindro alimentador',
      category: 'Pneumática',
      unit: 'UN',
      currentStock: 1,
      minStock: 3,
      maxStock: 8,
      costPrice: 285.0,
      sellingPrice: 285.0,
      supplier: 'Festo Automação Industrial',
      location: 'Prateleira P-03',
      equipmentTag: 'PRE-HY-02 / EMB-01',
      criticality: 'HIGH',
      createdAt: '2026-08-02T09:00:00.000Z',
      updatedAt: '2026-08-25T14:20:00.000Z',
    },
    {
      id: 'prod-3',
      code: 'MNT-003',
      barcode: '7891000100035',
      name: 'Óleo Lubrificante Sintético ISO VG 220',
      description: 'Tambor/Bombona de 20 Litros para engrenagens fechadas e redutores',
      category: 'Lubrificantes & Químicos',
      unit: 'L',
      currentStock: 60,
      minStock: 20,
      maxStock: 120,
      costPrice: 38.5,
      sellingPrice: 38.5,
      supplier: 'Mobil Lubrificantes Industriais',
      location: 'Bacia de Contenção Q-01',
      equipmentTag: 'Linha Geral de Britagem',
      criticality: 'MEDIUM',
      createdAt: '2026-08-03T11:00:00.000Z',
      updatedAt: '2026-08-22T16:00:00.000Z',
    },
    {
      id: 'prod-4',
      code: 'MNT-004',
      barcode: '7891000100042',
      name: 'Contator de Potência Tripolar 32A 220V (Siemens)',
      description: 'Contator auxiliar para acionamento de motor bomba d’água',
      category: 'Elétrica & Painéis',
      unit: 'UN',
      currentStock: 0,
      minStock: 2,
      maxStock: 6,
      costPrice: 195.0,
      sellingPrice: 195.0,
      supplier: 'Siemens Brasil / Eletro Peças',
      location: 'Armário Elétrico E-01',
      equipmentTag: 'CCM-02 / BOM-05',
      criticality: 'HIGH',
      createdAt: '2026-08-04T10:30:00.000Z',
      updatedAt: '2026-08-26T08:00:00.000Z',
    },
    {
      id: 'prod-5',
      code: 'MNT-005',
      barcode: '7891000100059',
      name: 'Correia em V Perfil B-68 Gates',
      description: 'Correia de transmissão de alta resistência a calor e óleo',
      category: 'Correias & Polias',
      unit: 'UN',
      currentStock: 12,
      minStock: 4,
      maxStock: 20,
      costPrice: 46.0,
      sellingPrice: 46.0,
      supplier: 'Gates Transmissões Brasil',
      location: 'Ganchos Prateleira T-04',
      equipmentTag: 'EXA-VEN-03 / COM-01',
      criticality: 'MEDIUM',
      createdAt: '2026-08-05T13:45:00.000Z',
      updatedAt: '2026-08-24T11:30:00.000Z',
    },
    {
      id: 'prod-6',
      code: 'MNT-006',
      barcode: '7891000100066',
      name: 'Retentor Radial de Óleo 45x65x10 NBR (Sabó)',
      description: 'Vedação para eixo de bomba centrífuga',
      category: 'Vedações & Retentores',
      unit: 'UN',
      currentStock: 18,
      minStock: 5,
      maxStock: 30,
      costPrice: 22.8,
      sellingPrice: 22.8,
      supplier: 'Sabó Vedação Industrial',
      location: 'Gaveteiro V-01',
      equipmentTag: 'BOM-01 a BOM-08',
      criticality: 'LOW',
      createdAt: '2026-08-06T15:00:00.000Z',
      updatedAt: '2026-08-21T09:10:00.000Z',
    },
    {
      id: 'prod-rol-3311',
      code: 'ROL-3311',
      barcode: '7891000133110',
      name: 'Rolamento 3311 (Contato Angular Duplo)',
      description: 'Rolamento de esferas com duas carreiras 3311 / 5311 55x120x49.2mm',
      category: 'Rolamentos & Mancais',
      unit: 'UN',
      currentStock: 14,
      minStock: 3,
      maxStock: 25,
      costPrice: 380.0,
      sellingPrice: 380.0,
      supplier: 'SKF / FAG Rolamentos Brasil',
      location: 'Gaveteiro R-03 / Prateleira B',
      equipmentTag: 'BOM-01 a BOM-10 / RED-02',
      criticality: 'HIGH',
      createdAt: '2026-08-07T08:00:00.000Z',
      updatedAt: '2026-08-26T09:00:00.000Z',
    },
    {
      id: 'prod-rol-3310',
      code: 'ROL-3310',
      barcode: '7891000133103',
      name: 'Rolamento 3310 (Contato Angular Duplo)',
      description: 'Rolamento de esferas com duas carreiras 3310 / 5310 50x110x44.4mm',
      category: 'Rolamentos & Mancais',
      unit: 'UN',
      currentStock: 10,
      minStock: 2,
      maxStock: 20,
      costPrice: 345.0,
      sellingPrice: 345.0,
      supplier: 'NSK / SKF Rolamentos',
      location: 'Gaveteiro R-03 / Prateleira B',
      equipmentTag: 'BOM-03 / RED-01',
      criticality: 'HIGH',
      createdAt: '2026-08-07T08:30:00.000Z',
      updatedAt: '2026-08-26T09:00:00.000Z',
    },
    {
      id: 'prod-ret-473610',
      code: 'RET-473610',
      barcode: '7891000473610',
      name: 'Retentor 47x36x10 NBR (Vedação Industrial)',
      description: 'Retentor radial em borracha nitrílica NBR 47x36x10 com mola',
      category: 'Vedações & Retentores',
      unit: 'UN',
      currentStock: 25,
      minStock: 5,
      maxStock: 50,
      costPrice: 32.5,
      sellingPrice: 32.5,
      supplier: 'Sabó / Vedabrás Retentores',
      location: 'Gaveteiro V-02 / Gaveta 4',
      equipmentTag: 'Bombas Centrífugas & Redutores',
      criticality: 'MEDIUM',
      createdAt: '2026-08-08T10:00:00.000Z',
      updatedAt: '2026-08-26T09:00:00.000Z',
    },
    {
      id: 'prod-selo-mec',
      code: 'SLM-001',
      barcode: '7891000000999',
      name: 'Selo Mecânico 1.3/8" Silício/Silício Viton',
      description: 'Selo mecânico balanceado de alta durabilidade para bombas de processo',
      category: 'Vedações & Retentores',
      unit: 'UN',
      currentStock: 8,
      minStock: 2,
      maxStock: 15,
      costPrice: 490.0,
      sellingPrice: 490.0,
      supplier: 'John Crane / Aesseal Selos',
      location: 'Armário V-04 (Protegido)',
      equipmentTag: 'BOM-01 / BOM-02 / BOM-03',
      criticality: 'HIGH',
      createdAt: '2026-08-08T11:00:00.000Z',
      updatedAt: '2026-08-26T09:00:00.000Z',
    }
  ],
  movements: [
    {
      id: 'mov-1',
      productId: 'prod-1',
      productCode: 'MNT-001',
      productName: 'Rolamento Autocompensador 22216 EK',
      type: 'IN',
      quantity: 8,
      previousStock: 0,
      newStock: 8,
      unitPrice: 420.0,
      totalPrice: 3360.0,
      reason: 'Compra / Reposição de Sobressalentes',
      documentNumber: 'NF-10492',
      contactName: 'SKF Distribuidora Brasil',
      responsible: 'Almoxarife Carlos',
      notes: 'Recebimento de lote para estoque de segurança preventiva',
      timestamp: '2026-08-01T09:00:00.000Z',
    },
    {
      id: 'mov-2',
      productId: 'prod-1',
      productCode: 'MNT-001',
      productName: 'Rolamento Autocompensador 22216 EK',
      type: 'OUT',
      quantity: 2,
      previousStock: 8,
      newStock: 6,
      unitPrice: 420.0,
      totalPrice: 840.0,
      reason: 'Aplicação em O.S. Preventiva',
      documentNumber: 'OS-2026-089',
      contactName: 'TAG: EST-CV-01 (Esteira Transportadora 1)',
      responsible: 'Mecânico André / L. Silva',
      notes: 'Troca preventiva de rolamentos da esteira principal',
      timestamp: '2026-08-20T10:15:00.000Z',
    },
    {
      id: 'mov-3',
      productId: 'prod-2',
      productCode: 'MNT-002',
      productName: 'Válvula Solenoide Direcional 5/2 Vias 24VCC',
      type: 'IN',
      quantity: 3,
      previousStock: 0,
      newStock: 3,
      unitPrice: 285.0,
      totalPrice: 855.0,
      reason: 'Compra / Reposição de Sobressalentes',
      documentNumber: 'NF-10512',
      contactName: 'Festo Automação Industrial',
      responsible: 'Almoxarife Carlos',
      notes: 'Aquisição de sobressalentes pneumáticos para prensas',
      timestamp: '2026-08-02T10:00:00.000Z',
    },
    {
      id: 'mov-4',
      productId: 'prod-2',
      productCode: 'MNT-002',
      productName: 'Válvula Solenoide Direcional 5/2 Vias 24VCC',
      type: 'OUT',
      quantity: 2,
      previousStock: 3,
      newStock: 1,
      unitPrice: 285.0,
      totalPrice: 570.0,
      reason: 'Aplicação em O.S. Corretiva (Urgente)',
      documentNumber: 'OS-2026-114',
      contactName: 'TAG: PRE-HY-02 (Prensa Hidráulica 2)',
      responsible: 'Téc. Mecatrônico Marcos',
      notes: 'Troca imediata por falha na bobina durante o turno produtivo',
      timestamp: '2026-08-25T14:20:00.000Z',
    },
    {
      id: 'mov-5',
      productId: 'prod-4',
      productCode: 'MNT-004',
      productName: 'Contator de Potência Tripolar 32A 220V (Siemens)',
      type: 'OUT',
      quantity: 2,
      previousStock: 2,
      newStock: 0,
      unitPrice: 195.0,
      totalPrice: 390.0,
      reason: 'Aplicação em O.S. Corretiva (Urgente)',
      documentNumber: 'OS-2026-121',
      contactName: 'TAG: CCM-02 / BOM-05',
      responsible: 'Eletricista Renato',
      notes: 'Item esgotado no almoxarifado, requisitada compra urgente',
      timestamp: '2026-08-26T08:00:00.000Z',
    }
  ],
  workOrders: [
    {
      id: 'os-seed-1',
      osNumber: 'OS-2026-0042',
      date: '2026-08-26T10:30:00.000Z',
      serviceType: 'CORRETIVA',
      application: 'Bomba Centrífuga B-03 (Linha de Envase) - Substituição de rolamentos do mancal e vedação do selo mecânico',
      equipmentTag: 'BOM-03 / ENV-01',
      requesterName: 'Heliel',
      requesterRole: 'Mecânico de Manutenção Industrial',
      authorizedBy: 'Carlos Almoxarife (Supervisão)',
      warehouseKeeper: 'Carlos Almoxarife',
      sector: 'Oficina Mecânica & Linha de Envase',
      priority: 'ALTA',
      items: [
        {
          productId: 'prod-rol-3311',
          productCode: 'ROL-3311',
          productName: 'Rolamento 3311 (Contato Angular Duplo)',
          quantity: 1,
          unit: 'UN',
          unitPrice: 380.0,
          totalPrice: 380.0,
          currentStock: 14,
        },
        {
          productId: 'prod-rol-3310',
          productCode: 'ROL-3310',
          productName: 'Rolamento 3310 (Contato Angular Duplo)',
          quantity: 1,
          unit: 'UN',
          unitPrice: 345.0,
          totalPrice: 345.0,
          currentStock: 10,
        },
        {
          productId: 'prod-ret-473610',
          productCode: 'RET-473610',
          productName: 'Retentor 47x36x10 NBR (Vedação Industrial)',
          quantity: 1,
          unit: 'UN',
          unitPrice: 32.5,
          totalPrice: 32.5,
          currentStock: 25,
        },
        {
          productId: 'prod-selo-mec',
          productCode: 'SLM-001',
          productName: 'Selo Mecânico 1.3/8" Silício/Silício Viton',
          quantity: 1,
          unit: 'UN',
          unitPrice: 490.0,
          totalPrice: 490.0,
          currentStock: 8,
        },
      ],
      totalCost: 1247.5,
      totalQuantity: 4,
      status: 'CONCLUIDA',
      notes: 'Manutenção realizada com sucesso após ruído excessivo no mancal dianteiro. Testado sob pressão nominal.',
      createdAt: '2026-08-26T10:30:00.000Z',
    },
  ],
};

// Helper to strip passwordHash from user object
function sanitizeUser(user: UserRecord) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Helper to read DB
function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2), 'utf-8');
      return initialSeedData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.products) data.products = [];
    if (!data.movements) data.movements = [];
    if (!data.workOrders) data.workOrders = initialSeedData.workOrders || [];
    
    // Ensure seed products (like Rolamento 3311, Rolamento 3310, Retentor 47x36x10, Selo Mecanico) exist
    for (const seedProd of initialSeedData.products) {
      if (!data.products.some((p: { id: string; code: string }) => p.id === seedProd.id || p.code === seedProd.code)) {
        data.products.push(seedProd);
      }
    }

    if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
      data.users = initialSeedData.users;
    } else {
      // Ensure seed users like 'geral', 'consulta', 'heliel' exist
      for (const seedUser of initialSeedData.users) {
        if (!data.users.some((u: UserRecord) => u.username === seedUser.username)) {
          data.users.push(seedUser);
        }
      }
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
    return data;
  } catch (err) {
    console.error('Error reading database file, returning fallback data:', err);
    return initialSeedData;
  }
}

// Helper to write DB
function writeDB(data: DBStructure): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// ==========================================
// AUTH & USERS ROUTES
// ==========================================

// POST Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário/E-mail e senha são obrigatórios.' });
  }

  const db = readDB();
  const cleanUsername = String(username).trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      (u.email && u.email.toLowerCase() === cleanUsername)
  );

  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'Este usuário está inativo. Contate o administrador.' });
  }

  const inputHash = hashPassword(password);
  const isValid = user.passwordHash === inputHash || user.passwordHash === password;

  if (!isValid) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  user.lastLogin = new Date().toISOString();
  writeDB(db);

  res.json({
    success: true,
    user: sanitizeUser(user),
    token: `auth-token-${user.id}-${Date.now()}`,
  });
});

// POST Register new user (from Login screen or Admin)
app.post('/api/auth/register', (req, res) => {
  const { name, username, email, password, role, department } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Nome completo, nome de usuário e senha são obrigatórios.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 4 caracteres.' });
  }

  const db = readDB();
  const cleanUsername = username.trim().toLowerCase();

  const userExists = db.users.some(
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      (email && u.email && u.email.toLowerCase() === email.trim().toLowerCase())
  );

  if (userExists) {
    return res.status(409).json({ error: 'Este nome de usuário ou e-mail já está cadastrado.' });
  }

  const assignedRole: UserRole = (role as UserRole) || 'ALMOXARIFE';
  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-600',
    ALMOXARIFE: 'bg-emerald-600',
    PCM_ENG: 'bg-blue-600',
    MECANICO: 'bg-amber-600',
    CONSULTA: 'bg-slate-600',
  };

  const newUser: UserRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    username: cleanUsername,
    email: email?.trim() || undefined,
    role: assignedRole,
    passwordHash: hashPassword(password),
    active: true,
    department: department?.trim() || 'Almoxarifado & Manutenção',
    avatarColor: roleColors[assignedRole] || 'bg-slate-600',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({
    success: true,
    user: sanitizeUser(newUser),
    token: `auth-token-${newUser.id}-${Date.now()}`,
  });
});

// GET list all users
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json({
    users: db.users.map(sanitizeUser),
  });
});

// POST Admin create user
app.post('/api/users', (req, res) => {
  const { name, username, email, password, role, department, active } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Nome, usuário e senha são obrigatórios.' });
  }

  const db = readDB();
  const cleanUsername = username.trim().toLowerCase();

  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ error: 'Nome de usuário já existe.' });
  }

  const assignedRole: UserRole = (role as UserRole) || 'ALMOXARIFE';
  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-600',
    ALMOXARIFE: 'bg-emerald-600',
    PCM_ENG: 'bg-blue-600',
    MECANICO: 'bg-amber-600',
    CONSULTA: 'bg-slate-600',
  };

  const newUser: UserRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    username: cleanUsername,
    email: email?.trim() || undefined,
    role: assignedRole,
    passwordHash: hashPassword(password),
    active: active !== undefined ? Boolean(active) : true,
    department: department?.trim() || 'Manutenção',
    avatarColor: roleColors[assignedRole] || 'bg-slate-600',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ success: true, user: sanitizeUser(newUser) });
});

// PUT update user
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, username, email, password, role, department, active } = req.body;

  const db = readDB();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
    const cleanUsername = username.trim().toLowerCase();
    if (db.users.some((u) => u.id !== id && u.username.toLowerCase() === cleanUsername)) {
      return res.status(409).json({ error: 'Nome de usuário já está em uso.' });
    }
    user.username = cleanUsername;
  }

  if (name) user.name = name.trim();
  if (email !== undefined) user.email = email.trim() || undefined;
  if (department !== undefined) user.department = department.trim();
  if (role) {
    user.role = role;
    const roleColors: Record<UserRole, string> = {
      ADMIN: 'bg-purple-600',
      ALMOXARIFE: 'bg-emerald-600',
      PCM_ENG: 'bg-blue-600',
      MECANICO: 'bg-amber-600',
      CONSULTA: 'bg-slate-600',
    };
    user.avatarColor = roleColors[role as UserRole] || user.avatarColor;
  }
  if (active !== undefined) user.active = Boolean(active);
  if (password && String(password).trim().length >= 4) {
    user.passwordHash = hashPassword(password.trim());
  }

  writeDB(db);
  res.json({ success: true, user: sanitizeUser(user) });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Prevent deleting if it is the only admin
  if (db.users[index].role === 'ADMIN') {
    const adminCount = db.users.filter((u) => u.role === 'ADMIN' && u.active).length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o único administrador ativo do sistema.' });
    }
  }

  db.users.splice(index, 1);
  writeDB(db);

  res.json({ success: true });
});

// GET complete inventory state
app.get('/api/inventory', (req, res) => {
  const db = readDB();
  res.json({
    products: db.products,
    movements: db.movements,
    workOrders: db.workOrders || [],
    users: db.users.map(sanitizeUser),
  });
});

// POST Create new product
app.post('/api/products', (req, res) => {
  const {
    code,
    barcode,
    name,
    description,
    imageUrl,
    category,
    unit,
    initialStock,
    minStock,
    maxStock,
    costPrice,
    sellingPrice,
    supplier,
    location,
    equipmentTag,
    criticality,
    responsible,
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Nome e Categoria são obrigatórios.' });
  }

  const db = readDB();
  const now = new Date().toISOString();
  const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const finalCode = code?.trim() || `MNT-${String(db.products.length + 1).padStart(3, '0')}`;
  const initialQty = Number(initialStock) || 0;
  const cost = Number(costPrice) || 0;
  const sell = Number(sellingPrice) || cost;
  const min = Number(minStock) || 0;

  const newProduct = {
    id,
    code: finalCode,
    barcode: barcode?.trim() || undefined,
    name: name.trim(),
    description: description?.trim() || '',
    imageUrl: imageUrl?.trim() || undefined,
    category: category.trim(),
    unit: (unit || 'UN').toUpperCase(),
    currentStock: initialQty,
    minStock: min,
    maxStock: maxStock ? Number(maxStock) : undefined,
    costPrice: cost,
    sellingPrice: sell,
    supplier: supplier?.trim() || '',
    location: location?.trim() || '',
    equipmentTag: equipmentTag?.trim() || '',
    criticality: (criticality as 'HIGH' | 'MEDIUM' | 'LOW') || 'LOW',
    createdAt: now,
    updatedAt: now,
  };

  db.products.unshift(newProduct);

  // If initial stock was given > 0, log an initial IN movement
  if (initialQty > 0) {
    const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    db.movements.unshift({
      id: movementId,
      productId: id,
      productCode: finalCode,
      productName: newProduct.name,
      type: 'IN',
      quantity: initialQty,
      previousStock: 0,
      newStock: initialQty,
      unitPrice: cost,
      totalPrice: initialQty * cost,
      reason: 'Cadastro Inicial de Sobressalente',
      documentNumber: 'CADASTRO-INICIAL',
      contactName: supplier?.trim() || 'Estoque Inicial de Manutenção',
      responsible: responsible || 'Almoxarife / PCM',
      notes: 'Entrada automática gerada no cadastro do item de manutenção',
      timestamp: now,
    });
  }

  writeDB(db);
  res.status(201).json({ product: newProduct, movements: db.movements });
});

// PUT Update existing product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const existing = db.products[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id, // cannot change id
    currentStock: existing.currentStock, // stock changes must go through movements
    updatedAt: new Date().toISOString(),
  };

  // Convert numbers
  if (req.body.costPrice !== undefined) updated.costPrice = Number(req.body.costPrice);
  if (req.body.sellingPrice !== undefined) updated.sellingPrice = Number(req.body.sellingPrice);
  if (req.body.minStock !== undefined) updated.minStock = Number(req.body.minStock);
  if (req.body.maxStock !== undefined) updated.maxStock = Number(req.body.maxStock);

  db.products[index] = updated;
  writeDB(db);
  res.json({ product: updated });
});

// DELETE Product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const deleted = db.products.splice(index, 1)[0];
  writeDB(db);
  res.json({ success: true, deletedProduct: deleted });
});

// POST Register Movement (Stock IN or Stock OUT or Adjust)
app.post('/api/movements', (req, res) => {
  const {
    productId,
    type, // 'IN' | 'OUT' | 'ADJUST'
    quantity,
    unitPrice,
    reason,
    documentNumber,
    contactName,
    responsible,
    notes,
    timestamp,
  } = req.body;

  const qty = Number(quantity);
  if (!productId || !type || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Produto, tipo e quantidade positiva são obrigatórios.' });
  }

  const db = readDB();
  const product = db.products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado para movimentação.' });
  }

  const prevStock = product.currentStock;
  let newStock = prevStock;

  if (type === 'IN') {
    newStock = prevStock + qty;
  } else if (type === 'OUT') {
    if (prevStock < qty) {
      // We allow warning or negative if intended, but let's prevent accidental overdraft
      // Or calculate newStock and let user know
    }
    newStock = Math.max(0, prevStock - qty);
  } else if (type === 'ADJUST') {
    newStock = qty; // For direct balance adjustment
  }

  const price = Number(unitPrice) || (type === 'IN' ? product.costPrice : product.sellingPrice);
  const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = timestamp || new Date().toISOString();

  const movement = {
    id: movementId,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    type: type as 'IN' | 'OUT' | 'ADJUST',
    quantity: type === 'ADJUST' ? Math.abs(newStock - prevStock) : qty,
    previousStock: prevStock,
    newStock: newStock,
    unitPrice: price,
    totalPrice: (type === 'ADJUST' ? Math.abs(newStock - prevStock) : qty) * price,
    reason: reason || (type === 'IN' ? 'Entrada Diversa' : 'Saída Diversa'),
    documentNumber: documentNumber?.trim() || undefined,
    contactName: contactName?.trim() || undefined,
    responsible: responsible?.trim() || 'Usuário Atual',
    notes: notes?.trim() || undefined,
    timestamp: now,
  };

  // Update product stock and timestamp
  product.currentStock = newStock;
  product.updatedAt = now;

  // If IN and new cost provided, optionally update cost price
  if (type === 'IN' && Number(unitPrice) > 0) {
    product.costPrice = Number(unitPrice);
  }

  db.movements.unshift(movement);
  writeDB(db);

  res.status(201).json({
    movement,
    product,
    products: db.products,
    movements: db.movements,
  });
});

// DELETE Movement (undo movement and revert stock)
app.delete('/api/movements/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.movements.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Movimentação não encontrada.' });
  }

  const movement = db.movements[index];
  const product = db.products.find((p) => p.id === movement.productId);

  if (product) {
    // Revert stock
    if (movement.type === 'IN') {
      product.currentStock = Math.max(0, product.currentStock - movement.quantity);
    } else if (movement.type === 'OUT') {
      product.currentStock = product.currentStock + movement.quantity;
    }
    product.updatedAt = new Date().toISOString();
  }

  db.movements.splice(index, 1);
  writeDB(db);

  res.json({
    success: true,
    deletedMovement: movement,
    product,
    products: db.products,
    movements: db.movements,
  });
});

// POST Reconcile / Batch physical inventory audit
app.post('/api/inventory/reconcile', (req, res) => {
  const { audits, responsible } = req.body; // Array of { productId, countedStock, notes }
  if (!Array.isArray(audits) || audits.length === 0) {
    return res.status(400).json({ error: 'Lista de contagem é necessária.' });
  }

  const db = readDB();
  const now = new Date().toISOString();
  const recordedMovements = [];

  for (const item of audits) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;

    const counted = Number(item.countedStock);
    if (isNaN(counted) || counted < 0) continue;

    const diff = counted - product.currentStock;
    if (diff === 0) continue; // No change

    const type = diff > 0 ? 'IN' : 'OUT';
    const absQty = Math.abs(diff);

    const mov = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      type: 'ADJUST' as const,
      quantity: absQty,
      previousStock: product.currentStock,
      newStock: counted,
      unitPrice: product.costPrice,
      totalPrice: absQty * product.costPrice,
      reason: diff > 0 ? 'Ajuste de Balanço / Sobra (+)' : 'Ajuste de Balanço / Perda (-)',
      documentNumber: 'BALANCO-AUDIT',
      contactName: 'Contagem Física de Inventário',
      responsible: responsible || 'Auditor de Estoque',
      notes: item.notes || `Ajuste automático de balanço. Diferença: ${diff > 0 ? '+' : ''}${diff} ${product.unit}`,
      timestamp: now,
    };

    product.currentStock = counted;
    product.updatedAt = now;
    db.movements.unshift(mov);
    recordedMovements.push(mov);
  }

  writeDB(db);
  res.json({
    success: true,
    adjustedCount: recordedMovements.length,
    products: db.products,
    movements: db.movements,
  });
});

// ==========================================
// WORK ORDERS (ORDENS DE SERVIÇO) ROUTES
// ==========================================

// GET all work orders
app.get('/api/work-orders', (req, res) => {
  const db = readDB();
  res.json({
    workOrders: db.workOrders || [],
  });
});

// POST Generate Next OS Number Preview
app.get('/api/work-orders/next-number', (req, res) => {
  const db = readDB();
  const year = new Date().getFullYear();
  const existingCount = (db.workOrders?.length || 0) + 1;
  const nextNumber = `OS-${year}-${String(existingCount).padStart(4, '0')}`;
  res.json({ nextNumber });
});

// POST Create Work Order (with multi-item stock decrement and movement logging)
app.post('/api/work-orders', (req, res) => {
  const {
    osNumber: requestedOsNumber,
    date,
    serviceType,
    application,
    equipmentTag,
    requesterName,
    requesterRole,
    authorizedBy,
    warehouseKeeper,
    sector,
    priority,
    items, // array of { productId, quantity, unitPrice? }
    notes,
  } = req.body;

  if (!requesterName || !authorizedBy || !application) {
    return res.status(400).json({ error: 'Funcionário solicitante, autorizador e aplicação são campos obrigatórios.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Selecione ao menos um material/peça para a Ordem de Serviço.' });
  }

  const db = readDB();
  const now = date || new Date().toISOString();
  
  // Calculate next sequential OS number if not provided
  let osNumber = requestedOsNumber?.trim();
  if (!osNumber) {
    const year = new Date().getFullYear();
    const count = (db.workOrders?.length || 0) + 1;
    osNumber = `OS-${year}-${String(count).padStart(4, '0')}`;
  }

  // Check if OS number already exists
  if (db.workOrders?.some((w) => w.osNumber === osNumber)) {
    // Generate unique suffix if duplicate
    osNumber = `${osNumber}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
  }

  const processedItems = [];
  let totalCost = 0;
  let totalQuantity = 0;
  const newMovements = [];

  for (const itemReq of items) {
    const product = db.products.find((p) => p.id === itemReq.productId || p.code === itemReq.productCode);
    if (!product) {
      return res.status(404).json({ error: `Material não encontrado no estoque: ${itemReq.productName || itemReq.productId}` });
    }

    const qty = Number(itemReq.quantity) || 1;
    if (qty <= 0) continue;

    const prevStock = product.currentStock;
    const newStock = Math.max(0, prevStock - qty);
    const unitPrice = Number(itemReq.unitPrice) || product.costPrice || product.sellingPrice || 0;
    const itemTotal = qty * unitPrice;

    totalCost += itemTotal;
    totalQuantity += qty;

    // Deduct stock
    product.currentStock = newStock;
    product.updatedAt = now;

    // Create OUT movement linked to OS
    const movId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const movRecord = {
      id: movId,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      type: 'OUT' as const,
      quantity: qty,
      previousStock: prevStock,
      newStock: newStock,
      unitPrice: unitPrice,
      totalPrice: itemTotal,
      reason: `Aplicação em O.S. ${serviceType || 'Industrial'}`,
      documentNumber: osNumber,
      contactName: `TAG: ${equipmentTag || 'Manutenção Geral'} | Solicitante: ${requesterName} (Aut: ${authorizedBy})`,
      responsible: requesterName,
      notes: `O.S. ${osNumber} - Aplicação: ${application}. Autorizado por: ${authorizedBy}. ${notes ? `Obs: ${notes}` : ''}`,
      timestamp: now,
    };

    db.movements.unshift(movRecord);
    newMovements.push(movRecord);

    processedItems.push({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      quantity: qty,
      unit: product.unit || 'UN',
      unitPrice: unitPrice,
      totalPrice: itemTotal,
      currentStock: newStock,
    });
  }

  const workOrder = {
    id: `os-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    osNumber,
    date: now,
    serviceType: serviceType || 'CORRETIVA',
    application: application.trim(),
    equipmentTag: equipmentTag?.trim() || undefined,
    requesterName: requesterName.trim(),
    requesterRole: requesterRole?.trim() || 'Mecânico / Técnico',
    authorizedBy: authorizedBy.trim(),
    warehouseKeeper: warehouseKeeper?.trim() || 'Almoxarifado Central',
    sector: sector?.trim() || 'Oficina Mecânica',
    priority: priority || 'ALTA',
    items: processedItems,
    totalCost,
    totalQuantity,
    status: 'CONCLUIDA',
    notes: notes?.trim() || undefined,
    createdAt: now,
  };

  if (!db.workOrders) db.workOrders = [];
  db.workOrders.unshift(workOrder);
  writeDB(db);

  res.status(201).json({
    success: true,
    workOrder,
    products: db.products,
    movements: db.movements,
    workOrders: db.workOrders,
  });
});

// DELETE / Cancel Work Order (optional stock revert)
app.delete('/api/work-orders/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.workOrders || []).findIndex((w) => w.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
  }

  const removed = db.workOrders.splice(index, 1)[0];
  writeDB(db);

  res.json({ success: true, removedWorkOrder: removed });
});

// Reset to initial sample data
app.post('/api/inventory/reset-sample', (req, res) => {
  writeDB(initialSeedData);
  res.json({
    success: true,
    products: initialSeedData.products,
    movements: initialSeedData.movements,
    users: initialSeedData.users.map(sanitizeUser),
  });
});

// Full Backup Export / Import
app.get('/api/backup', (req, res) => {
  const db = readDB();
  res.json({
    products: db.products,
    movements: db.movements,
    workOrders: db.workOrders || [],
    users: db.users.map(sanitizeUser),
  });
});

app.post('/api/backup', (req, res) => {
  const { products, movements, workOrders, users } = req.body;
  if (!Array.isArray(products) || !Array.isArray(movements)) {
    return res.status(400).json({ error: 'Formato de backup inválido.' });
  }

  const existingDB = readDB();
  const cleanDB: DBStructure = {
    products,
    movements,
    workOrders: Array.isArray(workOrders) ? workOrders : existingDB.workOrders || [],
    users: Array.isArray(users) && users.length > 0 ? users : existingDB.users,
  };

  writeDB(cleanDB);
  res.json({ success: true, countProducts: products.length, countMovements: movements.length, countWorkOrders: cleanDB.workOrders.length, countUsers: cleanDB.users.length });
});

// Vite & Static server setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Inventory server running on http://localhost:${PORT}`);
  });
}

startServer();
