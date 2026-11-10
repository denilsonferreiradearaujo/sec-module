import React from 'react';
import ModuleHubView from '@/components/modules/ModuleHubView';

export const metadata = {
  title: 'Painel de Módulos de Segurança | Dev & Sec',
  description: 'Acesse todos os módulos da suíte de cibersegurança Dev & Sec.',
};

export default function ModulesPage() {
  return (
    <div className="py-6">
      <ModuleHubView />
    </div>
  );
}
