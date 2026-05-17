import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  titleBadge?: React.ReactNode;
}

export function PageHeader({ title, description, children, titleBadge }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-[#1e1e1e]">{title}</h2>
          {titleBadge}
        </div>
        {description && (
          <div className="text-[#757575] text-sm mt-1.5 font-medium">
            {description}
          </div>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
