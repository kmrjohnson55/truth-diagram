export interface CostWeights {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export interface CostState {
  costMode: boolean;
  costs: CostWeights;
  setCostMode: (on: boolean) => void;
  setCosts: (c: CostWeights) => void;
  setCost: (key: keyof CostWeights, val: number) => void;
  /** Raw subject counts (before cost weighting). Available when costMode is true. */
  subjectValues?: { tp: number; fp: number; fn: number; tn: number };
}

export interface TestToggleState {
  activeTest: "A" | "B";
  setActiveTest: (t: "A" | "B") => void;
  hasTestB: boolean;
}

export interface LessonNavProps {
  totalLessons: number;
  onPrev: () => void;
  onNext: () => void;
  onHome: () => void;
  onGoTo: (lesson: number) => void;
  lessonTitles: string[];
  costState: CostState;
  testToggle?: TestToggleState;
}
