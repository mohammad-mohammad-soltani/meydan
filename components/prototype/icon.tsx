import * as Lucide from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

type IconProps = LucideProps & { name: string };

const toComponentName = (name: string) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = (Lucide as unknown as Record<string, ComponentType<LucideProps>>)[toComponentName(name)];
  return IconComponent ? <IconComponent {...props} /> : <span aria-hidden="true" className={props.className} />;
}
