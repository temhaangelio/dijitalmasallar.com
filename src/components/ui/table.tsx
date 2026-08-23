import type { HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function TableWrap({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("w-full overflow-x-auto", className)} {...props} />; }
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) { return <table className={cn("w-full min-w-[720px] border-collapse text-left [&_tbody_tr:last-child_td]:border-b-0", className)} {...props} />; }
export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) { return <th className={cn("border-b border-line px-2 pb-3 text-[13px] font-semibold text-muted", className)} {...props} />; }
export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) { return <td className={cn("border-b border-line px-2 py-3 text-[14px]", className)} {...props} />; }
