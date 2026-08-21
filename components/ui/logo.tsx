import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-foreground leading-none">
            OKUL BENİM
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase mt-0.5">
            Yönetim Paneli
          </span>
        </div>
      )}
    </div>
  );
}
