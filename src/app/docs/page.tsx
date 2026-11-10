import React from 'react';
import DocumentationView from '@/components/docs/DocumentationView';

export const metadata = {
  title: 'Guia Operacional & Documentação Visual | Dev & Sec',
  description: 'Base de conhecimento e documentação técnica e executiva sobre os módulos, testes do Kali Linux e cabeçalhos de segurança da Suite Dev & Sec.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background">
      <DocumentationView />
    </div>
  );
}
