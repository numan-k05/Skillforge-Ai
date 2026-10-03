import { useId, useRef } from "react";

export default function Tabs({ tabs, value, onChange, label = "Sections", children }) {
  const id = useId();
  const ref = useRef(null);
  function onKeyDown(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    onChange(tabs[next].value);
    ref.current.querySelectorAll('[role="tab"]')[next].focus();
  }
  return <div><div ref={ref} className="sf-tabs" role="tablist" aria-label={label}>{tabs.map((tab, index) => <button type="button" role="tab" key={tab.value} id={`${id}-${tab.value}`} aria-controls={`${id}-panel`} aria-selected={tab.value === value} tabIndex={tab.value === value ? 0 : -1} onClick={() => onChange(tab.value)} onKeyDown={(event) => onKeyDown(event, index)}>{tab.label}</button>)}</div><section role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${value}`} tabIndex={0}>{children}</section></div>;
}
