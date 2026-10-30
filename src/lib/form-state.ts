/** Result returned by form Server Actions and read with useActionState. */
export type FormState = {
    /** Message for the whole form (errors or success). */
    message?: string;
    tone?: "error" | "success";
    /** Per-field error messages. */
    errors?: Record<string, string>;
    /** Submitted values to refill the form after a failed submit (never passwords). */
    values?: Record<string, string>;
    /** Extra data for the UI, e.g. a freshly issued invite link. */
    link?: string;
};

export const initialFormState: FormState = {};
