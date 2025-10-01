"use client";

import { useState } from "react";

export type Goal = "yield" | "low-risk" | "hands-off";

export function Preferences(props: {
  onChange: (prefs: { goal: Goal; minApy: number }) => void;
  value?: { goal: Goal; minApy: number };
}) {
  const [goal, setGoal] = useState<Goal>(props.value?.goal ?? "yield");
  const [minApy, setMinApy] = useState<number>(props.value?.minApy ?? 5);

  function emit() {
    console.log("preferences: apply", { goal, minApy });
    props.onChange({ goal, minApy });
  }

  return (
    <div>
      <h3>Preferences</h3>
      <div>
        <label>
          Goal:
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            onBlur={emit}
          >
            <option value="yield">Maximize yield</option>
            <option value="low-risk">Lower risk</option>
            <option value="hands-off">Hands-off</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Minimum APY (%):
          <input
            type="number"
            min={0}
            max={100}
            value={minApy}
            onChange={(e) => setMinApy(Number(e.target.value))}
            onBlur={emit}
          />
        </label>
      </div>
      <button type="button" onClick={emit}>Apply</button>
    </div>
  );
}


