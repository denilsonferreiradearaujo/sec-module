'use client';

import React, { useState } from 'react';
import UnifiedScannerForm from '@/components/scanners/UnifiedScannerForm';
import ReportView from '@/components/report/ReportView';
import { UnifiedAuditReport } from '@/core/types/security';

export default function ScannerPage() {
  const [report, setReport] = useState<UnifiedAuditReport | null>(null);

  return (
    <div className="space-y-12">
      {!report ? (
        <UnifiedScannerForm onScanComplete={(newReport) => setReport(newReport)} />
      ) : (
        <ReportView report={report} onNewScan={() => setReport(null)} />
      )}
    </div>
  );
}
