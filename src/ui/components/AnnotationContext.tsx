import React, { createContext, useContext, useState, useCallback } from "react";
import { Annotation, AnnotationType } from "../../shared/annotations";

interface AnnotationContextValue {
  annotations: Annotation[];
  annotationMode: boolean;
  activeSection: string | null;
  setAnnotationMode: (on: boolean) => void;
  setActiveSection: (section: string | null) => void;
  addAnnotation: (annotation: Omit<Annotation, "id" | "createdAt">) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  clearAnnotations: () => void;
  getAnnotationsForSection: (heading: string) => Annotation[];
}

const AnnotationCtx = createContext<AnnotationContextValue | null>(null);

export function useAnnotations() {
  const ctx = useContext(AnnotationCtx);
  if (!ctx) throw new Error("useAnnotations must be used within AnnotationProvider");
  return ctx;
}

let idCounter = 0;

export function AnnotationProvider({ children }: { children: React.ReactNode }) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const addAnnotation = useCallback((a: Omit<Annotation, "id" | "createdAt">) => {
    const newAnnotation: Annotation = {
      ...a,
      id: `ann-${++idCounter}-${Date.now()}`,
      createdAt: Date.now(),
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
    setActiveSection(null);
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
  }, []);

  const getAnnotationsForSection = useCallback(
    (heading: string) => annotations.filter((a) => a.sectionHeading === heading),
    [annotations]
  );

  return (
    <AnnotationCtx.Provider
      value={{
        annotations,
        annotationMode,
        activeSection,
        setAnnotationMode,
        setActiveSection,
        addAnnotation,
        removeAnnotation,
        updateAnnotation,
        clearAnnotations,
        getAnnotationsForSection,
      }}
    >
      {children}
    </AnnotationCtx.Provider>
  );
}
