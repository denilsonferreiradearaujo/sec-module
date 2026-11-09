'use client';

import React, { useState } from 'react';
import MobileScannerForm from '@/components/scanners/MobileScannerForm';
import ReportView from '@/components/report/ReportView';
import { UnifiedAuditReport } from '@/core/types/security';

export default function MobileAuditPage() {
  const [report, setReport] = useState<UnifiedAuditReport | null>(null);

  return (
    <div className="space-y-12">
      {!report ? (
        <MobileScannerForm onScanComplete={(newReport) => setReport(newReport)} />
      ) : (
        <ReportView report={report} onNewScan={() => setReport(null)} />
      )}
    </div>
  );
}
