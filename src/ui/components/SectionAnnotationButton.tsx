import React from "react";
import { useAnnotations } from "./AnnotationContext";

interface Props {
  heading: string;
  sectionIndex: number;
}

export function SectionAnnotationButton({ heading, sectionIndex }: Props) {
  const { annotationMode, activeSection, setActiveSection, getAnnotationsForSection } =
    useAnnotations();

  const sectionAnnotations = getAnnotationsForSection(heading);
  const count = sectionAnnotations.length;
  const isActive = activeSection === heading;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setActiveSection(isActive ? null : heading);
      }}
      className={`ml-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-all ${
        isActive
          ? "bg-indigo-600 text-white"
          : count > 0
            ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30"
            : annotationMode
              ? "text-zinc-500 opacity-100 hover:bg-zinc-800 hover:text-zinc-300"
              : "text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 hover:text-zinc-300"
      }`}
      title="Add annotation"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
      {count > 0 && <span className="font-medium">{count}</span>}
    </button>
  );
}
