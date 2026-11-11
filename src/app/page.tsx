import React from 'react';
import ModuleHubView from '@/components/modules/ModuleHubView';

export const metadata = {
  title: 'DEV & SEC Suite 2.0 | Painel de Módulos de Segurança',
  description: 'Painel unificado com todos os módulos de cibersegurança e auditoria da Dev & Sec.',
};

export default function HomePage() {
  return (
    <div className="py-4">
      <ModuleHubView />
    </div>
  );
}
