import React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

export const buttonStyles = cva(
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium shadow-soft transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand.primary text-white hover:shadow-glass',
        outline: 'border border-border bg-surface text-textc hover:bg-surface-muted',
        ghost: 'hover:bg-surface-muted'
      },
      size: { sm: 'h-9', md: 'h-10', lg: 'h-12 text-base' }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonStyles({ variant, size }), className)}
      {...props}
    />
  )
);

Button.displayName = 'Button';
