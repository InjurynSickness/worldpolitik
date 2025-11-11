import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { type ControllerProps, type FieldError, type FieldErrors, type FieldPath, type FieldValues, FormProvider } from "react-hook-form";
declare function Form<TFieldValues extends FieldValues = FieldValues, TContext = any>({ ...props }: React.ComponentProps<typeof FormProvider<TFieldValues, TContext>>): import("react/jsx-runtime").JSX.Element;
declare function FormField<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>): import("react/jsx-runtime").JSX.Element;
declare function useFormField(): {
    error: FieldError | undefined;
    errors: FieldErrors | undefined;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
    invalid: boolean;
    id: string;
    name: string;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
};
declare function FormItem({ className, ...props }: React.ComponentProps<"div"> & {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
declare function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root> & {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
declare function FormControl({ ...props }: React.ComponentProps<typeof Slot> & {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
declare function FormDescription({ className, ...props }: React.ComponentProps<"p"> & {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
declare function FormMessage({ className, children, ...props }: React.ComponentProps<"p"> & {
    className?: string;
}): import("react/jsx-runtime").JSX.Element | null;
export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, };
