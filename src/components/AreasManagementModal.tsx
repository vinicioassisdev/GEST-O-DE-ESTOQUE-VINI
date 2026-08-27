import React, { useState } from 'react';
import {
  X,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  Building,
  Save,
  RotateCcw,
  Sparkles,
  Settings2,
  Tag,
  Hash,
  Palette,
  Check,
} from 'lucide-react';
import { OperationalArea, InstallationType, User } from '../types';

interface AreasManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: OperationalArea[];
  installationTypes: InstallationType[];
  currentUser: User | null;
  onAreasUpdated: (areas: OperationalArea[]) => void;
  onInstallationTypesUpdated: (types: InstallationType[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialTab?: 'areas' | 'types';
}

const COLOR_PRESETS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'Azul' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', label: 'Índigo' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', label: 'Esmeralda' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', label: 'Roxo' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', label: 'Âmbar' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', label: 'Ciano' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', label: 'Ardósia' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', label: 'Rosa' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', label: 'Laranja' },
};

const ICON_PRESETS = ['🏢', '⚙️', '📦', '🏭', '⚡', '🛠️', '💧', '🧪', '🚰', '🔧', '🚜', '🏗️', '🔬', '📍', '🚨', '🔌', '🚗', '🧰'];

export const AreasManagementModal: React.FC<AreasManagementModalProps> = ({
  isOpen,
  onClose,
  areas,
  installationTypes = [],
  currentUser,
  onAreasUpdated,
  onInstallationTypesUpdated,
  showToast,
  initialTab = 'areas',
}) => {
  const [activeTab, setActiveTab] = useState<'areas' | 'types'>(initialTab);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Areas Form State
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaType, setAreaType] = useState<string>('');
  const [areaCode, setAreaCode] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [isSubmittingArea, setIsSubmittingArea] = useState(false);
  const [areaError, setAreaError] = useState('');
  const [deleteAreaConfirmId, setDeleteAreaConfirmId] = useState<string | null>(null);

  // Installation Types Form State
  const [isEditingType, setIsEditingType] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeCodePrefix, setTypeCodePrefix] = useState('');
  const [typeIcon, setTypeIcon] = useState('📍');
  const [typeColor, setTypeColor] = useState('blue');
  const [typeDescription, setTypeDescription] = useState('');
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [typeError, setTypeError] = useState('');
  const [deleteTypeConfirmId, setDeleteTypeConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to get type details
  const getTypeInfo = (typeKeyOrId: string) => {
    const matched = installationTypes.find(
      (t) => t.id === typeKeyOrId || t.name.toLowerCase() === typeKeyOrId.toLowerCase() || t.id.replace('type-', '').toUpperCase() === typeKeyOrId.toUpperCase()
    );
    if (matched) {
      const colorConf = COLOR_PRESETS[matched.color || 'blue'] || COLOR_PRESETS.blue;
      return {
        label: matched.name,
        codePrefix: matched.codePrefix,
        icon: matched.icon || '📍',
        bg: colorConf.bg,
        text: colorConf.text,
        border: colorConf.border,
      };
    }
    return {
      label: typeKeyOrId || 'Outro Local',
      codePrefix: 'LOC',
      icon: '📍',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
    };
  };

  // Reset Area Form
  const resetAreaForm = () => {
    setIsEditingArea(false);
    setEditingAreaId(null);
    setAreaName('');
    setAreaType('');
    setAreaCode('');
    setAreaDescription('');
    setAreaError('');
  };

  // Start Edit Area
  const handleStartEditArea = (area: OperationalArea) => {
    setIsEditingArea(true);
    setEditingAreaId(area.id);
    setAreaName(area.name);
    setAreaType(area.type || '');
    setAreaCode(area.code || '');
    setAreaDescription(area.description || '');
    setAreaError('');
    setActiveTab('areas');
  };

  // Auto suggest Sigla/Código when type changes
  const handleSelectAreaType = (newTypeVal: string) => {
    setAreaType(newTypeVal);
    if (!areaCode && newTypeVal) {
      const matched = installationTypes.find((t) => t.id === newTypeVal || t.name === newTypeVal);
      if (matched && matched.codePrefix) {
        const existingWithPrefix = areas.filter(
          (a) => a.code && a.code.toUpperCase().startsWith(matched.codePrefix.toUpperCase())
        ).length;
        const nextNum = String(existingWithPrefix + 1).padStart(2, '0');
        setAreaCode(`${matched.codePrefix}-${nextNum}`);
      }
    }
  };

  // Save Area (POST or PUT)
  const handleSubmitArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      setAreaError('Informe o nome do local ou setor.');
      return;
    }

    setIsSubmittingArea(true);
    setAreaError('');

    try {
      if (isEditingArea && editingAreaId) {
        const res = await fetch(`/api/areas/${editingAreaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: areaName.trim().toUpperCase(),
            type: areaType || 'SETOR',
            code: areaCode.trim().toUpperCase() || undefined,
            description: areaDescription.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar local.');

        onAreasUpdated(data.areas);
        showToast(`Local "${areaName.trim().toUpperCase()}" atualizado com sucesso!`, 'success');
        resetAreaForm();
      } else {
        const res = await fetch('/api/areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: areaName.trim().toUpperCase(),
            type: areaType || 'SETOR',
            code: areaCode.trim().toUpperCase() || undefined,
            description: areaDescription.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar local.');

        onAreasUpdated(data.areas);
        showToast(`Local "${areaName.trim().toUpperCase()}" cadastrado com sucesso!`, 'success');
        resetAreaForm();
      }
    } catch (err: any) {
      setAreaError(err.message || 'Falha ao salvar dados do local.');
    } finally {
      setIsSubmittingArea(false);
    }
  };

  // Delete Area
  const handleDeleteArea = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover local.');

      onAreasUpdated(data.areas);
      showToast(`Local "${name}" excluído com sucesso.`, 'info');
      setDeleteAreaConfirmId(null);
      if (editingAreaId === id) resetAreaForm();
    } catch (err: any) {
      showToast(err.message || 'Falha ao excluir local.', 'error');
    }
  };

  // Reset Type Form
  const resetTypeForm = () => {
    setIsEditingType(false);
    setEditingTypeId(null);
    setTypeName('');
    setTypeCodePrefix('');
    setTypeIcon('📍');
    setTypeColor('blue');
    setTypeDescription('');
    setTypeError('');
  };

  // Start Edit Type
  const handleStartEditType = (typeItem: InstallationType) => {
    setIsEditingType(true);
    setEditingTypeId(typeItem.id);
    setTypeName(typeItem.name);
    setTypeCodePrefix(typeItem.codePrefix || '');
    setTypeIcon(typeItem.icon || '📍');
    setTypeColor(typeItem.color || 'blue');
    setTypeDescription(typeItem.description || '');
    setTypeError('');
  };

  // Save Installation Type (POST or PUT)
  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      setTypeError('Informe o nome do tipo de instalação.');
      return;
    }

    setIsSubmittingType(true);
    setTypeError('');

    try {
      if (isEditingType && editingTypeId) {
        const res = await fetch(`/api/installation-types/${editingTypeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: typeName.trim(),
            codePrefix: (typeCodePrefix.trim() || typeName.trim().slice(0, 3)).toUpperCase(),
            icon: typeIcon || '📍',
            color: typeColor || 'blue',
            description: typeDescription.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar tipo de instalação.');

        onInstallationTypesUpdated(data.installationTypes);
        showToast(`Tipo "${typeName.trim()}" atualizado com sucesso!`, 'success');
        resetTypeForm();
      } else {
        const res = await fetch('/api/installation-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: typeName.trim(),
            codePrefix: (typeCodePrefix.trim() || typeName.trim().slice(0, 3)).toUpperCase(),
            icon: typeIcon || '📍',
            color: typeColor || 'blue',
            description: typeDescription.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar tipo de instalação.');

        onInstallationTypesUpdated(data.installationTypes);
        showToast(`Tipo "${typeName.trim()}" cadastrado com sucesso!`, 'success');
        resetTypeForm();
      }
    } catch (err: any) {
      setTypeError(err.message || 'Falha ao salvar tipo de instalação.');
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Delete Installation Type
  const handleDeleteType = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/installation-types/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover tipo.');

      onInstallationTypesUpdated(data.installationTypes);
      showToast(`Tipo "${name}" excluído.`, 'info');
      setDeleteTypeConfirmId(null);
      if (editingTypeId === id) resetTypeForm();
    } catch (err: any) {
      showToast(err.message || 'Falha ao excluir tipo.', 'error');
    }
  };

  // Filtered areas
  const filteredAreas = areas.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.code && a.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedTypeFilter === 'ALL' || a.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div
      id="areas-management-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Cadastro e Manutenção de Instalações & Locais</span>
              </h2>
              <p className="text-xs text-slate-400">
                Gerencie setores, linhas de produção, galpões, tipos de instalação e siglas/códigos
              </p>
            </div>
          </div>

          <button
            id="close-areas-modal-button"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Guias) */}
        <div className="px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex gap-2 pt-2">
            <button
              id="tab-operational-areas"
              type="button"
              onClick={() => setActiveTab('areas')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 ${
                activeTab === 'areas'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>1. Locais & Áreas Cadastrados</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                {areas.length}
              </span>
            </button>

            <button
              id="tab-installation-types"
              type="button"
              onClick={() => setActiveTab('types')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 ${
                activeTab === 'types'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>2. Tipos de Instalação & Siglas (Manutenção)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                {installationTypes.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pb-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Todos os campos e siglas são 100% editáveis</span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {/* ========================================================================= */}
          {/* GUIA 1: LOCAIS E ÁREAS CADASTRADOS */}
          {/* ========================================================================= */}
          {activeTab === 'areas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form to Add/Edit Area */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                      {isEditingArea ? (
                        <>
                          <Edit2 className="w-4 h-4 text-amber-500" />
                          <span>Editar Local Operacional</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-emerald-500" />
                          <span>Novo Local / Setor / Linha</span>
                        </>
                      )}
                    </h3>

                    {isEditingArea && (
                      <button
                        type="button"
                        onClick={resetAreaForm}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Cancelar
                      </button>
                    )}
                  </div>

                  {areaError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{areaError}</span>
                    </div>
                  )}

                  <form id="area-maintenance-form" onSubmit={handleSubmitArea} className="space-y-4">
                    {/* Area Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Local / Setor / Unidade *
                      </label>
                      <input
                        id="area-name-input"
                        type="text"
                        required
                        value={areaName}
                        onChange={(e) => setAreaName(e.target.value)}
                        placeholder="Ex: Linha de Montagem 01, Galpão A, Oficina Mecânica"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 uppercase"
                      />
                    </div>

                    {/* Area Type & Sigla/Code Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Tipo de Instalação
                          </label>
                          <button
                            type="button"
                            onClick={() => setActiveTab('types')}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          >
                            <Settings2 className="w-3 h-3" /> Gerenciar
                          </button>
                        </div>
                        <select
                          id="area-type-select"
                          value={areaType}
                          onChange={(e) => handleSelectAreaType(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                        >
                          <option value="">Selecione o Tipo...</option>
                          {installationTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.icon || '📍'} {t.name} ({t.codePrefix})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Sigla / Código</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Editável</span>
                        </label>
                        <input
                          id="area-code-input"
                          type="text"
                          value={areaCode}
                          onChange={(e) => setAreaCode(e.target.value.toUpperCase())}
                          placeholder="Ex: LIN-01, GALP-A, OFI-01"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 uppercase"
                        />
                      </div>
                    </div>

                    {/* Area Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Descrição / Observações / TAGs Vinculadas (Opcional)
                      </label>
                      <textarea
                        id="area-description-input"
                        rows={2}
                        value={areaDescription}
                        onChange={(e) => setAreaDescription(e.target.value)}
                        placeholder="Ex: Responsável técnico, máquinas pertencentes a esta linha ou ponto físico"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        id="save-area-submit-button"
                        type="submit"
                        disabled={isSubmittingArea}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                          isEditingArea
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                        } disabled:opacity-50`}
                      >
                        {isSubmittingArea ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>{isEditingArea ? 'Salvar Alterações no Local' : 'Cadastrar Local Operacional'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Os locais cadastrados ficam disponíveis em Ordens de Serviço, Entradas e Saídas.</span>
                </div>
              </div>

              {/* Right Column: List of Areas with Search & Filters */}
              <div className="lg:col-span-7 flex flex-col">
                {/* Search & Filter Bar */}
                <div className="mb-4 flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="search-areas-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por local, sigla ou descrição..."
                      className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    id="filter-area-type-select"
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="ALL">Todos os Tipos ({areas.length})</option>
                    {installationTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* List Container */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredAreas.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                      <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum local encontrado</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Utilize o formulário ao lado para cadastrar seus setores, linhas de produção ou galpões.
                      </p>
                    </div>
                  ) : (
                    filteredAreas.map((area) => {
                      const typeInfo = getTypeInfo(area.type);
                      const isConfirmingDelete = deleteAreaConfirmId === area.id;

                      return (
                        <div
                          key={area.id}
                          className={`p-3.5 rounded-xl border transition-all bg-white dark:bg-slate-900 flex items-center justify-between gap-3 ${
                            editingAreaId === area.id
                              ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0 border border-slate-200 dark:border-slate-700">
                              {typeInfo.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {area.name}
                                </span>
                                {area.code && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {area.code}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeInfo.bg} ${typeInfo.text} ${typeInfo.border}`}
                                >
                                  {typeInfo.label}
                                </span>
                              </div>
                              {area.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {area.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-1 rounded-lg border border-red-200 dark:border-red-800">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteArea(area.id, area.name)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded shadow-xs"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteAreaConfirmId(null)}
                                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditArea(area)}
                                  title="Editar Local / Sigla"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteAreaConfirmId(area.id)}
                                  title="Excluir Local"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* GUIA 2: TIPOS DE INSTALAÇÃO & SIGLAS PADRÃO (MANUTENÇÃO) */}
          {/* ========================================================================= */}
          {activeTab === 'types' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form to Add/Edit Installation Type */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                      {isEditingType ? (
                        <>
                          <Edit2 className="w-4 h-4 text-indigo-500" />
                          <span>Editar Tipo de Instalação</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-indigo-500" />
                          <span>Novo Tipo de Instalação</span>
                        </>
                      )}
                    </h3>

                    {isEditingType && (
                      <button
                        type="button"
                        onClick={resetTypeForm}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Cancelar
                      </button>
                    )}
                  </div>

                  {typeError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{typeError}</span>
                    </div>
                  )}

                  <form id="type-maintenance-form" onSubmit={handleSubmitType} className="space-y-4">
                    {/* Type Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Tipo de Instalação *
                      </label>
                      <input
                        id="type-name-input"
                        type="text"
                        required
                        value={typeName}
                        onChange={(e) => setTypeName(e.target.value)}
                        placeholder="Ex: Caldeiraria, Sala Limpa, Linha de Envase"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Code Prefix / Sigla Padrão */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Sigla / Prefixo de Código Padrão</span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Ex: LIN, SET, CALD</span>
                      </label>
                      <input
                        id="type-code-prefix-input"
                        type="text"
                        value={typeCodePrefix}
                        onChange={(e) => setTypeCodePrefix(e.target.value.toUpperCase())}
                        placeholder="Ex: CALD, ENV, OFI"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 uppercase"
                      />
                    </div>

                    {/* Icon Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Ícone / Emoji Visual</span>
                        <span className="text-sm">{typeIcon}</span>
                      </label>
                      <div className="grid grid-cols-9 gap-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        {ICON_PRESETS.map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setTypeIcon(ic)}
                            className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition-all ${
                              typeIcon === ic
                                ? 'bg-indigo-600 text-white shadow-xs scale-110'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Preset Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Cor de Destaque
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(COLOR_PRESETS).map(([key, conf]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setTypeColor(key)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 ${conf.bg} ${conf.text} ${conf.border} ${
                              typeColor === key ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            {typeColor === key && <Check className="w-3 h-3" />}
                            <span>{conf.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Type Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Descrição / Finalidade (Opcional)
                      </label>
                      <input
                        id="type-description-input"
                        type="text"
                        value={typeDescription}
                        onChange={(e) => setTypeDescription(e.target.value)}
                        placeholder="Ex: Células produtivas de usinagem e tornearia"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        id="save-type-submit-button"
                        type="submit"
                        disabled={isSubmittingType}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20 disabled:opacity-50"
                      >
                        {isSubmittingType ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>{isEditingType ? 'Salvar Alterações no Tipo' : 'Cadastrar Tipo de Instalação'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Personalize as nomenclaturas conforme o padrão da sua indústria ou empresa.</span>
                </div>
              </div>

              {/* Right Column: List of Installation Types */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Tipos de Instalação Ativos ({installationTypes.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={resetTypeForm}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Novo Tipo
                  </button>
                </div>

                {/* List Container */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {installationTypes.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                      <Settings2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum tipo cadastrado</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Utilize o formulário para adicionar novos tipos de instalações industriais.
                      </p>
                    </div>
                  ) : (
                    installationTypes.map((t) => {
                      const colorConf = COLOR_PRESETS[t.color || 'blue'] || COLOR_PRESETS.blue;
                      const linkedAreasCount = areas.filter(
                        (a) => a.type === t.id || a.type === t.name || a.type.toUpperCase() === t.id.replace('type-', '').toUpperCase()
                      ).length;
                      const isConfirmingDelete = deleteTypeConfirmId === t.id;

                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-xl border transition-all bg-white dark:bg-slate-900 flex items-center justify-between gap-3 ${
                            editingTypeId === t.id
                              ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0 border border-slate-200 dark:border-slate-700">
                              {t.icon || '📍'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {t.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${colorConf.bg} ${colorConf.text} ${colorConf.border}`}
                                >
                                  Prefixo: {t.codePrefix || 'N/A'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {linkedAreasCount} {linkedAreasCount === 1 ? 'local' : 'locais'}
                                </span>
                              </div>
                              {t.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {t.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-1 rounded-lg border border-red-200 dark:border-red-800">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteType(t.id, t.name)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded shadow-xs"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTypeConfirmId(null)}
                                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditType(t)}
                                  title="Editar Tipo de Instalação"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTypeConfirmId(t.id)}
                                  title="Excluir Tipo"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
