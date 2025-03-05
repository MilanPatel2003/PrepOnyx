import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface FeatureHeaderProps {
  title: string
  description: string
  icon: React.ReactNode
  badge?: string
  usageSteps?: string[]
  className?: string
  showAddButton?: boolean
  onAddClick?: () => void
}

export const FeatureHeader = ({
  title,
  description,
  icon,
  badge,
  usageSteps,
  className,
  showAddButton,
  onAddClick
}: FeatureHeaderProps) => {
  return (
    <div className={cn("relative", className)}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="relative space-y-6">
        {/* Main header section */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 p-6 bg-background/95 backdrop-blur rounded-lg border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/10">
              {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6 text-primary" })}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {title}
                </h1>
                {badge && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {badge}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                {description}
              </p>
            </div>
          </div>
          
          {showAddButton && (
            <Button 
              onClick={onAddClick}
              className="shrink-0 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>

        {/* Usage steps section */}
        {usageSteps && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {usageSteps.map((step, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border bg-background/50 backdrop-blur hover:bg-secondary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}