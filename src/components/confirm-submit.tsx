"use client";
import { useId, useRef } from "react";
import { Icon } from "./icon";
import { trapDialogFocus } from "./dialog-focus";
import { SubmitButton } from "./submit-button";
/** Keep the existing enclosing server-action form and its validated hidden fields. */
export function ConfirmWithdraw({ course }: { course: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => {
    dialog.current?.close();
    button.current?.focus();
  };
  return (
    <>
      <button
        ref={button}
        type="button"
        className="secondary"
        onClick={() => dialog.current?.showModal()}
      >
        Withdraw
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={id}
        onKeyDown={trapDialogFocus}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="section-heading">
          <h2 id={id}>Withdraw from this course?</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close confirmation"
            onClick={close}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <p>
          Your registration for {course} will be withdrawn. Registration rules
          and deadlines are checked again when you confirm.
        </p>
        <div className="toolbar">
          <button type="button" className="secondary" onClick={close}>
            Keep registration
          </button>
          <SubmitButton
            pendingLabel="Withdrawing…"
            onClick={() => dialog.current?.close()}
          >
            Confirm withdrawal
          </SubmitButton>
        </div>
      </dialog>
    </>
  );
}
