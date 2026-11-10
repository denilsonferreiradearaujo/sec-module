import React from 'react';
import PhishingCampaignView from '@/components/phishing/PhishingCampaignView';

export const metadata = {
  title: 'Simulador de Conscientização de Phishing | Dev & Sec',
  description: 'Treinamento de conscientização e maturidade em cibersegurança contra ataques de engenharia social.',
};

export default function PhishingPage() {
  return (
    <div className="py-6">
      <PhishingCampaignView />
    </div>
  );
}
