import React from 'react';
import { FileText, Layers, MapPin, CheckCircle } from 'lucide-react';

export default function StatsRow({ stats, lastUpdated }) {
  const cards = [
    {
      label: "Total Submissions",
      value: stats?.totalSubmissions ?? 0,
      icon: FileText,
      color: "bg-teal-50 text-teal-600"
    },
    {
      label: "AI Clustered Themes",
      value: stats?.totalThemes ?? 0,
      icon: Layers,
      color: "bg-purple-50 text-purple-600"
    },
    {
      label: "Active Wards",
      value: stats?.wardsActive ?? 0,
      icon: MapPin,
      color: "bg-blue-50 text-blue-600"
    },
    {
      label: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: CheckCircle,
      color: "bg-amber-50 text-amber-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 block uppercase tracking-wider">{card.label}</span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">{card.value}</span>
            </div>
            <div className={`p-2.5 rounded-lg ${card.color}`}>
              <Icon className="w-5.5 h-5.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
