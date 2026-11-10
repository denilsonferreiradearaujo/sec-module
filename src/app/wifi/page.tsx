import React from 'react';
import WifiProbeForm from '@/components/scanners/WifiProbeForm';

export const metadata = {
  title: 'Auditoria Wi-Fi & Redes Sem Fio | Dev & Sec',
  description: 'Auditoria corporativa de segurança sem fio com o Dev & Sec Wi-Fi Probe (Wifite + Aircrack-ng).',
};

export default function WifiPage() {
  return (
    <div className="py-6">
      <WifiProbeForm />
    </div>
  );
}
