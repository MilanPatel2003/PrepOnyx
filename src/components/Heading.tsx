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
    <div className={cn("flex flex-col gap-1 px-4 md:px-6 lg:px-8", className)}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {showAddButton && (
          <Button onClick={onAddClick} size="sm" className="ml-4">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground max-w-4xl">
          {description}
        </p>
      )}
    </div>
  );
};

export default Heading;
