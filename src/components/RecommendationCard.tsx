import React from 'react';
import { motion } from 'framer-motion';
import { IconExternalLink } from "@tabler/icons-react";
import { RiskBadge } from './RiskBadge';

export interface RecommendationItem {
  id: number;
  platform: string;
  pair: string;
  apy: number;
  risk: string;
  score: number;
  link: string;
}

interface RecommendationCardProps {
  item: RecommendationItem;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="p-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/40 to-zinc-900/60 shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold">{item.platform[0]}</div>
          <div>
            <div className="text-sm font-semibold">{item.platform} <span className="text-zinc-400">•</span> <span className="text-zinc-300">{item.pair}</span></div>
            <div className="text-xs text-zinc-500 mt-1">Score: <span className="font-medium text-zinc-100">{item.score}/100</span></div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-2xl font-extrabold tracking-tight"><span>{item.apy}%</span></div>
          <RiskBadge risk={item.risk} />
        </div>
      </div>

      <div className="mt-4 text-sm text-zinc-400">Why this: matches your goal (maximize yield) and minimum APY ≥ 1. Moderate to high returns; risk varies by liquidity and volatility.</div>

      <div className="mt-5 flex items-center justify-between">
        <a href={item.link} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-sm">
          <IconExternalLink size={16} /> Open on {item.platform}
        </a>
        <div className="text-xs text-zinc-500">Updated: 5m</div>
      </div>
    </motion.article>
  );
}