import type { ReactNode } from "react";
import { RnwButton } from "../rnw/components/RnwButton";
import { RnwTagFilterButton } from "../rnw/components/RnwTagFilterButton";
import { RnwActionBar } from "@leximemory/ui";

export type FeatureRoute = "words" | "study" | "examples";

type NavigationAction = {
  target: FeatureRoute;
  label: string;
  iconClass: string;
  testID: string;
};

type TagFilterState = {
  allTagCount: number;
  activeCount: number;
  onToggle: () => void;
  testID: string;
};

type CrossFeatureActionBarProps = {
  current: FeatureRoute;
  onNavigate: (target: FeatureRoute) => void;
  trailing?: ReactNode;
  tagFilter?: TagFilterState;
  extraLeading?: ReactNode;
  testID: string;
};

const navigationCatalog: Record<FeatureRoute, NavigationAction[]> = {
  words: [
    {
      target: "study",
      label: "Study",
      iconClass: "fa-solid fa-graduation-cap",
      testID: "rnw-study-button",
    },
    {
      target: "examples",
      label: "Examples",
      iconClass: "fa-solid fa-pen-to-square",
      testID: "rnw-examples-button",
    },
  ],
  study: [
    {
      target: "words",
      label: "Words",
      iconClass: "fa-solid fa-book",
      testID: "rnw-study-words",
    },
    {
      target: "examples",
      label: "Examples",
      iconClass: "fa-solid fa-pen-to-square",
      testID: "rnw-study-examples",
    },
  ],
  examples: [
    {
      target: "words",
      label: "Words",
      iconClass: "fa-solid fa-book",
      testID: "rnw-examples-words",
    },
    {
      target: "study",
      label: "Study",
      iconClass: "fa-solid fa-graduation-cap",
      testID: "rnw-examples-study",
    },
  ],
};

export function CrossFeatureActionBar({
  current,
  onNavigate,
  trailing,
  tagFilter,
  extraLeading,
  testID,
}: CrossFeatureActionBarProps) {
  const actions = navigationCatalog[current];

  return (
    <RnwActionBar
      leading={
        <>
          {actions.map((action) => (
            <RnwButton
              key={action.target}
              label={action.label}
              onPress={() => onNavigate(action.target)}
              icon={<i className={action.iconClass} aria-hidden="true" />}
              testID={action.testID}
              kind="outline"
              tone="primary"
            />
          ))}

          {tagFilter && tagFilter.allTagCount > 0 ? (
            <RnwTagFilterButton
              activeCount={tagFilter.activeCount}
              onPress={tagFilter.onToggle}
              testID={tagFilter.testID}
            />
          ) : null}

          {extraLeading ?? null}
        </>
      }
      trailing={trailing}
      testID={testID}
    />
  );
}
