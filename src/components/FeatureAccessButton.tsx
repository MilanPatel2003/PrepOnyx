import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, ButtonProps } from "@/components/ui/button";
import { Feature, useFeatureAccess } from "@/utils/featureAccess";
import { toast } from "sonner";
import { AlertCircle, ArrowRight } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeatureAccessButtonProps extends ButtonProps {
  feature: Feature;
  route: string;
  children: React.ReactNode;
  showLimits?: boolean;
}

export default function FeatureAccessButton({
  feature,
  route,
  children,
  showLimits = false,
  ...props
}: FeatureAccessButtonProps) {
  const navigate = useNavigate();
  const accessInfo = useFeatureAccess(feature);
  const { canAccess, loading } = accessInfo;
  const message = 'message' in accessInfo ? accessInfo.message : undefined;
  const upgradeRequired = 'upgradeRequired' in accessInfo ? accessInfo.upgradeRequired : false;
  const usage = 'usage' in accessInfo ? accessInfo.usage : 0;
  const limit = 'limit' in accessInfo ? accessInfo.limit : 0;
  const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false);

  // Handle button click
  const handleClick = () => {
    if (loading) {
      toast.loading("Checking access...");
      return;
    }

    if (canAccess) {
      if (message) {
        toast.warning(message);
      }
      navigate(route);
    } else {
      if (upgradeRequired) {
        setShowUpgradeDialog(true);
      } else if (message) {
        toast.error(message);
      }
    }
  };

  return (
    <>
      <Button 
        onClick={handleClick} 
        disabled={loading}
        {...props}
      >
        {children}
        {showLimits && typeof limit === "number" && (
          <span className="ml-2 text-xs opacity-70">
            ({usage}/{limit})
          </span>
        )}
      </Button>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Feature Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've reached your monthly limit for this feature on your current plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">
              {message || `You've used all your ${feature} credits for this month.`}
            </p>
            <p className="text-sm text-muted-foreground">
              Upgrade your plan to get more access to this feature and other benefits.
            </p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
            >
              Maybe Later
            </Button>
            <Button 
              onClick={() => navigate("/pricing")}
              className="gap-1"
            >
              View Plans <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
