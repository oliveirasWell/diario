"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const TableContainer = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-auto max-h-[min(70dvh,calc(100dvh-11rem))]",
        className,
      )}
      {...props}
    />
  ),
);
TableContainer.displayName = "TableContainer";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom border-separate border-spacing-0 text-sm", className)}
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn(className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("group transition-colors even:bg-muted/25 hover:bg-muted/40", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "sticky top-0 z-20 h-10 border-r border-border/40 bg-muted px-3 text-left align-middle font-normal whitespace-nowrap text-foreground last:border-r-0 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "border-r border-border/40 px-3 py-2 align-middle whitespace-nowrap last:border-r-0 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TablePinHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <TableHead
      data-table-pin
      className={cn(
        "sticky left-0 top-0 z-30 w-40 min-w-40 max-w-40 border-r border-border/50 bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function TablePinCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <TableCell
      className={cn(
        "sticky left-0 z-10 w-40 min-w-40 max-w-40 border-r border-border/50 bg-background group-even:bg-muted/25 group-hover:bg-muted/40",
        className,
      )}
      {...props}
    />
  );
}

export {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TablePinHead,
  TablePinCell,
};
