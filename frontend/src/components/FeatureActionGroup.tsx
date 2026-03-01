import type { ReactNode } from "react";
import { RnwButton } from "../rnw/components/RnwButton";
import { RnwTagFilterButton } from "../rnw/components/RnwTagFilterButton";

type FeaturePage = "words" | "study" | "examples";

type FeatureAction = {
  key: FeaturePage;
  label: string;
  path: string;
  testID: string;
  iconClassName: string;
};

type FeatureActionGroupProps = {
  currentPage: FeaturePage;
  onNavigate: (path: string) => void;
  prepend?: ReactNode;
  append?: ReactNode;
  testIDs?: Partial<Record<FeaturePage, string>>;
  tagFilter?: {
    visible: boolean;
    activeCount: number;
    onToggle: () => void;
    testID: string;
  };
};

const FEATURE_ACTIONS: readonly FeatureAction[] = [
  {
    key: "words",
    label: "Words",
    path: "/words",
    testID: "rnw-nav-words",
    iconClassName: "fa-solid fa-book",
  },
  {
    key: "study",
    label: "Study",
    path: "/study",
    testID: "rnw-nav-study",
    iconClassName: "fa-solid fa-graduation-cap",
  },
  {
    key: "examples",
    label: "Examples",
    path: "/examples",
    testID: "rnw-nav-examples",
    iconClassName: "fa-solid fa-pen-to-square",
  },
] as const;

export function FeatureActionGroup({
  currentPage,
  onNavigate,
  prepend,
  append,
  testIDs,
  tagFilter,
}: FeatureActionGroupProps) {
  return (
    <>
      {prepend ?? null}

      {FEATURE_ACTIONS.filter((action) => action.key !== currentPage).map((action) => (
        <RnwButton
          key={action.key}
          label={action.label}
          onPress={() => onNavigate(action.path)}
          icon={<i className={action.iconClassName} aria-hidden="true" />}
          testID={testIDs?.[action.key] ?? action.testID}
          kind="outline"
          tone="primary"
        />
      ))}

      {tagFilter?.visible ? (
        <RnwTagFilterButton
          activeCount={tagFilter.activeCount}
          onPress={tagFilter.onToggle}
          testID={tagFilter.testID}
        />
      ) : null}

      {append ?? null}
    </>
  );
}
