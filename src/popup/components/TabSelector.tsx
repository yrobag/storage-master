import React, { useRef } from "react";
import { TABS } from "../utils/types";
import { useStorageState, useStorageDispatch } from "../context/hooks";

const TabSelector: React.FC = () => {
  const { activeTab } = useStorageState();
  const dispatch = useStorageDispatch();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextIdx = (idx + dir + TABS.length) % TABS.length;
      dispatch({ type: "CHANGE_TAB", tab: TABS[nextIdx] });
      tabRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div
      className="flex mb-4 gap-2"
      role="tablist"
      aria-label="Storage type tabs"
    >
      {TABS.map((tab, idx) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          className={`px-3 py-1 rounded ${activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"} cursor-pointer`}
          onClick={() => dispatch({ type: "CHANGE_TAB", tab })}
          ref={(el) => {
            tabRefs.current[idx] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, idx)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabSelector;
