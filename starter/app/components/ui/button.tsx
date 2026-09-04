import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
}

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' && 'border border-border bg-background hover:bg-muted',
        variant === 'ghost' && 'hover:bg-muted',
        variant === 'link' && 'text-primary underline-offset-4 hover:underline',
        size === 'default' && 'h-9 px-4',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'lg' && 'h-10 px-6',
        className,
      )}
      {...props}
    />
  )
}
