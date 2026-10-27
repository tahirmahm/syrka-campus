"use client";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Icon } from "./icon";
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  disabled,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...props}
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Icon name="clock" size={15} />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
