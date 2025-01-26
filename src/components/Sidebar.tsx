import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  Brain,
  FileText,
  MessageSquare,
  School,
  Menu,
  X,
  BookOpen,
  User,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
  {
    title: "Math Notes",
    icon: Brain,
    href: "/dashboard/math-notes",
    color: "text-blue-500",
  },
  {
    title: "Mock Interview",
    icon: MessageSquare,
    href: "/dashboard/mock-interview",
    color: "text-violet-500",
  },
  {
    title: "PDF Analyzer",
    icon: FileText,
    href: "/dashboard/pdf-analyzer",
    color: "text-orange-500",
  },
  {
    title: "Course Generator",
    icon: School,
    href: "/dashboard/course-generator",
    color: "text-green-500",
  },
  {
    title: "Flashcards",
    icon: BookOpen,
    href: "/dashboard/flashcards",
    color: "text-pink-500",
  },
  {
    title: "Profile",
    icon: User,
    href: "/dashboard/profile",
    color: "text-gray-500",
  },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className={cn(
              "fixed top-0 left-0 h-full bg-background border-r z-40",
              "w-64 md:w-72 overflow-y-auto",
              "md:static md:translate-x-0",
              "transition-transform duration-300 ease-in-out"
            )}
          >
            {/* Logo */}
            <div className="p-6">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="/assets/img/PrepOnyx_logo.png"
                  alt="PrepOnyx"
                  className="h-8 w-auto"
                />
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  PrepOnyx
                </span>
              </Link>
            </div>

            {/* Navigation Items */}
            <nav className="px-4 pb-4">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg mb-1",
                    "transition-colors duration-200",
                    "hover:bg-accent/50",
                    location.pathname === item.href
                      ? "bg-accent/50 text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", item.color)} />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 