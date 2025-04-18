import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ComingSoon: React.FC<{ featureName?: string }> = ({ featureName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
        <AlertTriangle className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-2">
        {featureName ? `${featureName} Coming Soon!` : 'Coming Soon!'}
      </h1>
      <p className="text-lg text-muted-foreground mb-4">
        We are working hard to bring this feature to you. Stay tuned for updates!
      </p>
      <span className="inline-block px-4 py-2 bg-primary/5 rounded-full text-primary font-medium">
        {featureName || 'This feature'} is under development
      </span>
    </div>
  );
};

export default ComingSoon;
