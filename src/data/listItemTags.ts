import type {
  TagChipColorToken,
  TagColorToken,
  TagDefinition,
  TagId,
} from "@/types/listItem";

export const LIST_ITEM_TAGS: TagDefinition[] = [
  {
    id: "tagA",
    displayName: "集章",
    icon: "tag-bonus",
    color: "green-300",
    chipColor: "green-400",
  },
  {
    id: "tagB",
    displayName: "新品",
    icon: "tag-new-item",
    color: "cyan-300",
    chipColor: "cyan-400",
  },
  {
    id: "tagC",
    displayName: "主題連攤",
    icon: "tag-limited",
    color: "rose-300",
    chipColor: "rose-400",
  },
  {
    id: "tagD",
    displayName: "量少",
    icon: "warning",
    color: "violet-300",
    chipColor: "violet-400",
  },
  {
    id: "tagE",
    displayName: "優先",
    icon: "tag-high-priority",
    color: "amber-300",
    chipColor: "amber-400",
  },
];

const TAG_BADGE_TONE_CLASS_MAP: Record<TagColorToken, string> = {
  "rose-300": "border-rose-300 text-rose-400",
  "cyan-300": "border-cyan-300 text-cyan-400",
  "amber-300": "border-amber-300 text-amber-400",
  "violet-300": "border-violet-300 text-violet-400",
  "emerald-300": "border-emerald-300 text-emerald-400",
  "green-300": "border-green-400 text-green-500",
};

const TAG_CHIP_TONE_CLASS_MAP: Record<TagChipColorToken, string> = {
  "rose-400": "border-rose-300 bg-rose-400/85",
  "cyan-400": "border-cyan-300 bg-cyan-400/85",
  "amber-400": "border-amber-300 bg-amber-400/85",
  "violet-400": "border-violet-300 bg-violet-400/85",
  "green-400": "border-green-400 bg-green-500/85",
};

export const LIST_ITEM_TAG_MAP: Record<TagId, TagDefinition> =
  LIST_ITEM_TAGS.reduce(
    (acc, tag) => {
      acc[tag.id] = tag;
      return acc;
    },
    {} as Record<TagId, TagDefinition>,
  );

export function isTagId(value: unknown): value is TagId {
  return (
    typeof value === "string" && LIST_ITEM_TAGS.some((tag) => tag.id === value)
  );
}

export function getTagByDisplayName(
  displayName: string,
): TagDefinition | undefined {
  return LIST_ITEM_TAGS.find((tag) => tag.displayName === displayName);
}

export function normalizeTagFromInput(value: unknown): TagId | null {
  if (isTagId(value)) return value;
  if (typeof value !== "string") return null;
  return getTagByDisplayName(value)?.id ?? null;
}

export function getTagBadgeToneClass(tag: TagDefinition): string {
  return TAG_BADGE_TONE_CLASS_MAP[tag.color];
}

export function getTagChipToneClass(tag: TagDefinition): string {
  return TAG_CHIP_TONE_CLASS_MAP[tag.chipColor];
}
