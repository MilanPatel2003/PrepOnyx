import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeadingProps {
  title: string | null;
  description?: string;
  subtitle?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  className?: string;
}

const Heading = ({
  title,
  description,
  subtitle,
  showAddButton = false,
  onAddClick,
  className,
}: HeadingProps) => {
  return (
    <div className={cn("flex flex-col gap-2 sm:gap-3", className)}>
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-muted-foreground/90">
              {subtitle}
            </p>
          )}
        </div>
        {showAddButton && (
          <Button 
            onClick={onAddClick} 
            size="sm" 
            className="transition-all duration-300 hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add New</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground/80 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default Heading;
