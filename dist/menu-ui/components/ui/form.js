"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Controller, FormProvider, useFormContext, } from "react-hook-form";
import { cn } from "./utils";
import { Label } from "./label";
function Form({ ...props }) {
    return _jsx(FormProvider, { ...props });
}
const FormFieldContext = React.createContext({});
function FormField({ ...props }) {
    const form = useFormContext();
    const fieldState = form.getFieldState(props.name);
    const id = React.useId();
    const formItemId = `${id}-form-item`;
    const formDescriptionId = `${id}-form-item-description`;
    const formMessageId = `${id}-form-item-message`;
    return (_jsx(FormFieldContext.Provider, { value: {
            name: props.name,
            formItemId,
            formDescriptionId,
            formMessageId,
            ...fieldState,
        }, children: _jsx(Controller, { ...props }) }));
}
function useFormField() {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    const { getFieldState, formState } = useFormContext();
    const fieldState = getFieldState(fieldContext.name);
    if (!fieldContext) {
        throw new Error("useFormField should be used within <FormField>");
    }
    const { id } = itemContext;
    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
        error: fieldState.error,
        errors: formState.errors,
        isDirty: fieldState.isDirty,
        isTouched: fieldState.isTouched,
        isValidating: fieldState.isValidating,
    };
}
const FormItemContext = React.createContext({});
function FormItem({ className, ...props }) {
    const id = React.useId();
    return (_jsx(FormItemContext.Provider, { value: { id }, children: _jsx("div", { "data-slot": "form-item", className: cn("grid gap-2", className), ...props }) }));
}
function FormLabel({ className, ...props }) {
    const { error, formItemId } = useFormField();
    return (_jsx(Label, { "data-slot": "form-label", className: cn(error && "text-destructive", className), htmlFor: formItemId, ...props }));
}
function FormControl({ ...props }) {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
    return (_jsx(Slot, { "data-slot": "form-control", id: formItemId, "aria-describedby": !error
            ? `${formDescriptionId}`
            : `${formDescriptionId} ${formMessageId}`, "aria-invalid": !!error, ...props }));
}
function FormDescription({ className, ...props }) {
    const { formDescriptionId } = useFormField();
    return (_jsx("p", { "data-slot": "form-description", id: formDescriptionId, className: cn("text-muted-foreground text-sm", className), ...props }));
}
function FormMessage({ className, children, ...props }) {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;
    if (!body) {
        return null;
    }
    return (_jsx("p", { "data-slot": "form-message", id: formMessageId, className: cn("text-destructive text-sm font-medium", className), ...props, children: body }));
}
export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, };
//# sourceMappingURL=form.js.map