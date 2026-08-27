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

export interface InstallationTypeRecord {
  id: string;
  name: string;
  codePrefix: string;
  icon?: string;
  color?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OperationalAreaRecord {
  id: string;
  name: string;
  type: string; // References InstallationType ID or name
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
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
    operationalArea?: string;
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
    operationalArea?: string;
    responsible: string;
    notes?: string;
    timestamp: string;
  }>;
  users: Array<UserRecord>;
  areas: Array<OperationalAreaRecord>;
  installationTypes: Array<InstallationTypeRecord>;
  workOrders: Array<{
    id: string;
    osNumber: string;
    date: string;
    serviceType: string;
    application: string;
    equipmentTag?: string;
    operationalArea?: string;
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
      quantity: number; // Quantidade solicitada na Guia
      dischargedQuantity?: number; // Quantidade baixada no estoque
      returnedQuantity?: number; // Quantidade devolvida ao estoque (sobra)
      unit: string;
      unitPrice: number;
      totalPrice: number;
      currentStock: number;
    }>;
    totalCost: number;
    totalQuantity: number;
    status: string; // 'ABERTA' | 'PARCIAL' | 'CONCLUIDA' | 'CANCELADA'
    dischargedAt?: string;
    dischargedBy?: string;
    returns?: Array<{
      id: string;
      productId: string;
      productCode: string;
      productName: string;
      quantityReturned: number;
      returnedBy: string;
      reason?: string;
      timestamp: string;
    }>;
    notes?: string;
    createdAt: string;
  }>;
}

const defaultInstallationTypes: InstallationTypeRecord[] = [
  {
    id: 'type-setor',
    name: 'Setor / Departamento',
    codePrefix: 'SET',
    icon: '🏢',
    color: 'blue',
    description: 'Divisão administrativa, operacional ou de processos',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'type-linha',
    name: 'Linha de Produção / Máquina',
    codePrefix: 'LIN',
    icon: '⚙️',
    color: 'indigo',
    description: 'Linha contínua, esteira, conjunto de máquinas ou célula produtiva',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'type-galpao',
    name: 'Galpão / Armazém',
    codePrefix: 'GALP',
    icon: '📦',
    color: 'emerald',
    description: 'Armazém, depósito, pavilhão de estocagem ou almoxarifado',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'type-oficina',
    name: 'Oficina / Manutenção',
    codePrefix: 'OFI',
    icon: '🛠️',
    color: 'amber',
    description: 'Bancadas, usinagem, elétrica ou mecânica de apoio',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'type-unidade',
    name: 'Unidade / Filial / Fábrica',
    codePrefix: 'UND',
    icon: '🏭',
    color: 'purple',
    description: 'Unidade fabril, filial regional ou planta industrial',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'type-estacao',
    name: 'Estação / Usina / Instalação',
    codePrefix: 'EST',
    icon: '⚡',
    color: 'cyan',
    description: 'Subestação, casa de força, compressores ou utilidades',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'type-outros',
    name: 'Outro Local Operacional',
    codePrefix: 'LOC',
    icon: '📍',
    color: 'slate',
    description: 'Instalação diversa ou ponto operacional customizado',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const initialSeedData: DBStructure = {
  users: [
    {
      id: 'usr-admin',
      name: 'Administrador (Gestor)',
      username: 'admin',
      email: 'admin@empresa.com.br',
      role: 'ADMIN',
      passwordHash: hashPassword('admin123'),
      active: true,
      department: 'Administração Geral & Almoxarifado',
      avatarColor: 'bg-purple-600',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-consulta',
      name: 'Usuário Consulta (Somente Leitura)',
      username: 'consulta',
      email: 'consulta@empresa.com.br',
      role: 'CONSULTA',
      passwordHash: hashPassword('consulta123'),
      active: true,
      department: 'Consulta & Visualização',
      avatarColor: 'bg-slate-600',
      createdAt: new Date().toISOString(),
    },
  ],
  products: [],
  movements: [],
  workOrders: [],
  areas: [],
  installationTypes: defaultInstallationTypes,
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
    if (!data.products || !Array.isArray(data.products)) data.products = [];
    if (!data.movements || !Array.isArray(data.movements)) data.movements = [];
    if (!data.workOrders || !Array.isArray(data.workOrders)) data.workOrders = [];
    if (!data.areas || !Array.isArray(data.areas)) data.areas = [];
    if (!data.installationTypes || !Array.isArray(data.installationTypes) || data.installationTypes.length === 0) {
      data.installationTypes = defaultInstallationTypes;
    }
    if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
      data.users = initialSeedData.users;
    }
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
    areas: db.areas || [],
    installationTypes: db.installationTypes || defaultInstallationTypes,
    users: db.users.map(sanitizeUser),
  });
});

// ==========================================
// INSTALLATION TYPES (TIPOS DE INSTALAÇÃO & SIGLAS) ROUTES
// ==========================================

// GET all installation types
app.get('/api/installation-types', (req, res) => {
  const db = readDB();
  res.json({ installationTypes: db.installationTypes || defaultInstallationTypes });
});

// POST Create new installation type
app.post('/api/installation-types', (req, res) => {
  const { name, codePrefix, icon, color, description } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome do tipo de instalação é obrigatório (ex: Linha de Montagem, Caldeiraria).' });
  }

  const cleanName = String(name).trim();
  const db = readDB();
  if (!db.installationTypes) db.installationTypes = [...defaultInstallationTypes];

  if (db.installationTypes.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
    return res.status(409).json({ error: `Já existe um tipo de instalação com o nome "${cleanName}".` });
  }

  const now = new Date().toISOString();
  const cleanPrefix = (codePrefix?.trim() || cleanName.slice(0, 3)).toUpperCase();

  const newType: InstallationTypeRecord = {
    id: `type-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: cleanName,
    codePrefix: cleanPrefix,
    icon: icon?.trim() || '📍',
    color: color?.trim() || 'blue',
    description: description?.trim() || undefined,
    active: true,
    createdAt: now,
  };

  db.installationTypes.push(newType);
  writeDB(db);

  res.status(201).json({ success: true, installationType: newType, installationTypes: db.installationTypes });
});

// PUT Update installation type
app.put('/api/installation-types/:id', (req, res) => {
  const { id } = req.params;
  const { name, codePrefix, icon, color, description, active } = req.body;

  const db = readDB();
  if (!db.installationTypes) db.installationTypes = [...defaultInstallationTypes];
  const typeItem = db.installationTypes.find((t) => t.id === id);

  if (!typeItem) {
    return res.status(404).json({ error: 'Tipo de instalação não encontrado.' });
  }

  if (name && String(name).trim()) {
    const cleanName = String(name).trim();
    const duplicate = db.installationTypes.find((t) => t.id !== id && t.name.toLowerCase() === cleanName.toLowerCase());
    if (duplicate) {
      return res.status(409).json({ error: `Já existe outro tipo de instalação com o nome "${cleanName}".` });
    }
    typeItem.name = cleanName;
  }

  if (codePrefix !== undefined) {
    typeItem.codePrefix = String(codePrefix).trim().toUpperCase();
  }
  if (icon !== undefined) typeItem.icon = String(icon).trim() || '📍';
  if (color !== undefined) typeItem.color = String(color).trim() || 'blue';
  if (description !== undefined) typeItem.description = description?.trim() || undefined;
  if (active !== undefined) typeItem.active = Boolean(active);
  typeItem.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, installationType: typeItem, installationTypes: db.installationTypes });
});

// DELETE installation type
app.delete('/api/installation-types/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.installationTypes) db.installationTypes = [...defaultInstallationTypes];
  const index = db.installationTypes.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Tipo de instalação não encontrado.' });
  }

  const removed = db.installationTypes.splice(index, 1)[0];
  writeDB(db);

  res.json({ success: true, removed, installationTypes: db.installationTypes });
});

// ==========================================
// OPERATIONAL AREAS (LOCAIS & ESTRUTURA) ROUTES
// ==========================================

// GET all areas
app.get('/api/areas', (req, res) => {
  const db = readDB();
  res.json({ areas: db.areas || [] });
});

// POST Create new area
app.post('/api/areas', (req, res) => {
  const { name, type, code, description } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome do local/área é obrigatório (ex: Linha 01, Galpão A).' });
  }

  const db = readDB();
  if (!db.areas) db.areas = [];

  const cleanName = String(name).trim().toUpperCase();
  if (db.areas.some((a) => a.name.toUpperCase() === cleanName)) {
    return res.status(409).json({ error: `O local/área "${cleanName}" já está cadastrado.` });
  }

  const now = new Date().toISOString();

  const newArea: OperationalAreaRecord = {
    id: `area-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: cleanName,
    type: (type && String(type).trim()) ? String(type).trim() : 'SETOR',
    code: code?.trim()?.toUpperCase() || undefined,
    description: description?.trim() || undefined,
    active: true,
    createdAt: now,
  };

  db.areas.push(newArea);
  writeDB(db);

  res.status(201).json({ success: true, area: newArea, areas: db.areas });
});

// PUT Update area
app.put('/api/areas/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, code, description, active } = req.body;

  const db = readDB();
  if (!db.areas) db.areas = [];
  const area = db.areas.find((a) => a.id === id);

  if (!area) {
    return res.status(404).json({ error: 'Local/área não encontrado.' });
  }

  if (name && String(name).trim()) {
    const cleanName = String(name).trim().toUpperCase();
    const duplicate = db.areas.find((a) => a.id !== id && a.name.toUpperCase() === cleanName);
    if (duplicate) {
      return res.status(409).json({ error: `Já existe outro local/área com o nome "${cleanName}".` });
    }
    area.name = cleanName;
  }

  if (type !== undefined && String(type).trim()) {
    area.type = String(type).trim();
  }

  if (code !== undefined) area.code = code?.trim()?.toUpperCase() || undefined;
  if (description !== undefined) area.description = description?.trim() || undefined;
  if (active !== undefined) area.active = Boolean(active);
  area.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, area, areas: db.areas });
});

// DELETE area
app.delete('/api/areas/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.areas) db.areas = [];
  const index = db.areas.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Local/área não encontrado.' });
  }

  const removed = db.areas.splice(index, 1)[0];
  writeDB(db);

  res.json({ success: true, removed, areas: db.areas });
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

  // Link to Work Order if documentNumber matches an OS
  if (documentNumber && db.workOrders) {
    const matchedWO = db.workOrders.find(
      (w) => w.osNumber.toLowerCase() === documentNumber.trim().toLowerCase() || w.id === documentNumber.trim()
    );
    if (matchedWO) {
      const woItem = matchedWO.items.find((it) => it.productId === product.id || it.productCode === product.code);
      if (woItem && type === 'OUT') {
        woItem.dischargedQuantity = (woItem.dischargedQuantity || 0) + qty;
        const allDischarged = matchedWO.items.every((it) => (it.dischargedQuantity || 0) >= it.quantity);
        const someDischarged = matchedWO.items.some((it) => (it.dischargedQuantity || 0) > 0);
        matchedWO.status = allDischarged ? 'CONCLUIDA' : someDischarged ? 'PARCIAL' : 'ABERTA';
        matchedWO.dischargedAt = now;
        matchedWO.dischargedBy = responsible || matchedWO.requesterName;
      }
    }
  }

  writeDB(db);

  res.status(201).json({
    movement,
    product,
    products: db.products,
    movements: db.movements,
    workOrders: db.workOrders || [],
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

// POST Create Work Order (Liberação de Materiais & Emissão de Guia)
app.post('/api/work-orders', (req, res) => {
  const {
    osNumber: requestedOsNumber,
    date,
    serviceType,
    application,
    equipmentTag,
    operationalArea,
    requesterName,
    requesterRole,
    authorizedBy,
    warehouseKeeper,
    sector,
    priority,
    items, // array of { productId, quantity, unitPrice? }
    notes,
    autoDischarge = false, // false by default: apenas gera a O.S. e Guia (status ABERTA), sem debitar o estoque físico
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

    const unitPrice = Number(itemReq.unitPrice) || product.costPrice || product.sellingPrice || 0;
    const itemTotal = qty * unitPrice;

    totalCost += itemTotal;
    totalQuantity += qty;

    if (autoDischarge) {
      // Immediate discharge mode
      const prevStock = product.currentStock;
      const newStock = Math.max(0, prevStock - qty);
      product.currentStock = newStock;
      product.updatedAt = now;

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
        reason: `Aplicação em O.S. ${serviceType || 'Industrial'}${operationalArea ? ` (${operationalArea})` : ''}`,
        documentNumber: osNumber,
        contactName: `Local: ${operationalArea || 'Geral'} | TAG: ${equipmentTag || 'N/A'} | Solicitante: ${requesterName}`,
        operationalArea: operationalArea?.trim() || undefined,
        responsible: requesterName,
        notes: `O.S. ${osNumber} - Local: ${operationalArea || 'N/A'} - Aplicação: ${application}. Autorizado por: ${authorizedBy}. ${notes ? `Obs: ${notes}` : ''}`,
        timestamp: now,
      };

      db.movements.unshift(movRecord);
      newMovements.push(movRecord);
    }

    processedItems.push({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      quantity: qty,
      dischargedQuantity: autoDischarge ? qty : 0,
      returnedQuantity: 0,
      unit: product.unit || 'UN',
      unitPrice: unitPrice,
      totalPrice: itemTotal,
      currentStock: product.currentStock,
    });
  }

  const workOrder = {
    id: `os-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    osNumber,
    date: now,
    serviceType: serviceType || 'CORRETIVA',
    application: application.trim(),
    equipmentTag: equipmentTag?.trim() || undefined,
    operationalArea: operationalArea?.trim() || undefined,
    requesterName: requesterName.trim(),
    requesterRole: requesterRole?.trim() || 'Mecânico / Técnico',
    authorizedBy: authorizedBy.trim(),
    warehouseKeeper: warehouseKeeper?.trim() || 'Almoxarifado Central',
    sector: sector?.trim() || 'Oficina Mecânica',
    priority: priority || 'ALTA',
    items: processedItems,
    totalCost,
    totalQuantity,
    status: autoDischarge ? 'CONCLUIDA' : 'ABERTA',
    dischargedAt: autoDischarge ? now : undefined,
    dischargedBy: autoDischarge ? requesterName : undefined,
    notes: notes?.trim() || undefined,
    createdAt: now,
  };

  if (!db.workOrders) db.workOrders = [];
  db.workOrders.unshift(workOrder);
  writeDB(db);

  res.status(201).json({
    success: true,
    message: autoDischarge
      ? `O.S. ${osNumber} criada e baixada no estoque com sucesso!`
      : `O.S. ${osNumber} gerada com sucesso! Materiais liberados e Guia emitida (Aguardando Baixa física no almoxarifado).`,
    workOrder,
    products: db.products,
    movements: db.movements,
    workOrders: db.workOrders,
  });
});

// POST Discharge / Baixa de Materiais de uma O.S. aberta (Debita estoque físico e conclui a O.S.)
app.post('/api/work-orders/:id/discharge', (req, res) => {
  const { id } = req.params;
  const { itemsToDischarge, dischargedBy, notes } = req.body;

  const db = readDB();
  const workOrder = (db.workOrders || []).find((w) => w.id === id || w.osNumber === id);

  if (!workOrder) {
    return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
  }

  if (workOrder.status === 'CANCELADA') {
    return res.status(400).json({ error: 'Esta Ordem de Serviço foi cancelada e não pode receber baixa.' });
  }

  const now = new Date().toISOString();
  const responsiblePerson = dischargedBy?.trim() || workOrder.requesterName || 'Almoxarife / Técnico';
  let dischargedCount = 0;

  // If specific items were passed, discharge those; otherwise discharge all remaining items
  for (const item of workOrder.items) {
    const alreadyDischarged = item.dischargedQuantity || 0;
    const remainingToDischarge = Math.max(0, item.quantity - alreadyDischarged);

    if (remainingToDischarge <= 0) continue;

    let qtyToDischarge = remainingToDischarge;
    if (itemsToDischarge && Array.isArray(itemsToDischarge)) {
      const target = itemsToDischarge.find((it) => it.productId === item.productId || it.productCode === item.productCode);
      if (!target) continue;
      qtyToDischarge = Math.min(Number(target.quantity) || 0, remainingToDischarge);
    }

    if (qtyToDischarge <= 0) continue;

    const product = db.products.find((p) => p.id === item.productId || p.code === item.productCode);
    if (!product) continue;

    const prevStock = product.currentStock;
    const newStock = Math.max(0, prevStock - qtyToDischarge);
    const unitPrice = item.unitPrice || product.costPrice || 0;
    const itemTotal = qtyToDischarge * unitPrice;

    // Deduct physical stock
    product.currentStock = newStock;
    product.updatedAt = now;

    // Update work order item
    item.dischargedQuantity = alreadyDischarged + qtyToDischarge;
    dischargedCount++;

    // Create OUT movement record
    const movId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const movRecord = {
      id: movId,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      type: 'OUT' as const,
      quantity: qtyToDischarge,
      previousStock: prevStock,
      newStock: newStock,
      unitPrice: unitPrice,
      totalPrice: itemTotal,
      reason: `Aplicação em O.S. ${workOrder.serviceType || 'Industrial'}${workOrder.operationalArea ? ` (${workOrder.operationalArea})` : ''}`,
      documentNumber: workOrder.osNumber,
      contactName: `Local: ${workOrder.operationalArea || 'Geral'} | TAG: ${workOrder.equipmentTag || 'N/A'} | Solicitante: ${workOrder.requesterName}`,
      operationalArea: workOrder.operationalArea,
      responsible: responsiblePerson,
      notes: `Baixa física de material referente à O.S. ${workOrder.osNumber} - ${workOrder.application}. Baixado: ${qtyToDischarge} ${item.unit || 'UN'}. ${notes ? `Obs: ${notes}` : ''}`,
      timestamp: now,
    };

    db.movements.unshift(movRecord);
  }

  if (dischargedCount === 0) {
    return res.status(400).json({ error: 'Nenhum material pendente de baixa foi selecionado.' });
  }

  // Update Work Order Status
  const allFullyDischarged = workOrder.items.every((it) => (it.dischargedQuantity || 0) >= it.quantity);
  const someDischarged = workOrder.items.some((it) => (it.dischargedQuantity || 0) > 0);

  workOrder.status = allFullyDischarged ? 'CONCLUIDA' : someDischarged ? 'PARCIAL' : 'ABERTA';
  workOrder.dischargedAt = now;
  workOrder.dischargedBy = responsiblePerson;

  writeDB(db);

  res.json({
    success: true,
    message: allFullyDischarged
      ? `Baixa total da O.S. ${workOrder.osNumber} concluída com sucesso! Estoque debitado.`
      : `Baixa parcial da O.S. ${workOrder.osNumber} realizada com sucesso!`,
    workOrder,
    products: db.products,
    movements: db.movements,
    workOrders: db.workOrders,
  });
});

// POST Cancel Work Order
app.post('/api/work-orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const db = readDB();
  const workOrder = (db.workOrders || []).find((w) => w.id === id || w.osNumber === id);

  if (!workOrder) {
    return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
  }

  workOrder.status = 'CANCELADA';
  workOrder.notes = `${workOrder.notes ? workOrder.notes + ' | ' : ''}CANCELADA em ${new Date().toLocaleDateString('pt-BR')}${reason ? `: ${reason}` : ''}`;

  writeDB(db);

  res.json({
    success: true,
    message: `Ordem de Serviço ${workOrder.osNumber} cancelada.`,
    workOrder,
    products: db.products,
    movements: db.movements,
    workOrders: db.workOrders,
  });
});

// POST Return Unused Items from Work Order (Devolução de Sobra de O.S. ao Almoxarifado)
app.post('/api/work-orders/:id/return', (req, res) => {
  const { id } = req.params;
  const { productId, quantity, returnedBy, reason, notes } = req.body;

  const returnQty = Number(quantity);
  if (!productId || isNaN(returnQty) || returnQty <= 0) {
    return res.status(400).json({ error: 'Produto e quantidade válida para devolução são obrigatórios.' });
  }

  const db = readDB();
  const workOrder = (db.workOrders || []).find((w) => w.id === id || w.osNumber === id);

  if (!workOrder) {
    return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
  }

  const item = workOrder.items.find((it) => it.productId === productId || it.productCode === productId);
  if (!item) {
    return res.status(404).json({ error: 'Item não encontrado nesta Ordem de Serviço.' });
  }

  const previouslyReturned = item.returnedQuantity || 0;
  const maxReturnable = item.quantity - previouslyReturned;

  if (returnQty > maxReturnable) {
    return res.status(400).json({
      error: `A quantidade a devolver (${returnQty}) excede o saldo restante da O.S. (${maxReturnable} ${item.unit || 'UN'}).`,
    });
  }

  const product = db.products.find((p) => p.id === item.productId || p.code === item.productCode);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado no cadastro do almoxarifado.' });
  }

  const now = new Date().toISOString();
  const prevStock = product.currentStock;
  const newStock = prevStock + returnQty;
  const unitPrice = item.unitPrice || product.costPrice || 0;
  const itemTotalValue = returnQty * unitPrice;

  // 1. Restock physical product
  product.currentStock = newStock;
  product.updatedAt = now;

  // 2. Create IN movement record for the return
  const movId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const movRecord = {
    id: movId,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    type: 'IN' as const,
    quantity: returnQty,
    previousStock: prevStock,
    newStock: newStock,
    unitPrice: unitPrice,
    totalPrice: itemTotalValue,
    reason: 'Devolução de Sobra de O.S.',
    documentNumber: workOrder.osNumber,
    contactName: `Devolução O.S. ${workOrder.osNumber} | Local: ${workOrder.operationalArea || 'Geral'}`,
    operationalArea: workOrder.operationalArea,
    responsible: returnedBy?.trim() || workOrder.requesterName || 'Almoxarife / Técnico',
    notes: `Devolução de sobra de material não utilizado da O.S. ${workOrder.osNumber}. Requisitado: ${item.quantity} ${item.unit || 'UN'}, Devolvido nesta data: ${returnQty} ${item.unit || 'UN'}. Motivo: ${reason || 'Ajuste de consumo real'}. ${notes ? `Obs: ${notes}` : ''}`,
    timestamp: now,
  };

  db.movements.unshift(movRecord);

  // 3. Update Work Order item returned quantity and totals
  item.returnedQuantity = previouslyReturned + returnQty;

  const returnRecord = {
    id: `ret-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    quantityReturned: returnQty,
    returnedBy: returnedBy?.trim() || workOrder.requesterName,
    reason: reason || 'Sobra de material não utilizado',
    timestamp: now,
  };

  if (!workOrder.returns) workOrder.returns = [];
  workOrder.returns.unshift(returnRecord);

  // Recalculate totals for the Work Order
  workOrder.totalQuantity = workOrder.items.reduce(
    (acc, it) => acc + (it.quantity - (it.returnedQuantity || 0)),
    0
  );
  workOrder.totalCost = workOrder.items.reduce(
    (acc, it) => acc + (it.quantity - (it.returnedQuantity || 0)) * it.unitPrice,
    0
  );

  writeDB(db);

  res.json({
    success: true,
    message: `${returnQty} ${item.unit || 'UN'} de "${product.name}" devolvido(s) ao estoque com sucesso!`,
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

// Reset to factory zero (clean base)
app.post('/api/inventory/reset-sample', (req, res) => {
  const cleanDB: DBStructure = {
    users: initialSeedData.users,
    products: [],
    movements: [],
    workOrders: [],
    areas: [],
    installationTypes: defaultInstallationTypes,
  };
  writeDB(cleanDB);
  res.json({
    success: true,
    products: [],
    movements: [],
    workOrders: [],
    areas: [],
    installationTypes: defaultInstallationTypes,
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
    areas: db.areas || [],
    installationTypes: db.installationTypes || defaultInstallationTypes,
    users: db.users.map(sanitizeUser),
  });
});

app.post('/api/backup', (req, res) => {
  const { products, movements, workOrders, users, areas, installationTypes } = req.body;
  if (!Array.isArray(products) || !Array.isArray(movements)) {
    return res.status(400).json({ error: 'Formato de backup inválido.' });
  }

  const existingDB = readDB();
  const cleanDB: DBStructure = {
    products,
    movements,
    workOrders: Array.isArray(workOrders) ? workOrders : existingDB.workOrders || [],
    areas: Array.isArray(areas) ? areas : (existingDB.areas || initialSeedData.areas),
    installationTypes: Array.isArray(installationTypes) && installationTypes.length > 0 ? installationTypes : (existingDB.installationTypes || defaultInstallationTypes),
    users: Array.isArray(users) && users.length > 0 ? users : existingDB.users,
  };

  writeDB(cleanDB);
  res.json({
    success: true,
    countProducts: products.length,
    countMovements: movements.length,
    countWorkOrders: cleanDB.workOrders.length,
    countAreas: cleanDB.areas.length,
    countInstallationTypes: cleanDB.installationTypes.length,
    countUsers: cleanDB.users.length,
  });
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
