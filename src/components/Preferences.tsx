"use client";

import { useState } from "react";

export type Goal = "yield" | "low-risk" | "hands-off";

export function Preferences(props: {
  onChange: (prefs: { goal: Goal; minApy: number }) => void;
}) {
  const [goal, setGoal] = useState<Goal>("yield");
  const [minApy, setMinApy] = useState<number>(5);

  function emit() {
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
      <button onClick={emit}>Apply</button>
    </div>
  );
}


