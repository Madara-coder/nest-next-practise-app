'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './button';

/** Disables itself while the surrounding form's Server Action is running. */
export function SubmitButton({
  children,
  pendingText = 'Saving…',
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </Button>
  );
}
