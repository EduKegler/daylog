import { isValidTagColor } from "./colors";
import type { TagColorKey } from "./colors";

export const TAG_NAME_MAX_LENGTH = 30;

type TagInputErrors = {
  name?: string;
  color?: string;
};

type TagValidationSuccess = {
  success: true;
  data: { name: string; color: TagColorKey };
};

type TagValidationFailure = {
  success: false;
  errors: TagInputErrors;
};

export type TagValidationResult = TagValidationSuccess | TagValidationFailure;

export function validateTagInput(input: {
  name: string;
  color: string;
}): TagValidationResult {
  const errors: TagInputErrors = {};

  const trimmedName = input.name.trim().toLowerCase();

  if (trimmedName.length === 0) {
    errors.name = "Tag name is required";
  } else if (trimmedName.length > TAG_NAME_MAX_LENGTH) {
    errors.name = `Tag name must be at most ${TAG_NAME_MAX_LENGTH} characters`;
  }

  if (!isValidTagColor(input.color)) {
    errors.color = "Invalid tag color";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { name: trimmedName, color: input.color as TagColorKey },
  };
}
