import { getSoldOutStatus, type SoldOutStatus } from "./availability";

export interface MenuOptionViewModel {
  option: ItemOption;
  availability: SoldOutStatus;
}

export interface MenuOptionGroupViewModel {
  group: OptionGroup;
  options: MenuOptionViewModel[];
}

export interface MenuItemViewModel {
  item: DemoMenuItem;
  availability: SoldOutStatus;
  optionGroups: MenuOptionGroupViewModel[];
}

// Unresolved references (an optionGroupId/optionId pointing at a deleted doc)
// are silently dropped, not errored.
export function buildMenuItemViewModel(
  item: DemoMenuItem,
  optionGroupsById: Map<string, OptionGroup>,
  optionsById: Map<string, ItemOption>,
  now: Date,
): MenuItemViewModel {
  const optionGroups = (item.optionGroupIds ?? [])
    .map(({ optionGroupId }) => optionGroupsById.get(optionGroupId))
    .filter((group): group is OptionGroup => group != null)
    .map((group) => ({
      group,
      options: (group.optionIds ?? [])
        .map((id) => optionsById.get(id))
        .filter((option): option is ItemOption => option != null)
        .map((option) => ({
          option,
          availability: getSoldOutStatus(option, now),
        })),
    }));

  return {
    item,
    availability: getSoldOutStatus(item, now),
    optionGroups,
  };
}

export function selectionRuleLabel(
  group: Pick<OptionGroup, "minSelection" | "maxSelection">,
): string {
  const { minSelection, maxSelection } = group;
  if (maxSelection <= 1) {
    return minSelection >= 1 ? "Choose 1" : "Optional";
  }
  return minSelection >= 1
    ? `Choose ${minSelection}-${maxSelection}`
    : `Choose up to ${maxSelection}`;
}
