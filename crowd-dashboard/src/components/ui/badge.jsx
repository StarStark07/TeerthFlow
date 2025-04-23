import React from "react";
import clsx from "clsx";

export const Badge = ({ children, className = "" }) => {
return (
    <span
    className={clsx(
        "inline-block px-3 py-1 text-sm font-medium rounded-full",
        className
    )}
    >
    {children}
    </span>
);
};
