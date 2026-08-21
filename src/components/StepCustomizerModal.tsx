import React, { useState, useMemo } from "react";
import { Plus, Trash2, Edit3, ArrowUp, ArrowDown, Settings, Check, X, Building2 } from "lucide-react";
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

  // Branch-specific departments for this trial item
  const branchDepts = useMemo(() => {
    const clean = (item.factory || "").trim();
    if (!clean) return availableDepartments;

    const targetBranch = availableBranches.find(b => 
      b.name === clean || 
      b.id === clean || 
      clean.includes(b.id) ||
      b.name.toLowerCase().includes(clean.toLowerCase()) ||
      clean.toLowerCase().includes(b.name.toLowerCase())
    );

    if (targetBranch) {
      const matched = availableDepartments.filter(d => d.branchId === targetBranch.id);
      if (matched.length > 0) return matched;
    }

    const matchCode = clean.match(/\(([^)]+)\)/);
    const code = matchCode ? matchCode[1] : clean;
    const fallbackMatched = availableDepartments.filter(d => 
      d.branchId.includes(code) || 
      d.name.includes(code)
    );

    return fallbackMatched.length > 0 ? fallbackMatched : availableDepartments;
  }, [item.factory, availableBranches, availableDepartments]);

  // Company-wide / R&D / Common departments (from TPP-CTY) that can also be responsible for steps
  const companyDepts = useMemo(() => {
    return availableDepartments.filter(d => d.branchId === "TPP-CTY" && !branchDepts.some(bd => bd.id === d.id));
  }, [availableDepartments, branchDepts]);

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

  // New step inputs
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStepNumber, setNewStepNumber] = useState("");
  const [newStepName, setNewStepName] = useState("");
  const [newStepRole, setNewStepRole] = useState(() => {
    return branchDepts[0]?.name || "Phòng Quản Lý Chất Lượng";
  });
  const [isCustomNewRole, setIsCustomNewRole] = useState(false);
  const [customEditingRoles, setCustomEditingRoles] = useState<Record<string, boolean>>({});

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
    setNewStepRole(branchDepts[0]?.name || "Phòng Quản Lý Chất Lượng");
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

  // Check if a role value exists in department lists
  const isKnownDepartment = (roleName: string) => {
    return availableDepartments.some(d => d.name.toLowerCase() === roleName.toLowerCase().trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-200" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
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
            className="text-teal-200 hover:text-white text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs bg-slate-50/50">
          <div className="bg-blue-50/80 border border-blue-200 text-blue-900 p-2.5 rounded-xl text-[11px] flex items-start gap-2">
            <span className="font-bold text-blue-700 shrink-0">💡 Lưu ý:</span>
            <span>
              <span translate="no" className="notranslate">
                Bạn có thể sửa tên, số thứ tự, chọn Bộ phận / Đơn vị (BP/ĐV) phụ trách từ chi nhánh để tiện thống kê sau này, thêm bước mới hoặc xóa bước không cần thiết.
              </span>
            </span>
          </div>

          <div className="space-y-2">
            {stepsList.map((step, idx) => {
              const isEditing = editingKey === step.key;
              const isCustom = customEditingRoles[step.key] || (!isKnownDepartment(step.roleResponsible) && isEditing);

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
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            <span translate="no" className="notranslate">Số/Ký hiệu:</span>
                          </label>
                          <input
                            type="text"
                            value={step.stepNumber}
                            onChange={(e) => handleUpdateStepField(step.key, "stepNumber", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded font-bold text-center text-xs"
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
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                            placeholder="VD: Kiểm tra phôi / Lên khuôn"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-600 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                            <span translate="no" className="notranslate">Bộ phận phụ trách (BP/ĐV):</span>
                          </span>
                          <span className="text-[10px] text-teal-700 font-normal">
                            Sổ ra từ chi nhánh {item.factory ? `(${item.factory.split('(')[1]?.replace(')', '') || item.factory})` : ''}
                          </span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className={isCustom ? "sm:col-span-6" : "sm:col-span-10"}>
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
                              className="w-full px-2.5 py-1.5 border border-teal-300 rounded-lg text-xs font-semibold text-slate-800 bg-teal-50/30 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            >
                              <optgroup label={`🏢 BP/ĐV thuộc: ${item.factory || "Chi nhánh"}`}>
                                {branchDepts.map((d) => (
                                  <option key={d.id} value={d.name}>
                                    {d.name} {d.shortName ? `(${d.shortName})` : ""}
                                  </option>
                                ))}
                              </optgroup>
                              {companyDepts.length > 0 && (
                                <optgroup label="🏛️ Phòng ban Công ty / R&D (TPP-CTY)">
                                  {companyDepts.map((d) => (
                                    <option key={d.id} value={d.name}>
                                      {d.name} {d.shortName ? `(${d.shortName})` : ""}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {/* Keep current custom value as option if not in list */}
                              {step.roleResponsible && !isKnownDepartment(step.roleResponsible) && (
                                <option value={step.roleResponsible}>
                                  {step.roleResponsible} (Đang dùng)
                                </option>
                              )}
                              <option value="CUSTOM_OPTION">➕ Nhập BP/ĐV hoặc Tổ khác...</option>
                            </select>
                          </div>

                          {isCustom && (
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={step.roleResponsible}
                                onChange={(e) => handleUpdateStepField(step.key, "roleResponsible", e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-teal-400 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                placeholder="Nhập tên BP/ĐV..."
                                autoFocus
                              />
                            </div>
                          )}

                          <div className={isCustom ? "sm:col-span-2 flex items-center justify-end" : "sm:col-span-2 flex items-center justify-end"}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKey(null);
                                setCustomEditingRoles(prev => ({ ...prev, [step.key]: false }));
                              }}
                              className="w-full sm:w-auto px-3 py-1.5 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 text-[11px] flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span translate="no" className="notranslate">Xong</span>
                            </button>
                          </div>
                        </div>
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
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === stepsList.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
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
                            <span translate="no" className="notranslate font-semibold text-teal-900 truncate">{abbreviateDepartmentName(step.roleResponsible, availableDepartments)}</span>
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
                          onClick={() => setEditingKey(step.key)}
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
            <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 p-3 rounded-xl space-y-2.5">
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
                    className="w-full px-2 py-1.5 border border-emerald-300 rounded font-bold text-center text-xs bg-white"
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
                    className="w-full px-2 py-1.5 border border-emerald-300 rounded text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span translate="no" className="notranslate">Bộ phận phụ trách (BP/ĐV):</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-normal">
                    Sổ ra từ chi nhánh {item.factory ? `(${item.factory.split('(')[1]?.replace(')', '') || item.factory})` : ''}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className={isCustomNewRole ? "sm:col-span-6" : "sm:col-span-8"}>
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
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <optgroup label={`🏢 BP/ĐV thuộc: ${item.factory || "Chi nhánh"}`}>
                        {branchDepts.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} {d.shortName ? `(${d.shortName})` : ""}
                          </option>
                        ))}
                      </optgroup>
                      {companyDepts.length > 0 && (
                        <optgroup label="🏛️ Phòng ban Công ty / R&D (TPP-CTY)">
                          {companyDepts.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} {d.shortName ? `(${d.shortName})` : ""}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <option value="CUSTOM_OPTION">➕ Nhập BP/ĐV khác...</option>
                    </select>
                  </div>

                  {isCustomNewRole && (
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        value={newStepRole}
                        onChange={(e) => setNewStepRole(e.target.value)}
                        placeholder="Nhập tên BP/ĐV..."
                        className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                        autoFocus
                      />
                    </div>
                  )}

                  <div className={isCustomNewRole ? "sm:col-span-12 flex items-center justify-end gap-1.5 pt-1" : "sm:col-span-4 flex items-center justify-end gap-1.5"}>
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
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewStepNumber(`${stepsList.length + 1}`);
                setNewStepRole(branchDepts[0]?.name || "Phòng Quản Lý Chất Lượng");
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

