import React, { useState, useMemo } from "react";
import { 
  Building, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  Award,
  BarChart4,
  Calendar
} from "lucide-react";
import { User, UserStatus, Branch, Department } from "../types";
import { T } from "./TranslateText";
import { initialBranches, initialDepartments } from "../data";

interface StatisticsDashboardProps {
  users: User[];
  branches?: Branch[];
  departments?: Department[];
}

export default function StatisticsDashboard({ 
  users = [], 
  branches = initialBranches, 
  departments = initialDepartments 
}: StatisticsDashboardProps) {
  // 1. Filter state for "SỐ CBNV ONLINE TRONG NGÀY"
  const [onlineBranchFilter, setOnlineBranchFilter] = useState<string>("TẤT CẢ");
  
  // 2. Expanded state for departments in "SỐ CBNV ONLINE TRONG NGÀY"
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  const toggleDeptExpanded = (deptName: string) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  // Date and month filter states
  const currentDate = useMemo(() => new Date(Date.now()), []);
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const displayYear = (currentYear % 100).toString().padStart(2, "0");

  const [selectedDay, setSelectedDay] = useState<number>(currentDay);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(currentMonth);

  const maxDaysInMonth = useMemo(() => {
    return new Date(currentYear, selectedMonth, 0).getDate();
  }, [selectedMonth, currentYear]);

  // Adjust selected day if it exceeds max days in month
  React.useEffect(() => {
    if (selectedDay > maxDaysInMonth) {
      setSelectedDay(maxDaysInMonth);
    }
  }, [selectedMonth, maxDaysInMonth, selectedDay]);

  // Dynamically calculate days to display in the calendar grid
  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number; month: number; isCurrentMonth: boolean }> = [];
    let firstDayOffset = new Date(currentYear, calendarMonth - 1, 1).getDay(); // 0-6 (Sun-Sat)
    // Shift so Monday is index 0 and Sunday is index 6
    firstDayOffset = firstDayOffset === 0 ? 6 : firstDayOffset - 1;

    const daysInPrevMonth = new Date(currentYear, calendarMonth - 1, 0).getDate();
    const daysInCurrMonth = new Date(currentYear, calendarMonth, 0).getDate();
    
    // Previous month's trailing days
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        month: calendarMonth === 1 ? 12 : calendarMonth - 1,
        isCurrentMonth: false
      });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInCurrMonth; i++) {
      cells.push({
        day: i,
        month: calendarMonth,
        isCurrentMonth: true
      });
    }
    
    // Next month's leading days to fill up to exactly 42 grid cells (6 rows x 7 columns)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        month: calendarMonth === 12 ? 1 : calendarMonth + 1,
        isCurrentMonth: false
      });
    }
    
    return cells;
  }, [calendarMonth, currentYear]);

  const handleSetToToday = () => {
    setSelectedDay(currentDay);
    setSelectedMonth(currentMonth);
    setCalendarMonth(currentMonth);
  };

  const handleSelectDate = (day: number, month: number) => {
    setSelectedDay(day);
    setSelectedMonth(month);
    setCalendarMonth(month);
    setShowDatePicker(false);
  };

  const isTodaySelected = selectedDay === currentDay && selectedMonth === currentMonth;

  // Real active users from DB (Users whose status is ACTIVE)
  const realActiveUsers = useMemo(() => {
    return users.filter(u => u.status === UserStatus.ACTIVE);
  }, [users]);

  // Derive all department and online stats dynamically
  const { 
    onlineDepartments, 
    totalOnlineCount, 
    approvedBranches, 
    approvedDepartments, 
    totalApprovedBranchCount 
  } = useMemo(() => {
    const now = Date.now();

    // Group approved users by department to calculate dynamic stats
    const deptMap = new Map<string, {
      name: string;
      onlineCount: number;
      totalCount: number;
      branchId: string;
      members: Array<{ 
        id: string; 
        fullName: string; 
        times: string[]; 
        isOnlineCurrently: boolean;
      }>
    }>();

    realActiveUsers.forEach(u => {
      let deptName = u.department || "Chưa phân bộ phận";
      const branchId = u.branch?.includes("LAN") ? "TPP-LAN" : 
                       u.branch?.includes("BNI") ? "TPP-BNI" : 
                       u.branch?.includes("314") ? "TPP-314" : 
                       u.branch?.includes("BBM") ? "DNP-BBM" : 
                       u.branch?.includes("BBC") ? "DNP-BBC" : "TPP-CTY";

      // Ensure deptName always has the correct branch suffix
      if (deptName && !deptName.includes("(")) {
        deptName = `${deptName} (${branchId})`;
      }

      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, {
          name: deptName,
          onlineCount: 0,
          totalCount: 0,
          branchId,
          members: []
        });
      }

      const dept = deptMap.get(deptName)!;
      dept.totalCount += 1;

      // Extract all active session timestamps matching selected day and month
      const dayLogs = (u.activeLogs || []).filter(ts => {
        const d = new Date(ts);
        return d.getDate() === selectedDay && (d.getMonth() + 1) === selectedMonth;
      });

      const formattedTimes: string[] = [];
      const seenMinutes = new Set<string>();

      dayLogs.forEach(ts => {
        const dateObj = new Date(ts);
        const hrs = dateObj.getHours().toString().padStart(2, "0");
        const mins = dateObj.getMinutes().toString().padStart(2, "0");
        const timeStr = `${hrs}:${mins}`;
        if (!seenMinutes.has(timeStr)) {
          seenMinutes.add(timeStr);
          formattedTimes.push(timeStr);
        }
      });

      // Ensure lastActive is appended if it falls on the selected day and is not already listed
      if (u.lastActive) {
        const activeDate = new Date(u.lastActive);
        if (activeDate.getDate() === selectedDay && (activeDate.getMonth() + 1) === selectedMonth) {
          const hrs = activeDate.getHours().toString().padStart(2, "0");
          const mins = activeDate.getMinutes().toString().padStart(2, "0");
          const timeStr = `${hrs}:${mins}`;
          if (!seenMinutes.has(timeStr)) {
            seenMinutes.add(timeStr);
            formattedTimes.push(timeStr);
          }
        }
      }

      // Determine active/online status based on the selected day & month
      let isUserOnlineOnSelectedDay = false;

      if (isTodaySelected) {
        // Active today: is currently online OR updated heartbeat within last 12 hours
        isUserOnlineOnSelectedDay = !!u.isOnline || (!!u.lastActive && (now - u.lastActive <= 12 * 60 * 60 * 1000));
      } else {
        // Active on another day: has logged sessions for that day
        isUserOnlineOnSelectedDay = formattedTimes.length > 0;
      }

      if (isUserOnlineOnSelectedDay) {
        dept.onlineCount += 1;

        // If today is selected but no logs were found, add fallback
        if (formattedTimes.length === 0) {
          if (u.lastActive) {
            const activeDate = new Date(u.lastActive);
            const hrs = activeDate.getHours().toString().padStart(2, "0");
            const mins = activeDate.getMinutes().toString().padStart(2, "0");
            formattedTimes.push(`${hrs}:${mins}`);
          } else {
            formattedTimes.push("Vừa hoạt động");
          }
        }

        const isOnlineCurrently = !!u.isOnline || (!!u.lastActive && (now - u.lastActive) <= 240000);

        dept.members.push({
          id: u.id,
          fullName: u.fullName.toUpperCase(),
          times: formattedTimes,
          isOnlineCurrently: !!isOnlineCurrently
        });
      }
    });

    // Filter out departments with 0 online users
    const allOnlineDepts = Array.from(deptMap.values())
      .filter(d => d.onlineCount > 0)
      .sort((a, b) => {
        if (b.onlineCount !== a.onlineCount) {
          return b.onlineCount - a.onlineCount;
        }
        return b.totalCount - a.totalCount;
      });

    const sumOnline = allOnlineDepts.reduce((acc, curr) => acc + curr.onlineCount, 0);

    // Group approved users by branch
    const branchNames = [
      { id: "TPP-CTY", name: "Văn Phòng Công Ty (TPP-CTY)" },
      { id: "TPP-BNI", name: "Chi Nhánh Bắc Ninh (TPP-BNI)" },
      { id: "TPP-LAN", name: "Chi Nhánh Long An (TPP-LAN)" },
      { id: "TPP-314", name: "Nhà máy 314 (TPP-314)" },
      { id: "DNP-BBM", name: "Nhà máy BBM (DNP-BBM)" },
      { id: "DNP-BBC", name: "Nhà máy BBC (DNP-BBC)" }
    ];

    const branchCounts: Record<string, number> = {};
    branchNames.forEach(b => {
      branchCounts[b.id] = 0;
    });

    realActiveUsers.forEach(u => {
      const bid = u.branch?.includes("LAN") ? "TPP-LAN" : 
                  u.branch?.includes("BNI") ? "TPP-BNI" : 
                  u.branch?.includes("314") ? "TPP-314" : 
                  u.branch?.includes("BBM") ? "DNP-BBM" : 
                  u.branch?.includes("BBC") ? "DNP-BBC" : "TPP-CTY";
      branchCounts[bid] = (branchCounts[bid] || 0) + 1;
    });

    const finalBranches = branchNames.map(b => ({
      id: b.id,
      name: b.name,
      count: branchCounts[b.id] || 0
    })).sort((a, b) => b.count - a.count);

    const totalApprovedBranchCount = finalBranches.reduce((acc, curr) => acc + curr.count, 0);

    // Group approved users by department
    const deptCounts = new Map<string, number>();
    realActiveUsers.forEach(u => {
      let deptName = u.department || "Chưa phân bộ phận";
      const branchId = u.branch?.includes("LAN") ? "TPP-LAN" : 
                       u.branch?.includes("BNI") ? "TPP-BNI" : 
                       u.branch?.includes("314") ? "TPP-314" : 
                       u.branch?.includes("BBM") ? "DNP-BBM" : 
                       u.branch?.includes("BBC") ? "DNP-BBC" : "TPP-CTY";

      if (deptName && !deptName.includes("(")) {
        deptName = `${deptName} (${branchId})`;
      }
      deptCounts.set(deptName, (deptCounts.get(deptName) || 0) + 1);
    });

    const finalDepts = Array.from(deptCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      onlineDepartments: allOnlineDepts,
      totalOnlineCount: sumOnline,
      approvedBranches: finalBranches,
      approvedDepartments: finalDepts,
      totalApprovedBranchCount
    };
  }, [realActiveUsers, selectedDay, selectedMonth, isTodaySelected]);

  // Filter online departments by branch
  const filteredOnlineDepts = useMemo(() => {
    if (onlineBranchFilter === "TẤT CẢ") {
      return onlineDepartments;
    }
    return onlineDepartments.filter(d => d.branchId === onlineBranchFilter);
  }, [onlineDepartments, onlineBranchFilter]);

  // Total online count of filtered branch
  const filteredOnlineCount = useMemo(() => {
    return filteredOnlineDepts.reduce((acc, curr) => acc + curr.onlineCount, 0);
  }, [filteredOnlineDepts]);

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* 1. SỐ CBNV ONLINE TRONG NGÀY CARD */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-sm flex flex-col min-h-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-base md:text-lg font-black text-slate-850 tracking-tight">
              <T><span translate="no" className="notranslate">SỐ CBNV ONLINE TRONG NGÀY</span></T>
            </h2>
          </div>

          {/* New Interactive Calendar Selector Popover */}
          <div className="relative flex items-center gap-2 flex-wrap sm:flex-nowrap z-50">
            {/* Display formatted dd/mm/yy badge, clicking also triggers date picker */}
            <button
              onClick={() => {
                setCalendarMonth(selectedMonth);
                setShowDatePicker(!showDatePicker);
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-1.5 shadow-3xs cursor-pointer transition-all active:scale-[0.98] select-none text-slate-700"
            >
              <Calendar className="w-4 h-4 text-[#1d4ed8] shrink-0" />
              <div className="flex items-center gap-1.5">
                <span translate="no" className="notranslate text-xs font-black">
                  {selectedDay.toString().padStart(2, "0")}/{selectedMonth.toString().padStart(2, "0")}/{displayYear}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDatePicker ? "rotate-180" : ""}`} />
            </button>

            {/* Quick Reset back to Today */}
            {!isTodaySelected && (
              <button
                onClick={handleSetToToday}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/60 transition-colors cursor-pointer px-3 py-1.5 rounded-xl border border-blue-100/50"
              >
                <T><span translate="no" className="notranslate">Hôm nay</span></T>
              </button>
            )}

            {/* Calendar popover dropdown panel */}
            {showDatePicker && (
              <>
                {/* Backdrop to dismiss calendar on clicking outside */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setShowDatePicker(false)}
                />
                
                {/* Calendar Panel Card */}
                <div className="absolute right-0 top-full mt-2 w-[300px] bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-scaleIn select-none">
                  {/* Month Navigation Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalendarMonth(prev => prev === 1 ? 12 : prev - 1)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                    
                    <span translate="no" className="notranslate text-sm font-extrabold text-slate-800 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                      Tháng {calendarMonth.toString().padStart(2, "0")} / 2026
                    </span>
                    
                    <button
                      onClick={() => setCalendarMonth(prev => prev === 12 ? 1 : prev + 1)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                  
                  {/* Weekday Labels (Monday is first) */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayLabel, idx) => {
                      const isWeekend = dayLabel === "CN" || dayLabel === "T7";
                      return (
                        <span 
                          key={idx} 
                          translate="no" 
                          className={`notranslate text-[10px] font-black uppercase tracking-wider ${isWeekend ? "text-rose-500" : "text-slate-400"}`}
                        >
                          {dayLabel}
                        </span>
                      );
                    })}
                  </div>
                  
                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((cell, idx) => {
                      const isSelected = selectedDay === cell.day && selectedMonth === cell.month;
                      const isToday = currentDay === cell.day && currentMonth === cell.month;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectDate(cell.day, cell.month)}
                          className={`
                            h-8 w-full rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer relative
                            ${!cell.isCurrentMonth ? "text-slate-300 hover:bg-slate-50" : ""}
                            ${cell.isCurrentMonth && !isSelected && !isToday ? "text-slate-700 hover:bg-slate-100" : ""}
                            ${isToday && !isSelected ? "border border-blue-500/80 text-blue-600 bg-blue-50/20" : ""}
                            ${isSelected ? "bg-[#1d4ed8] text-white shadow-md shadow-blue-500/20 font-extrabold scale-105" : ""}
                          `}
                          translate="no"
                        >
                          <span translate="no" className="notranslate">
                            {cell.day}
                          </span>
                          {isToday && !isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Shortcuts & Today Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={handleSetToToday}
                      className="text-xs font-extrabold text-[#1d4ed8] hover:underline cursor-pointer bg-blue-50/50 px-2.5 py-1 rounded-lg"
                    >
                      <T><span translate="no" className="notranslate">Hôm nay</span></T>
                    </button>
                    <span translate="no" className="notranslate text-[10px] text-slate-400 font-mono font-bold bg-slate-50 px-2 py-1 rounded-lg">
                      {currentDay.toString().padStart(2, "0")}/{currentMonth.toString().padStart(2, "0")}/{displayYear}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-blue-50/70 border border-blue-100 text-blue-700 text-xs px-4 py-1.5 rounded-full font-bold shadow-3xs shrink-0 flex items-center gap-1.5 self-start lg:self-auto">
            {isTodaySelected && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            )}
            <T><span translate="no" className="notranslate">CÔNG TY: {totalOnlineCount} người</span></T>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap gap-2 py-4">
          {["TẤT CẢ", "TPP-CTY", "TPP-BNI", "TPP-LAN", "TPP-314", "DNP-BBM", "DNP-BBC"].map((branchId) => (
            <button
              key={branchId}
              onClick={() => setOnlineBranchFilter(branchId)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer border select-none ${
                onlineBranchFilter === branchId
                  ? "bg-[#1d4ed8] border-blue-750 text-white shadow-md shadow-blue-500/10 font-extrabold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <T><span translate="no" className="notranslate">{branchId}</span></T>
            </button>
          ))}
        </div>

        {/* Scrollable list of departments */}
        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredOnlineDepts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 italic text-xs">
              <T><span translate="no" className="notranslate">Không có phòng ban nào online ở chi nhánh này</span></T>
            </div>
          ) : (
            filteredOnlineDepts.map((dept) => {
              const percentage = dept.totalCount > 0 ? Math.round((dept.onlineCount / dept.totalCount) * 100) : 0;
              const isExpanded = !!expandedDepts[dept.name];
              const hasMembers = dept.members && dept.members.length > 0;

              return (
                <div key={dept.name} className="border-b border-slate-100/60 pb-3 last:border-b-0">
                  <div 
                    onClick={() => hasMembers && toggleDeptExpanded(dept.name)}
                    className={`flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 p-2 rounded-xl transition-colors ${hasMembers ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dept.onlineCount > 0 ? "bg-[#10b981]" : "bg-slate-300"}`}></span>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight truncate">
                        <T><span translate="no" className="notranslate">{dept.name}</span></T>
                      </h3>
                      {hasMembers && (
                        isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-500 shrink-0 font-mono text-right">
                      <span translate="no" className="notranslate text-slate-800 font-extrabold">{dept.onlineCount}</span>
                      <span translate="no" className="notranslate"> / {dept.totalCount} người </span>
                      <span translate="no" className="notranslate text-slate-400 font-normal">({percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Expanded Sublist */}
                  {isExpanded && hasMembers && (
                    <div className="mt-3 pl-4 space-y-2.5 border-l-2 border-blue-500/60 ml-2 py-1 bg-slate-50/50 rounded-r-xl p-2.5">
                      {dept.members.map((m) => (
                        <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-100/40 last:border-b-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${m.isOnlineCurrently && isTodaySelected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                            <span translate="no" className="notranslate font-bold text-[#1e3a8a] tracking-wide uppercase truncate">
                              {m.fullName}
                            </span>
                            <span translate="no" className="notranslate bg-slate-200/80 px-2 py-0.5 rounded-md text-[10px] text-slate-600 font-mono font-semibold shrink-0">
                              {m.id}
                            </span>
                          </div>
                          
                          {/* List of entry times on the same line */}
                          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px] text-slate-500">
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">
                              <T><span translate="no" className="notranslate">Lượt vào ({m.times.length}):</span></T>
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {m.times.map((t, idx) => {
                                const isLast = idx === m.times.length - 1;
                                return (
                                  <span 
                                    key={idx}
                                    translate="no"
                                    className={`notranslate px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                      isLast && m.isOnlineCurrently && isTodaySelected
                                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {t}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info text */}
        <div className="border-t border-slate-100 mt-4 pt-4 flex items-center gap-2 text-slate-500 text-xs">
          <Activity className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
          <p className="leading-relaxed">
            <T><span translate="no" className="notranslate">Thống kê hoạt động thực tế của CBNV ghi nhận tự động theo ngày lịch hiện tại.</span></T>
          </p>
        </div>
      </div>

      {/* 2 & 3: CBNV ĐÃ PHÊ DUYỆT THEO CHI NHÁNH & PHÒNG BAN (Side-by-side on desktop, stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: BRANCH STATS */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <h2 className="text-sm md:text-base font-black text-slate-800 tracking-tight">
                  <T><span translate="no" className="notranslate">CBNV ĐÃ PHÊ DUYỆT THEO CHI NHÁNH</span></T>
                </h2>
              </div>
              <div className="bg-indigo-50 text-indigo-700 text-[10px] px-3 py-1 rounded-full font-black font-mono shrink-0">
                <T><span translate="no" className="notranslate">{totalApprovedBranchCount} CBNV</span></T>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              {approvedBranches.map((branch) => {
                const percentage = totalApprovedBranchCount > 0 ? Math.round((branch.count / totalApprovedBranchCount) * 100) : 0;
                return (
                  <div key={branch.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5850ec] shrink-0"></span>
                        <span translate="no" className="notranslate truncate">{branch.name}</span>
                      </div>
                      <div className="shrink-0 font-mono">
                        <span translate="no" className="notranslate text-slate-900 font-extrabold">{branch.count} người </span>
                        <span translate="no" className="notranslate text-slate-400 font-normal">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-indigo-50/50 h-2 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="bg-[#5850ec] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Card: DEPARTMENT STATS */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-sm md:text-base font-black text-slate-800 tracking-tight">
                  <T><span translate="no" className="notranslate">CBNV ĐÃ PHÊ DUYỆT THEO PHÒNG BAN</span></T>
                </h2>
              </div>
              <div className="bg-emerald-50 text-emerald-700 text-[10px] px-3 py-1 rounded-full font-black font-mono shrink-0">
                <T><span translate="no" className="notranslate">{approvedDepartments.length} phòng ban</span></T>
              </div>
            </div>

            <div className="space-y-4 mt-4 max-h-[300px] overflow-y-auto pr-1">
              {approvedDepartments.slice(0, 10).map((dept) => {
                const totalCountOfAllDepts = approvedDepartments.reduce((acc, c) => acc + c.count, 0);
                const percentage = totalCountOfAllDepts > 0 ? Math.round((dept.count / totalCountOfAllDepts) * 100) : 0;
                return (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0"></span>
                        <span translate="no" className="notranslate truncate">{dept.name}</span>
                      </div>
                      <div className="shrink-0 font-mono">
                        <span translate="no" className="notranslate text-slate-900 font-extrabold">{dept.count} người </span>
                        <span translate="no" className="notranslate text-slate-400 font-normal">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-emerald-50/50 h-2 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="bg-[#10b981] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
