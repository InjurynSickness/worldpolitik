import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle@1.1.2";
import { type VariantProps } from "class-variance-authority@0.7.1";
declare const toggleVariants: any;
declare function Toggle({ className, variant, size, ...props }: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>): import("react/jsx-runtime").JSX.Element;
export { Toggle, toggleVariants };
