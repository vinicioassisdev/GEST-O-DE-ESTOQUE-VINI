import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  Camera,
  Search,
  Package,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Tag,
  Wrench,
} from 'lucide-react';
import { Product, MovementType, EntryReason, ExitReason, WorkOrder } from '../types';
import { formatCurrency, getStockStatus } from '../lib/utils';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movementData: any) => Promise<void>;
  products: Product[];
  workOrders?: WorkOrder[];
  initialType?: MovementType;
  preselectedProduct?: Product | null;
  currentUser?: { name: string } | null;
}

const ENTRY_REASONS: EntryReason[] = [
  'Compra / Reposição de Sobressalentes',
  'Devolução de Sobra de O.S.',
  'Entrada por Fabricação Interna / Usinagem',
  'Retorno de Recuperação / Recondicionamento',
  'Ajuste de Inventário (+)',
  'Transferência entre Almoxarifados',
  'Outros',
];

const EXIT_REASONS: ExitReason[] = [
  'Aplicação em O.S. Preventiva',
  'Aplicação em O.S. Corretiva (Urgente)',
  'Aplicação em O.S. Preditiva',
  'Aplicação em Reforma / Melhoria / Capex',
  'Uso e Consumo em Oficina',
  'Envio para Recondicionamento Externo',
  'Descarte / Sucata / Danificado',
  'Ajuste de Inventário (-)',
  'Outros',
];

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products,
  workOrders = [],
  initialType = 'IN',
  preselectedProduct = null,
  currentUser = null,
}) => {
  const [type, setType] = useState<MovementType>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');
  const [osSearchTerm, setOsSearchTerm] = useState('');
  const [showOsSelector, setShowOsSelector] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [reason, setReason] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [responsible, setResponsible] = useState(currentUser?.name || 'Almoxarife / Técnico');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form on open
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setSelectedWorkOrderId('');
      setOsSearchTerm('');
      setShowOsSelector(false);
      setResponsible(currentUser?.name || 'Almoxarife / Técnico');
      const targetProd = preselectedProduct || (products.length > 0 ? products[0] : null);
      if (targetProd) {
        setSelectedProductId(targetProd.id);
        setUnitPrice(String(targetProd.costPrice || 0));
        if (initialType === 'IN') {
          setContactName(targetProd.supplier || '');
        } else {
          setContactName(targetProd.equipmentTag ? `TAG: ${targetProd.equipmentTag}` : '');
        }
      } else {
        setSelectedProductId('');
        setUnitPrice('');
        setContactName('');
      }
      setReason(
        initialType === 'IN'
          ? 'Compra / Reposição de Sobressalentes'
          : 'Aplicação em O.S. Preventiva'
      );
      setQuantity('1');
      setDocumentNumber('');
      setNotes('');
      setDate(new Date().toISOString().slice(0, 16));
      setErrorMsg(null);
      setProductSearch('');
    }
  }, [isOpen, initialType, preselectedProduct, products]);

  // When type changes, update default reason and price
  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    setReason(
      newType === 'IN'
        ? selectedWorkOrderId ? 'Devolução de Sobra de O.S.' : 'Compra / Reposição de Sobressalentes'
        : 'Aplicação em O.S. Preventiva'
    );
    const selectedProd = products.find((p) => p.id === selectedProductId);
    if (selectedProd) {
      setUnitPrice(String(selectedProd.costPrice || 0));
      if (newType === 'IN' && selectedProd.supplier && !selectedWorkOrderId) {
        setContactName(selectedProd.supplier);
      } else if (newType === 'OUT' && selectedProd.equipmentTag && !selectedWorkOrderId) {
        setContactName(`TAG: ${selectedProd.equipmentTag}`);
      }
    }
  };

  const handleProductSelect = (prod: Product) => {
    setSelectedProductId(prod.id);
    setUnitPrice(String(prod.costPrice || 0));
    if (type === 'IN' && prod.supplier && !selectedWorkOrderId) {
      setContactName(prod.supplier);
    } else if (type === 'OUT' && prod.equipmentTag && !selectedWorkOrderId) {
      setContactName(`TAG: ${prod.equipmentTag}`);
    }
  };

  // Handler for selecting a Work Order
  const handleSelectWorkOrder = (wo: WorkOrder | null) => {
    if (!wo) {
      setSelectedWorkOrderId('');
      return;
    }

    setSelectedWorkOrderId(wo.id);
    setDocumentNumber(wo.osNumber);
    setResponsible(wo.requesterName);
    setContactName(
      `Local: ${wo.operationalArea || 'Geral'}${wo.equipmentTag ? ` | TAG: ${wo.equipmentTag}` : ''}`
    );

    if (type === 'IN') {
      setReason('Devolução de Sobra de O.S.');
      setNotes(`Devolução de material referente à O.S. ${wo.osNumber} (${wo.application}).`);
    } else {
      setReason(`Aplicação em O.S. ${wo.serviceType || 'Industrial'}`);
      setNotes(`Baixa de material para a O.S. ${wo.osNumber} - ${wo.application}`);
    }

    // If the work order has items, select the first one if current product isn't in it
    if (wo.items && wo.items.length > 0) {
      const isAlreadyIn = wo.items.some((i) => i.productId === selectedProductId);
      if (!isAlreadyIn) {
        const firstItem = wo.items[0];
        const matchProd = products.find((p) => p.id === firstItem.productId || p.code === firstItem.productCode);
        if (matchProd) {
          handleProductSelect(matchProd);
        }
      }
    }
  };

  const selectedWorkOrder = workOrders.find((w) => w.id === selectedWorkOrderId);

  // Filtered work orders for search
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (!osSearchTerm) return true;
    const q = osSearchTerm.toLowerCase();
    return (
      wo.osNumber.toLowerCase().includes(q) ||
      wo.requesterName.toLowerCase().includes(q) ||
      wo.application.toLowerCase().includes(q) ||
      (wo.operationalArea && wo.operationalArea.toLowerCase().includes(q)) ||
      (wo.equipmentTag && wo.equipmentTag.toLowerCase().includes(q)) ||
      wo.items.some((it) => it.productName.toLowerCase().includes(q) || it.productCode.toLowerCase().includes(q))
    );
  });

  const handleBarcodeScan = (scannedCode: string) => {
    setIsScannerOpen(false);
    const found = products.find(
      (p) =>
        p.barcode === scannedCode ||
        p.code.toLowerCase() === scannedCode.toLowerCase()
    );
    if (found) {
      handleProductSelect(found);
    } else {
      setErrorMsg(
        `Nenhuma peça encontrada com o código "${scannedCode}". Cadastre o sobressalente primeiro.`
      );
    }
  };

  const currentProduct = products.find((p) => p.id === selectedProductId);

  // Calculations
  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(unitPrice) || 0;
  const totalValue = qty * price;
  const currentStock = currentProduct ? currentProduct.currentStock : 0;
  const resultingStock =
    type === 'IN' ? currentStock + qty : currentStock - qty;
  const isOverdraft = type === 'OUT' && resultingStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setErrorMsg('Selecione uma peça / sobressalente.');
      return;
    }
    if (qty <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSave({
        productId: selectedProductId,
        type,
        quantity: qty,
        unitPrice: price,
        reason,
        documentNumber: documentNumber.trim() || undefined,
        contactName: contactName.trim() || undefined,
        responsible: responsible.trim() || 'Almoxarife / Técnico',
        notes: notes.trim() || undefined,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.equipmentTag && p.equipmentTag.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        id="movement-modal-overlay"
        className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      >
        <div
          id="movement-modal-container"
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  type === 'IN'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                }`}
              >
                {type === 'IN' ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {type === 'IN'
                    ? 'Entrada no Almoxarifado'
                    : 'Baixa / Aplicação em O.S.'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {type === 'IN'
                    ? 'Recebimento de compra, reposição de estoque ou devolução de sobra'
                    : 'Baixa de peças para Ordens de Serviço, estações ou manutenções'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  id="tab-select-in-btn"
                  type="button"
                  onClick={() => handleTypeChange('IN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    type === 'IN'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Entrada
                </button>
                <button
                  id="tab-select-out-btn"
                  type="button"
                  onClick={() => handleTypeChange('OUT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    type === 'OUT'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Saída (O.S.)
                </button>
              </div>
              <button
                id="close-movement-modal-btn"
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Link with Existing Work Order (O.S.) */}
            {workOrders && workOrders.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {type === 'OUT'
                        ? '🔍 Vincular Baixa a uma O.S. Existente (Opcional)'
                        : '🔍 Devolução de Sobra de uma O.S. (Opcional)'}
                    </span>
                  </div>
                  {selectedWorkOrder ? (
                    <button
                      type="button"
                      onClick={() => handleSelectWorkOrder(null)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Desvincular O.S.
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowOsSelector(!showOsSelector)}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      {showOsSelector ? 'Ocultar Busca' : 'Pesquisar O.S.'}
                    </button>
                  )}
                </div>

                {/* OS Search and Select dropdown */}
                {showOsSelector && !selectedWorkOrder && (
                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar O.S. por número (ex: OS-2026-0001), solicitante, local ou material..."
                        value={osSearchTerm}
                        onChange={(e) => setOsSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
                      {filteredWorkOrders.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Nenhuma O.S. encontrada para "{osSearchTerm}".
                        </div>
                      ) : (
                        filteredWorkOrders.slice(0, 8).map((wo) => (
                          <div
                            key={wo.id}
                            onClick={() => {
                              handleSelectWorkOrder(wo);
                              setShowOsSelector(false);
                            }}
                            className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">{wo.osNumber}</span>
                                <span>• {wo.application}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{wo.operationalArea || 'Geral'}</span>
                                <span>• Solicitante: {wo.requesterName}</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                              {wo.items.length} itens
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Work Order Banner with fast item selector chips */}
                {selectedWorkOrder && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          {selectedWorkOrder.osNumber}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {selectedWorkOrder.application}
                        </span>
                        {selectedWorkOrder.operationalArea && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            {selectedWorkOrder.operationalArea}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Solicitante: <strong>{selectedWorkOrder.requesterName}</strong>
                      </span>
                    </div>

                    {/* Quick Pick Item Chips from this OS */}
                    {selectedWorkOrder.items && selectedWorkOrder.items.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/80">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Materiais desta O.S. (Clique para selecionar rapidamente):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedWorkOrder.items.map((it) => {
                            const isMatch = selectedProductId === it.productId;
                            return (
                              <button
                                key={it.productId}
                                type="button"
                                onClick={() => {
                                  const prod = products.find((p) => p.id === it.productId || p.code === it.productCode);
                                  if (prod) handleProductSelect(prod);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                  isMatch
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <Package className="w-3 h-3" />
                                <span>{it.productName.split('(')[0]}</span>
                                <span className="font-mono text-[10px] opacity-80">({it.quantity} {it.unit || 'UN'})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Product Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Peça / Sobressalente *
              </label>

              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="movement-product-search-input"
                    type="text"
                    placeholder="Buscar por nome, SKU, TAG operacional ou código de barras..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  id="movement-scan-barcode-btn"
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear com Câmera do Celular"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Bipar Câmera</span>
                </button>
              </div>

              {/* Select Dropdown */}
              <select
                id="movement-product-select"
                value={selectedProductId}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value);
                  if (prod) handleProductSelect(prod);
                }}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} {p.equipmentTag ? `(TAG: ${p.equipmentTag})` : ''} - Saldo: {p.currentStock} {p.unit}
                  </option>
                ))}
              </select>

              {/* Selected Product Card Summary */}
              {currentProduct && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {currentProduct.imageUrl ? (
                      <img
                        src={currentProduct.imageUrl}
                        alt={currentProduct.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm break-words whitespace-normal">
                        {currentProduct.name}
                      </div>
                      <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 whitespace-normal break-words">
                        <span className="font-mono">{currentProduct.code}</span>
                        <span>•</span>
                        <span>{currentProduct.category}</span>
                        {currentProduct.location && (
                          <>
                            <span>•</span>
                            <span>{currentProduct.location}</span>
                          </>
                        )}
                        {currentProduct.supplier && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 dark:text-slate-400 break-words">{currentProduct.supplier}</span>
                          </>
                        )}
                        {currentProduct.equipmentTag && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              TAG: {currentProduct.equipmentTag}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Saldo Atual:</span>{' '}
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {currentProduct.currentStock} {currentProduct.unit}
                      </span>
                    </div>
                    {(() => {
                      const status = getStockStatus(currentProduct);
                      return (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.bg} ${status.color} ${status.border}`}
                        >
                          {status.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity, Unit Price and Resulting Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade ({currentProduct?.unit || 'UN'}) *
                </label>
                <input
                  id="movement-quantity-input"
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custo Unitário (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    R$
                  </span>
                  <input
                    id="movement-unit-price-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custo Total Movimentado
                </label>
                <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Live Stock Projection Pill */}
            {currentProduct && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isOverdraft
                    ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>
                    Saldo: <strong>{currentStock}</strong> {type === 'IN' ? '+' : '-'} {qty} ={' '}
                    <strong>{resultingStock}</strong> {currentProduct.unit}
                  </span>
                </div>
                {isOverdraft && (
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    Atenção: A baixa excede o saldo físico no almoxarifado!
                  </span>
                )}
              </div>
            )}

            {/* Reason and Document */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Finalidade da Movimentação *
                </label>
                <select
                  id="movement-reason-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  {type === 'IN'
                    ? ENTRY_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))
                    : EXIT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'IN' ? 'Nº da Nota Fiscal / Pedido' : 'Nº da O.S. (Ordem de Serviço)'}
                </label>
                <input
                  id="movement-document-input"
                  type="text"
                  placeholder={type === 'IN' ? 'Ex: NF-10492 ou PED-SKF-89' : 'Ex: OS-2026-089 ou OS-PREV-12'}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'IN' ? 'Fornecedor / Fabricante' : 'TAG do Equipamento / Destino'}
                </label>
                <input
                  id="movement-contact-input"
                  type="text"
                  placeholder={
                    type === 'IN'
                      ? 'Ex: SKF Distribuidora Brasil'
                      : 'Ex: TAG: PRE-HY-02 ou Esteira 01'
                  }
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Técnico / Mecânico / Almoxarife
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="movement-responsible-input"
                    type="text"
                    placeholder="Ex: Mecânico André / Carlos"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data e Hora do Registro
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="movement-datetime-input"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observações Técnicas / Diagnóstico da O.S.
                </label>
                <textarea
                  id="movement-notes-input"
                  rows={2}
                  placeholder="Ex: Troca preventiva de rolamentos devido a vibração detectada na análise preditiva..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                id="cancel-movement-btn"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                id="confirm-movement-btn"
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 ${
                  type === 'IN'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting
                  ? 'Registrando...'
                  : type === 'IN'
                  ? 'Confirmar Entrada'
                  : 'Confirmar Baixa em O.S.'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </>
  );
};
