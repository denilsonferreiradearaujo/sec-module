import SocialEngineeringView from '@/components/social-engineering/SocialEngineeringView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engenharia Social & Exposição C-Level | DEV & SEC Suite 2.0',
  description: 'Auditoria de vazamentos na Dark Web, inteligência OSINT e score de risco de Whaling / BEC para diretoria executiva.',
};

export default function SocialEngineeringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SocialEngineeringView />
    </div>
  );
}
