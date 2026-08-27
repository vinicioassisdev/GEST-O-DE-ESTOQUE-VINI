import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  Calendar,
  User,
  Wrench,
  ChevronRight,
  Sparkles,
  Layers,
  Clock,
  Package,
  Cpu,
  DollarSign,
} from 'lucide-react';
import { WorkOrder, Product } from '../types';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { generateWorkOrderPDF } from '../lib/pdfGenerator';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  products: Product[];
  onOpenGenerator: () => void;
  canManage: boolean;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  onOpenGenerator,
  canManage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('ALL');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchSearch =
        wo.osNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.application.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.equipmentTag && wo.equipmentTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (wo.authorizedBy && wo.authorizedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        wo.items.some((it) => it.productName.toLowerCase().includes(searchTerm.toLowerCase()) || it.productCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = selectedServiceType === 'ALL' || wo.serviceType === selectedServiceType;
      return matchSearch && matchType;
    });
  }, [workOrders, searchTerm, selectedServiceType]);

  // Metrics
  const distinctRequesters = useMemo(() => {
    const setReq = new Set(workOrders.map((w) => w.requesterName.trim()).filter(Boolean));
    return setReq.size;
  }, [workOrders]);

  const totalPartsDeducted = useMemo(() => {
    return workOrders.reduce((acc, curr) => acc + (curr.totalQuantity || curr.items.reduce((s, i) => s + i.quantity, 0)), 0);
  }, [workOrders]);

  const totalCostApplied = useMemo(() => {
    return workOrders.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  }, [workOrders]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
              MRO & PCM
            </span>
            <span className="text-xs text-slate-400 font-medium">• Controle de Requisições & Custos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Ordens de Serviço & Requisições de Peças
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Geração de O.S., baixa simultânea no estoque, controle financeiro para o almoxarife/ADM e emissão de PDF para o chão de fábrica
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onOpenGenerator}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Nova Ordem de Serviço</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total de O.S. Emitidas</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {workOrders.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ordens registradas</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Peças Aplicadas</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalPartsDeducted} <span className="text-xs text-slate-400 font-normal">un</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Baixadas do estoque</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Custo em O.S. (Almoxarifado)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCostApplied)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Investimento aplicado em MRO</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Solicitantes / Executores</span>
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {distinctRequesters} <span className="text-xs text-slate-400 font-normal">mecânicos</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Equipe de manutenção</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative grow">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nº da O.S., Heliel, Bomba B-03, Rolamento, Retentor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">Todos os Tipos de Manutenção</option>
            <option value="CORRETIVA">Corretiva</option>
            <option value="PREVENTIVA">Preventiva</option>
            <option value="PREDITIVA">Preditiva</option>
            <option value="EMERGENCIAL">Emergencial</option>
            <option value="REFORMA">Reforma / Melhoria</option>
          </select>
        </div>
      </div>

      {/* Work Orders List / Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Nenhuma Ordem de Serviço encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Gere a primeira O.S. para requisitar materiais com baixa automática no estoque e geração de PDF.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={onOpenGenerator}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Nova O.S.</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredOrders.map((wo) => (
            <div
              key={wo.id}
              onClick={() => setSelectedWorkOrder(wo)}
              className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {wo.osNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {wo.serviceType}
                      </span>
                      {wo.priority === 'URGENTE' || wo.priority === 'ALTA' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {wo.priority}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(wo.date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-sm font-mono text-slate-900 dark:text-white">
                      {formatCurrency(wo.totalCost)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono border border-emerald-200 dark:border-emerald-800">
                      {wo.totalQuantity || wo.items.reduce((s, i) => s + i.quantity, 0)} un baixadas
                    </span>
                  </div>
                </div>

                {/* Application & TAG */}
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {wo.equipmentTag && <span className="text-blue-600 font-mono mr-1">[{wo.equipmentTag}]</span>}
                    {wo.application}
                  </div>
                  {wo.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">
                      "{wo.notes}"
                    </p>
                  )}
                </div>

                {/* People Involved */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Solicitante:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-600" />
                      {wo.requesterName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Autorizado Por:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {wo.authorizedBy}
                    </span>
                  </div>
                </div>

                {/* Material Pill summary */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-between">
                    <span>Materiais Requisitados ({wo.items.length} itens):</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{wo.totalQuantity} un no total</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {wo.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-600"
                      >
                        {it.quantity}x {it.productName.split('(')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateWorkOrderPDF(wo, true, false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar O.S. (Via Campo)</span>
                </button>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-600 transition-colors font-semibold text-[11px]">
                  <span>Ver Detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Ordem de Serviço</span>
                    <span className="font-mono text-emerald-400">{selectedWorkOrder.osNumber}</span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Emitida em {formatDateTime(selectedWorkOrder.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateWorkOrderPDF(selectedWorkOrder, true, false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  title="Baixar via padrão da Ordem de Serviço sem valores"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar O.S. (Sem Valores)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const doc = generateWorkOrderPDF(selectedWorkOrder, false);
                    doc.autoPrint();
                    window.open(doc.output('bloburl'), '_blank');
                  }}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Imprimir"
                >
                  <Printer className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setSelectedWorkOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 text-xs">
              {/* Info Grid */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Solicitante</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedWorkOrder.requesterName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Autorizado Por</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedWorkOrder.authorizedBy}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">TAG / Equipamento</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedWorkOrder.equipmentTag || 'Geral'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo & Prioridade</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedWorkOrder.serviceType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Custo Total (ADM)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                    {formatCurrency(selectedWorkOrder.totalCost)}
                  </span>
                </div>
              </div>

              {/* Application */}
              <div>
                <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1">
                  Aplicação / Descrição do Destino:
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                  {selectedWorkOrder.application}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] uppercase font-bold text-slate-400">
                    Materiais Baixados do Estoque ({selectedWorkOrder.items.length} itens):
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                    Valores visíveis para Almoxarifado e ADM
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Material / Peça</th>
                        <th className="py-2.5 px-3 text-center">Unidade</th>
                        <th className="py-2.5 px-3 text-center">Qtd Baixada</th>
                        <th className="py-2.5 px-3 text-right">Custo Unit. (ADM)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal (ADM)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedWorkOrder.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold">{it.productCode}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                            {it.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                            {it.unit || 'UN'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {it.quantity} {it.unit || 'UN'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(it.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td colSpan={3} className="py-3 px-3">
                          Total Geral da Ordem de Serviço
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">
                          {selectedWorkOrder.totalQuantity || selectedWorkOrder.items.reduce((s, i) => s + i.quantity, 0)} un
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-right text-sm text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {formatCurrency(selectedWorkOrder.totalCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedWorkOrder.notes && (
                <div>
                  <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1">
                    Observações Técnicas:
                  </h4>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 italic">
                    "{selectedWorkOrder.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                A via de manutenção oculta os valores para uso da equipe técnica.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWorkOrder(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => generateWorkOrderPDF(selectedWorkOrder, true, true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-xs transition-all"
                  title="Via interna para Almoxarifado / Contabilidade com valores"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Via Almoxarifado (Com Custos)</span>
                </button>

                <button
                  type="button"
                  onClick={() => generateWorkOrderPDF(selectedWorkOrder, true, false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                  title="Via padrão para o mecânico (sem valores)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar O.S. (Via de Campo)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
