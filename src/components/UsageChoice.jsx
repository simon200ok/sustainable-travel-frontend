import { useState } from "react";
import { privacySignalOn, setUsageOptOut, usageOptedOut } from "../lib/usage";

// Lets anyone switch visitor counting off (or back on) for this browser
export default function UsageChoice() {
  const [optedOut, setOptedOut] = useState(usageOptedOut);
  const signal = privacySignalOn();

  if (signal) {
    return (
      <p className="usage-choice" role="status">
        ✅ Your browser sends a Global Privacy Control signal, so this browser is <strong>never counted</strong>.
      </p>
    );
  }

  return (
    <p className="usage-choice">
      <span role="status">
        {optedOut ? "⏸️ This browser is not being counted." : "✅ This browser is counted (anonymously)."}
      </span>{" "}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          setUsageOptOut(!optedOut);
          setOptedOut(!optedOut);
        }}
      >
        {optedOut ? "Count my visits again" : "Don't count my visits"}
      </button>
    </p>
  );
}
