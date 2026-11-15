import type { ComponentProps } from "react";
import { Utensils } from "lucide-react";

import { cn } from "cn";

export const ImageBox = ({
  img,
  alt,
  className,
  ...props
}: ComponentProps<"div"> & { img?: string; alt: string }) => (
  <div
    className={cn("size-12 shrink-0 overflow-hidden border bg-accent", className)}
    {...props}
  >
    {img ? (
      <img
        src={img}
        alt={alt}
        loading="lazy"
        className="size-full object-cover"
      />
    ) : (
      <div className="size-full flex items-center justify-center text-muted-foreground">
        <Utensils className="size-[40%]" aria-hidden />
      </div>
    )}
  </div>
);
