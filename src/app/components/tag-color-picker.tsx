import { TAG_COLORS, TAG_COLOR_KEYS } from "@/lib/tags/colors";
import type { TagColorKey } from "@/lib/tags/colors";

type TagColorPickerProps = {
  selectedColor: TagColorKey;
  onSelect: (color: TagColorKey) => void;
};

export function TagColorPicker({
  selectedColor,
  onSelect,
}: TagColorPickerProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {TAG_COLOR_KEYS.map((colorKey) => {
        const palette = TAG_COLORS[colorKey];
        const isSelected = selectedColor === colorKey;
        return (
          <button
            key={colorKey}
            type="button"
            className="w-6 h-6 rounded-full cursor-pointer border border-black/10 transition-shadow duration-150"
            style={{
              background: palette.bg,
              boxShadow: isSelected
                ? `0 0 0 2px white, 0 0 0 4px ${palette.text}`
                : undefined,
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(colorKey)}
            aria-label={colorKey}
          />
        );
      })}
    </div>
  );
}
