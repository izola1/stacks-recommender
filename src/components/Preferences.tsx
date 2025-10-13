"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

export type Goal = "yield" | "low-risk" | "hands-off";

export function Preferences(props: {
  onChange: (prefs: { goal: Goal; minApy: number }) => void;
  value?: { goal: Goal; minApy: number };
}) {
  const [goal, setGoal] = useState<Goal>(props.value?.goal ?? "yield");
  const [minApy, setMinApy] = useState<number>(props.value?.minApy ?? 0);

  useEffect(() => {
    if (props.value) {
      setGoal(props.value.goal);
      setMinApy(props.value.minApy);
    }
  }, [props.value?.goal, props.value?.minApy]);

  function emit() {
    const clamped = Math.max(0, Math.min(100, Number.isFinite(minApy) ? minApy : 0));
    props.onChange({ goal, minApy: clamped });
    try {
      localStorage.setItem("stx-prefs", JSON.stringify({ goal, minApy: clamped }));
    } catch {}
  }

  const isDirty = useMemo(
    () =>
      goal !== (props.value?.goal ?? "yield") ||
      minApy !== (props.value?.minApy ?? 0),
    [goal, minApy, props.value?.goal, props.value?.minApy]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
    >
      {/* Investment Goal */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold tracking-wide">
          Investment Goal
        </label>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value as Goal)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-sky-500 transition-colors"
        >
          <option value="yield">Maximize yield</option>
          <option value="low-risk">Lower risk</option>
          <option value="hands-off">Hands-off</option>
        </select>
      </div>

      {/* Minimum APY */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold tracking-wide">
            Minimum APY
          </label>
          <span className="text-sm text-sky-400 font-medium">{minApy}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[minApy]}
          onValueChange={(val) => setMinApy(val[0])}
          className="w-full"
        />
      </div>

      {/* Apply Button */}
      <div className="pt-4">
        <Button
          onClick={emit}
          disabled={!isDirty}
           className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white font-medium shadow-md hover:scale-[1.02] transition disabled:opacity-60"
        >
          Apply Preferences
        </Button>
      </div>
    </motion.div>
  );
}
