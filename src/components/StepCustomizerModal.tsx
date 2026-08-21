import React, { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Edit3, ArrowUp, ArrowDown, Settings, Check, X, Building2, ChevronRight, RotateCcw } from "lucide-react";
import { TrialTrackingItem, TrialStepDetail, Branch, Department } from "../types";
import { initialBranches, initialDepartments } from "../data";
import { abbreviateDepartmentName } from "./TrialTrackingHub";

interface StepCustomizerModalProps {
  item: TrialTrackingItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: TrialTrackingItem) => void;
  branches?: Branch[];
  departments?: Department[];
}

export const StepCustomizerModal: React.FC<StepCustomizerModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  branches,
  departments,
}) => {
  // Master list of branches & departments
  const availableBranches = useMemo(() => {
    return (branches && branches.length > 0) ? branches : initialBranches;
  }, [branches]);

  const availableDepartments = useMemo(() => {
    return (departments && departments.length > 0) ? departments : initialDepartments;
  }, [departments]);

  // Find branch matching a given branch name or id
  const findBranch = useCallback((branchNameOrId: string): Branch | undefined => {
    if (!branchNameOrId) return undefined;
    const clean = branchNameOrId.trim();
    return availableBranches.find(b => 
      b.name === clean || 
      b.id === clean || 
      clean.includes(b.id) ||
      b.name.toLowerCase().includes(clean.toLowerCase()) ||
      clean.toLowerCase().includes(b.name.toLowerCase())
    );
  }, [availableBranches]);

  // Primary branch of this trial item (Chi nhánh tạo bản tin)
  const homeBranch = useMemo(() => {
    return findBranch(item.factory) || availableBranches[0];
  }, [item.factory, findBranch, availableBranches]);

  // Helper to get departments belonging to a specific branch
  const getDepartmentsForBranch = useCallback((branchNameOrId: string): Department[] => {
    if (!branchNameOrId) return availableDepartments;
    const targetBranch = findBranch(branchNameOrId);
    if (targetBranch) {
      const matched = availableDepartments.filter(d => d.branchId === targetBranch.id);
      if (matched.length > 0) return matched;
    }

    const matchCode = (branchNameOrId || "").match(/\(([^)]+)\)/);
    const code = matchCode ? matchCode[1] : branchNameOrId;
    const fallbackMatched = availableDepartments.filter(d => 
      d.branchId.includes(code) || 
      d.name.includes(code)
    );

    return fallbackMatched.length > 0 ? fallbackMatched : availableDepartments;
  }, [findBranch, availableDepartments]);

  // Find which branch a role/department name belongs to (if any)
  const detectBranchForRole = useCallback((roleName: string): string => {
    if (!roleName) return homeBranch?.name || "";
    const clean = roleName.trim();
    const dept = availableDepartments.find(d => 
      d.name.toLowerCase() === clean.toLowerCase() || 
      (d.shortName && d.shortName.toLowerCase() === clean.toLowerCase())
    );
    if (dept) {
      const br = availableBranches.find(b => b.id === dept.branchId);
      if (br) return br.name;
    }
    // Check if role string contains branch code like (TPP-BNI), (TPP-LAN), (TPP-CTY)...
    const match = clean.match(/\(([^)]+)\)/);
    if (match) {
      const br = availableBranches.find(b => b.id === match[1] || b.name.includes(match[1]));
      if (br) return br.name;
    }
    return homeBranch?.name || availableBranches[0]?.name || "";
  }, [availableDepartments, availableBranches, homeBranch]);

  // Convert current steps to an ordered list
  const getOrderedSteps = (): TrialStepDetail[] => {
    if (item.customStepOrder && item.customStepOrder.length > 0) {
      return item.customStepOrder
        .map((k) => item.steps[k])
        .filter(Boolean);
    }
    const defaultKeys = ["step1_request", "step2_plan", "step3a_material", "step3b_mold", "step4_trial", "step5_evaluation"];
    const ordered: TrialStepDetail[] = [];
    defaultKeys.forEach((k) => {
      if (item.steps[k]) ordered.push(item.steps[k]);
    });
    // Any extra keys
    Object.keys(item.steps).forEach((k) => {
      if (!defaultKeys.includes(k) && item.steps[k]) {
        ordered.push(item.steps[k]);
      }
    });
    return ordered;
  };

  const [stepsList, setStepsList] = useState<TrialStepDetail[]>(getOrderedSteps);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // State mapping each step to its currently selected branch when in editing mode
  const [stepBranchMap, setStepBranchMap] = useState<Record<string, string>>({});
  const [customEditingRoles, setCustomEditingRoles] = useState<Record<string, boolean>>({});

  // New step inputs
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStepNumber, setNewStepNumber] = useState("");
  const [newStepName, setNewStepName] = useState("");
  const [newStepBranch, setNewStepBranch] = useState(() => homeBranch?.name || "");
  const [newStepRole, setNewStepRole] = useState(() => {
    const initDepts = getDepartmentsForBranch(homeBranch?.name || "");
    return initDepts[0]?.name || "Phòng Quản Lý Chất Lượng";
  });
  const [isCustomNewRole, setIsCustomNewRole] = useState(false);

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...stepsList];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setStepsList(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === stepsList.length - 1) return;
    const next = [...stepsList];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setStepsList(next);
  };

  const handleDeleteStep = (keyToDelete: string) => {
    if (stepsList.length <= 1) {
      alert("Tiến trình thử nghiệm cần ít nhất 1 bước.");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa bước này khỏi tiến trình thử nghiệm?")) {
      setStepsList(stepsList.filter((s) => s.key !== keyToDelete));
    }
  };

  const handleUpdateStepField = (key: string, field: keyof TrialStepDetail, value: any) => {
    setStepsList(
      stepsList.map((s) => (s.key === key ? { ...s, [field]: value } : s))
    );
  };

  const handleStartEditStep = (step: TrialStepDetail) => {
    setEditingKey(step.key);
    // Determine active branch for this step
    const currentBranch = stepBranchMap[step.key] || detectBranchForRole(step.roleResponsible) || homeBranch?.name || "";
    setStepBranchMap(prev => ({ ...prev, [step.key]: currentBranch }));
    
    // Check if role is custom
    const depts = getDepartmentsForBranch(currentBranch);
    const isStandard = depts.some(d => d.name === step.roleResponsible);
    if (!isStandard && step.roleResponsible) {
      // Check if it exists in any other branch
      const isKnownAnywhere = availableDepartments.some(d => d.name === step.roleResponsible);
      if (!isKnownAnywhere) {
        setCustomEditingRoles(prev => ({ ...prev, [step.key]: true }));
      }
    }
  };

  const handleAddNewStep = () => {
    if (!newStepName.trim()) {
      alert("Vui lòng nhập tên bước tiến trình.");
      return;
    }
    const newKey = `step_${Date.now()}`;
    const autoNumber = newStepNumber.trim() || `${stepsList.length + 1}`;
    
    const newStep: TrialStepDetail = {
      key: newKey,
      stepNumber: autoNumber,
      name: newStepName.trim(),
      roleResponsible: newStepRole.trim() || "Phòng Quản Lý Chất Lượng",
      isCompleted: false,
    };

    setStepsList([...stepsList, newStep]);
    setNewStepNumber("");
    setNewStepName("");
    const initDepts = getDepartmentsForBranch(homeBranch?.name || "");
    setNewStepRole(initDepts[0]?.name || "Phòng Quản Lý Chất Lượng");
    setIsCustomNewRole(false);
    setIsAddingNew(false);
  };

  const handleSaveAll = () => {
    const updatedStepsRecord: Record<string, TrialStepDetail> = {};
    const newOrder: string[] = [];

    stepsList.forEach((s) => {
      updatedStepsRecord[s.key] = s;
      newOrder.push(s.key);
    });

    // Check if currentStepKey is still valid, else assign first uncompleted or first step
    let nextCurrentKey = item.currentStepKey;
    if (!updatedStepsRecord[nextCurrentKey]) {
      const firstUncompleted = stepsList.find((s) => !s.isCompleted);
      nextCurrentKey = firstUncompleted ? firstUncompleted.key : stepsList[0]?.key || "";
    }

    const updatedItem: TrialTrackingItem = {
      ...item,
      steps: updatedStepsRecord,
      customStepOrder: newOrder,
      currentStepKey: nextCurrentKey,
      updatedAt: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    };

    onSave(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white px-4 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Settings className="w-5 h-5 text-teal-200 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">
                <span translate="no" className="notranslate">Tùy Chỉnh Tiến Trình Thử Nghiệm</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-teal-100/90 font-medium truncate max-w-[280px] sm:max-w-md">
                {item.code}: {item.title} • {item.factory}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-teal-200 hover:text-white text-lg font-bold p-1 shrink-0 leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content List */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1 text-xs bg-slate-50/50 overscroll-contain">
          {/* Information & Origin Branch Banner */}
          <div className="bg-blue-50/90 border border-blue-200 text-blue-950 p-2.5 sm:p-3 rounded-xl text-[11px] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                <span translate="no" className="notranslate">Chi nhánh tạo bản tin:</span>
                <span className="bg-blue-200/80 text-blue-950 px-2 py-0.5 rounded-md font-extrabold text-[10.5px]">
                  {item.factory || "Chưa xác định"}
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-[10.5px] leading-relaxed">
              <span translate="no" className="notranslate">
                Hệ thống ưu tiên hiển thị các BP/ĐV của chi nhánh tạo bản tin. Bạn cũng có thể chọn chuyển sang chi nhánh khác (hoặc Ban Cty / R&D) để chỉ định bộ phận phụ trách cho từng bước.
              </span>
            </p>
          </div>

          <div className="space-y-2.5">
            {stepsList.map((step, idx) => {
              const isEditing = editingKey === step.key;
              const activeBranchForStep = stepBranchMap[step.key] || detectBranchForRole(step.roleResponsible) || homeBranch?.name || "";
              const branchDepartments = getDepartmentsForBranch(activeBranchForStep);
              const isCustom = customEditingRoles[step.key];

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border transition-all ${
                    isEditing 
                      ? "bg-white border-teal-500 shadow-md ring-2 ring-teal-100" 
                      : "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  {isEditing ? (
                    /* Inline Editing Mode */
                    <div className="space-y-3">
                      {/* Row 1: Step Number & Step Name */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            <span translate="no" className="notranslate">Số/Ký hiệu:</span>
                          </label>
                          <input
                            type="text"
                            value={step.stepNumber}
                            onChange={(e) => handleUpdateStepField(step.key, "stepNumber", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded font-bold text-center text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            placeholder="VD: 3A"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            <span translate="no" className="notranslate">Tên bước thử nghiệm:</span>
                          </label>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => handleUpdateStepField(step.key, "name", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            placeholder="VD: Kiểm tra phôi / Lên khuôn"
                          />
                        </div>
                      </div>

                      {/* Row 2: Branch Selector & BP/ĐV Selector */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                        {/* Selector: Nhà máy / Chi nhánh */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-teal-600" />
                              <span translate="no" className="notranslate">Chi nhánh phụ trách:</span>
                            </label>
                            {activeBranchForStep !== homeBranch?.name && homeBranch?.name && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStepBranchMap(prev => ({ ...prev, [step.key]: homeBranch.name }));
                                  const homeDepts = getDepartmentsForBranch(homeBranch.name);
                                  if (homeDepts.length > 0) {
                                    handleUpdateStepField(step.key, "roleResponsible", homeDepts[0].name);
                                    setCustomEditingRoles(prev => ({ ...prev, [step.key]: false }));
                                  }
                                }}
                                className="text-[9.5px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 cursor-pointer underline"
                                title="Chuyển về chi nhánh tạo bản tin"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span translate="no" className="notranslate">Về chi nhánh bản tin</span>
                              </button>
                            )}
                          </div>
                          <select
                            value={activeBranchForStep}
                            onChange={(e) => {
                              const newBr = e.target.value;
                              setStepBranchMap(prev => ({ ...prev, [step.key]: newBr }));
                              const depts = getDepartmentsForBranch(newBr);
                              if (depts.length > 0) {
                                handleUpdateStepField(step.key, "roleResponsible", depts[0].name);
                                setCustomEditingRoles(prev => ({ ...prev, [step.key]: false }));
                              }
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                          >
                            <optgroup label="🏢 Chi nhánh tạo bản tin (Ưu tiên)">
                              {homeBranch && (
                                <option value={homeBranch.name}>
                                  ★ {homeBranch.name} (Chi nhánh bản tin)
                                </option>
                              )}
                            </optgroup>
                            <optgroup label="🏛️ Chọn chi nhánh / Ban khác">
                              {availableBranches
                                .filter(b => b.id !== homeBranch?.id && b.name !== homeBranch?.name)
                                .map((b) => (
                                  <option key={b.id} value={b.name}>
                                    {b.name}
                                  </option>
                                ))}
                            </optgroup>
                          </select>
                        </div>

                        {/* Selector: BP/ĐV Phụ trách */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span translate="no" className="notranslate">Bộ phận / Đơn vị (BP/ĐV) phụ trách:</span>
                            <span className="text-[9.5px] text-slate-500 font-normal truncate max-w-[180px]">
                              Sổ ra từ: {activeBranchForStep.split('(')[1]?.replace(')', '') || activeBranchForStep}
                            </span>
                          </label>

                          <div className="space-y-1.5">
                            <select
                              value={isCustom ? "CUSTOM_OPTION" : step.roleResponsible}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "CUSTOM_OPTION") {
                                  setCustomEditingRoles(prev => ({ ...prev, [step.key]: true }));
                                } else {
                                  setCustomEditingRoles(prev => ({ ...prev, [step.key]: false }));
                                  handleUpdateStepField(step.key, "roleResponsible", val);
                                }
                              }}
                              className="w-full px-2.5 py-1.5 border border-teal-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                            >
                              <optgroup label={`Danh sách BP/ĐV thuộc: ${activeBranchForStep}`}>
                                {branchDepartments.map((d) => (
                                  <option key={d.id} value={d.name}>
                                    {d.name} {d.shortName ? `(${d.shortName})` : ""}
                                  </option>
                                ))}
                              </optgroup>
                              {/* Keep current role if not currently listed */}
                              {step.roleResponsible && !branchDepartments.some(d => d.name === step.roleResponsible) && !isCustom && (
                                <option value={step.roleResponsible}>
                                  {step.roleResponsible} (Đang dùng)
                                </option>
                              )}
                              <option value="CUSTOM_OPTION">➕ Nhập BP/ĐV hoặc Tổ khác...</option>
                            </select>

                            {/* Custom text input if CUSTOM_OPTION chosen */}
                            {isCustom && (
                              <input
                                type="text"
                                value={step.roleResponsible}
                                onChange={(e) => handleUpdateStepField(step.key, "roleResponsible", e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-teal-400 rounded-lg text-xs font-semibold bg-teal-50/50 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                placeholder="Nhập tên BP/ĐV, Tổ sản xuất hoặc Bộ phận khác..."
                                autoFocus
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Finish Editing Step Button */}
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKey(null);
                            setCustomEditingRoles(prev => ({ ...prev, [step.key]: false }));
                          }}
                          className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span translate="no" className="notranslate">Xong</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Display Mode */
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Move Buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === stepsList.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Step Number Badge */}
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-black text-[10px] shrink-0">
                          {step.stepNumber}
                        </div>

                        {/* Step Title & Subtitle */}
                        <div className="min-w-0">
                          <div className="font-black uppercase text-blue-950 text-xs truncate">
                            <span translate="no" className="notranslate">{step.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1" title={step.roleResponsible}>
                            <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                            <span translate="no" className="notranslate font-semibold text-teal-900 truncate">
                              {abbreviateDepartmentName(step.roleResponsible, availableDepartments)}
                            </span>
                            {step.isCompleted && (
                              <span className="text-emerald-600 font-bold ml-1.5 shrink-0">• Đã làm</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditStep(step)}
                          className="p-1.5 hover:bg-teal-50 text-teal-700 rounded-lg font-bold text-[10px] flex items-center gap-1 border border-teal-200 cursor-pointer"
                          title="Sửa bước & chọn BP/ĐV"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            <span translate="no" className="notranslate">Sửa</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(step.key)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg font-bold text-[10px] flex items-center gap-1 border border-rose-200 cursor-pointer"
                          title="Xóa bước này"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            <span translate="no" className="notranslate">Xóa</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Step Form or Button */}
          {isAddingNew ? (
            <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 p-3 rounded-xl space-y-3">
              <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span translate="no" className="notranslate">Thêm Bước Mới Vào Tiến Trình</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    <span translate="no" className="notranslate">Số/Ký hiệu:</span>
                  </label>
                  <input
                    type="text"
                    value={newStepNumber}
                    onChange={(e) => setNewStepNumber(e.target.value)}
                    placeholder={`VD: ${stepsList.length + 1}`}
                    className="w-full px-2 py-1.5 border border-emerald-300 rounded font-bold text-center text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    <span translate="no" className="notranslate">Tên bước: *</span>
                  </label>
                  <input
                    type="text"
                    value={newStepName}
                    onChange={(e) => setNewStepName(e.target.value)}
                    placeholder="VD: Kiểm tra ngoại quan sau 2h..."
                    className="w-full px-2 py-1.5 border border-emerald-300 rounded text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Branch & Dept for New Step */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 space-y-2">
                {/* Branch Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span translate="no" className="notranslate">Chi nhánh phụ trách:</span>
                    </label>
                    {newStepBranch !== homeBranch?.name && homeBranch?.name && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewStepBranch(homeBranch.name);
                          const homeDepts = getDepartmentsForBranch(homeBranch.name);
                          if (homeDepts.length > 0) {
                            setNewStepRole(homeDepts[0].name);
                            setIsCustomNewRole(false);
                          }
                        }}
                        className="text-[9.5px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer underline"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span translate="no" className="notranslate">Về chi nhánh bản tin</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={newStepBranch}
                    onChange={(e) => {
                      const newBr = e.target.value;
                      setNewStepBranch(newBr);
                      const depts = getDepartmentsForBranch(newBr);
                      if (depts.length > 0) {
                        setNewStepRole(depts[0].name);
                        setIsCustomNewRole(false);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <optgroup label="🏢 Chi nhánh tạo bản tin (Ưu tiên)">
                      {homeBranch && (
                        <option value={homeBranch.name}>
                          ★ {homeBranch.name} (Chi nhánh bản tin)
                        </option>
                      )}
                    </optgroup>
                    <optgroup label="🏛️ Chọn chi nhánh / Ban khác">
                      {availableBranches
                        .filter(b => b.id !== homeBranch?.id && b.name !== homeBranch?.name)
                        .map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Department Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span translate="no" className="notranslate">Bộ phận / Đơn vị (BP/ĐV) phụ trách:</span>
                    <span className="text-[9.5px] text-slate-500 font-normal truncate max-w-[180px]">
                      Sổ ra từ: {newStepBranch.split('(')[1]?.replace(')', '') || newStepBranch}
                    </span>
                  </label>

                  <div className="space-y-1.5">
                    <select
                      value={isCustomNewRole ? "CUSTOM_OPTION" : newStepRole}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "CUSTOM_OPTION") {
                          setIsCustomNewRole(true);
                        } else {
                          setIsCustomNewRole(false);
                          setNewStepRole(val);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <optgroup label={`Danh sách BP/ĐV thuộc: ${newStepBranch}`}>
                        {getDepartmentsForBranch(newStepBranch).map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} {d.shortName ? `(${d.shortName})` : ""}
                          </option>
                        ))}
                      </optgroup>
                      <option value="CUSTOM_OPTION">➕ Nhập BP/ĐV khác...</option>
                    </select>

                    {isCustomNewRole && (
                      <input
                        type="text"
                        value={newStepRole}
                        onChange={(e) => setNewStepRole(e.target.value)}
                        placeholder="Nhập tên BP/ĐV hoặc Tổ..."
                        className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg text-xs bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for New Step */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setIsCustomNewRole(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  <span translate="no" className="notranslate">Hủy</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddNewStep}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span translate="no" className="notranslate">Lưu bước mới</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewStepNumber(`${stepsList.length + 1}`);
                setNewStepBranch(homeBranch?.name || "");
                const initDepts = getDepartmentsForBranch(homeBranch?.name || "");
                setNewStepRole(initDepts[0]?.name || "Phòng Quản Lý Chất Lượng");
                setIsCustomNewRole(false);
                setIsAddingNew(true);
              }}
              className="w-full py-2.5 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-3xs"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span translate="no" className="notranslate">+ Thêm Bước Mới Vào Tiến Trình</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer"
          >
            <span translate="no" className="notranslate">Đóng lại</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span translate="no" className="notranslate">Lưu Thay Đổi Tiến Trình</span>
          </button>
        </div>
      </div>
    </div>
  );
};


