import React from 'react';
import { FileText, Layers, MapPin, CheckCircle } from 'lucide-react';
import MetricCard from './MetricCard';

export default function StatsRow({ stats }) {
  const cards = [
    {
      label: "Total Submissions",
      value: stats?.totalSubmissions ?? 0,
      icon: FileText,
      color: "coral"
    },
    {
      label: "AI Clustered Themes",
      value: stats?.totalThemes ?? 0,
      icon: Layers,
      color: "purple"
    },
    {
      label: "Active Wards",
      value: stats?.wardsActive ?? 0,
      icon: MapPin,
      color: "teal"
    },
    {
      label: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: CheckCircle,
      color: "amber"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {cards.map((card, idx) => (
        <MetricCard
          key={idx}
          icon={card.icon}
          value={card.value}
          label={card.label}
          color={card.color}
        />
      ))}
    </div>
  );
}
