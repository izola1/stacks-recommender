import React from 'react';

interface RiskBadgeProps {
  risk: string;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  const color =
    risk === "Low" ? "bg-green-600 text-green-50" : risk === "Medium" ? "bg-yellow-600 text-yellow-50" : "bg-red-600 text-red-50";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{risk}</span>
  );
}