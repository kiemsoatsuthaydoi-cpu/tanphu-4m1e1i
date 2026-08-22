export type AlertSeverity = 'critical' | 'major' | 'minor' | 'info';

export type AlertCategory = 
  | 'QUALITY'       // Lỗi chất lượng sản phẩm - Mỗi CN là 1 QC
  | 'EQUIPMENT'     // Sự cố thiết bị / máy móc
  | 'MATERIAL'      // Thiếu / sai nguyên vật liệu
  | 'SAFETY'        // An toàn lao động / 5S / EHS
  | 'TECH_SUPPORT'; // Hỗ trợ kỹ thuật / Rập / Mẫu

export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';

export interface AndonStation {
  id: string;
  name: string;
  code: string;
  lineId: string;
  workerName: string;
  workerCode: string;
  status: 'NORMAL' | 'WARNING' | 'ALERT' | 'MAINTENANCE';
  activeAlertId?: string;
  taktTimeSec: number;
  outputToday: number;
  targetToday: number;
  defectCountToday: number;
}

export interface ProductionLine {
  id: string;
  name: string;
  code: string;
  manager: string;
  shift: string;
  status: 'RUNNING' | 'HALTED' | 'DEGRADED';
  stations: AndonStation[];
  fpy: number; // First Pass Yield %
  oee: number; // Overall Equipment Effectiveness %
}

export interface AndonTicket {
  id: string;
  ticketNumber: string;
  stationId: string;
  stationName: string;
  lineName: string;
  reporterName: string;
  reporterRole: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  defectType?: string;
  suggestedAction?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  responderName?: string;
  status: AlertStatus;
  images?: string[];
  rootCause5Why?: {
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
    rootCause: string;
    preventiveAction: string;
  };
}

export interface QCDefectType {
  code: string;
  name: string;
  category: string;
  standardTolerance: string;
  inspectionGuide: string;
}
