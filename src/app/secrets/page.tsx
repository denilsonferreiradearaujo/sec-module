'use client';

import React, { useState } from 'react';
import SecretScannerForm from '@/components/scanners/SecretScannerForm';
import ReportView from '@/components/report/ReportView';
import { UnifiedAuditReport } from '@/core/types/security';

export default function SecretsAuditPage() {
  const [report, setReport] = useState<UnifiedAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-12">
      {!report ? (
        <SecretScannerForm
          onScanComplete={(newReport) => setReport(newReport)}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      ) : (
        <ReportView report={report} onNewScan={() => setReport(null)} />
      )}
    </div>
  );
}
