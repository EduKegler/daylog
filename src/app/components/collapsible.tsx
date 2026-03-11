"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/cn";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

function CollapsibleContent({
  children,
  className,
  ...props
}: CollapsiblePrimitive.CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        "overflow-hidden data-[state=open]:animate-collapsible-open data-[state=closed]:animate-collapsible-close",
        className
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Content>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
