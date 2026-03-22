export enum AnnotationType {
  COMMENT = "comment",
  NEEDS_UPDATE = "needs_update",
  DELETION = "deletion",
  GLOBAL = "global",
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  sectionHeading: string;
  sectionIndex: number;
  selectedText?: string;
  comment: string;
  documentPath: string;
  createdAt: number;
}

export interface AnnotationPayload {
  documentName: string;
  documentPath: string;
  annotations: Annotation[];
  globalFeedback?: string;
  timestamp: string;
}
