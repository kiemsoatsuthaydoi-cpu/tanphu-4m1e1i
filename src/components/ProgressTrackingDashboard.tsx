import React from "react";
import { QualityReport, User, Branch, Department } from "../types";
import { TrialTrackingHub } from "./TrialTrackingHub";

interface ProgressTrackingDashboardProps {
  reports?: QualityReport[];
  users?: User[];
  branches?: Branch[];
  departments?: Department[];
  currentUser?: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  onAddBroadcast?: (notice: string, type: string) => void;
  onOpenReportModal?: (report: QualityReport) => void;
  showToast?: (message: string, type?: "error" | "info" | "warning" | "success") => void;
  isMobile?: boolean;
}

export const ProgressTrackingDashboard: React.FC<ProgressTrackingDashboardProps> = (props) => {
  return (
    <div className="w-full h-full">
      <TrialTrackingHub 
        currentUser={props.currentUser || undefined}
        showToast={props.showToast ? (msg: string) => props.showToast!(msg) : undefined}
      />
    </div>
  );
};

export default ProgressTrackingDashboard;
