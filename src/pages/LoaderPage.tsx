import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const LoaderPage = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50",
        className
      )}
    >
      {/* Logo Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8"
      >
        <img 
          src="/assets/img/PrepOnyx_New_Logo.svg" 
          alt="PrepOnyx" 
          className="h-16 w-auto"
        />
      </motion.div>

      {/* Loading Animation */}
      <div className="relative">
        <motion.div
          className="h-20 w-20 rounded-full border-4 border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 h-20 w-20 rounded-full border-4 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear",
            delay: 0.2 
          }}
        />
      </div>

      {/* Loading Text */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-6 text-lg font-medium text-muted-foreground"
      >
        Loading...
      </motion.p>

      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>
    </div>
  );
};