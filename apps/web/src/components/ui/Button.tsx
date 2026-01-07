import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'black' | 'muted';
  children: ReactNode;
  icon?: ElementType;
  iconSize?: number;
}

export default function Button({
  variant = 'green',
  className = '',
  children,
  icon: Icon,
  iconSize,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-bold rounded-lg transition hover:scale-105 active:scale-95 flex items-center justify-center select-none cursor-pointer';

  const variantStyles = {
    green: 'bg-green-05 text-base-primary',
    black: 'bg-black text-white',
    muted: 'bg-base-muted text-base-primary',
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {Icon && <Icon size={iconSize} />}
      {children}
    </button>
  );
}
