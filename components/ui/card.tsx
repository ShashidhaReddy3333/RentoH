import clsx from "clsx";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type CardProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Card<T extends ElementType = "div">({
  as,
  className,
  children,
  ...props
}: CardProps<T>) {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={clsx(
        "group/card rounded-xl border border-outline/60 bg-white shadow-sm transition-shadow duration-300 ease-out hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type SectionProps = {
  className?: string;
  children: ReactNode;
};

export function CardHeader({ className, children }: SectionProps) {
  return (
    <div className={clsx("flex flex-col gap-1 border-b border-outline/40 px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: SectionProps) {
  return <div className={clsx("px-6 py-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: SectionProps) {
  return (
    <div className={clsx("flex items-center gap-3 border-t border-outline/40 px-6 py-4", className)}>
      {children}
    </div>
  );
}
