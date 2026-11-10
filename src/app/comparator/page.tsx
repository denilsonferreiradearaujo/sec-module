import React from 'react';
import AuditComparatorView from '@/components/report/AuditComparatorView';

export const metadata = {
  title: 'Comparador de Auditorias (Antes vs Depois) | Dev & Sec',
  description: 'Comprove o ROI e a evolução de postura de segurança da sua empresa com a Dev & Sec.',
};

export default function ComparatorPage() {
  return (
    <div className="py-6">
      <AuditComparatorView />
    </div>
  );
}
