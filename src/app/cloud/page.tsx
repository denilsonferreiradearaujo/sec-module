import CloudAuditView from '@/components/cloud/CloudAuditView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auditoria Cloud & Postura CSPM | DEV & SEC Suite 2.0',
  description: 'Varredura de Buckets S3 / Azure Blobs expostos e checklist de conformidade CIS Cloud Foundations Benchmark.',
};

export default function CloudPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CloudAuditView />
    </div>
  );
}
