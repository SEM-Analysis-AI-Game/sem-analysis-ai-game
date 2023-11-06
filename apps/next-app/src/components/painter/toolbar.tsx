"use client";

import { PropsWithChildren } from "react";
import { useCollapse } from "react-collapsed";

export function Toolbar(props: PropsWithChildren<{}>): JSX.Element {
  const config = {
    duration: 500,
    easing: 'cubic-bezier(.93,.12,.42,.25)'
    };
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse(config);

  return (
    <div className="toolbar">
      <div className="toolbar-header">
        <button {...getToggleProps()} className="toolbar-toggle">
          <span className="toolbar-toggle-icon">
            {isExpanded ? "▼" : "◀"}
          </span>
          <span className="toolbar-toggle-label">Toolbar</span>
        </button>
      </div>
      <div {...getCollapseProps()} className="toolbar-content flex flex-col absolute right-5 top-5 gap-y-8">
        {props.children}
        <h1>Fill this widget with other toolbar content!</h1>
      </div>
    </div>
  );
}