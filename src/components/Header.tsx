import { Button } from "@/components/ui/button";
import { UserButton, useAuth } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

const dashboardItems = [
  { label: "Skribble AI", href: "/dashboard/skribbleAI" },
  { label: "Mock Interview", href: "/dashboard/mock-interview" },
  { label: "PDF Analyzer", href: "/dashboard/pdf-analyzer" },
  { label: "Course Generator", href: "/dashboard/course-generator" },
  { label: "Flashcards", href: "/dashboard/flashcards" },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo Section */}
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/img/PrepOnyx_New_Logo.svg"
              alt="PrepOnyx"
              className="h-14 w-auto"
            />
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {/* Public Nav Items */}
          <motion.div
            className="flex items-center gap-1 pr-4 mr-4 border-r"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {publicNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>

          {/* Dashboard Nav Items - Only show if signed in */}
          {isSignedIn && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {dashboardItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    location.pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </motion.div>
          )}
        </nav>

        {/* Auth Buttons / User Menu */}
        <motion.div
          className="hidden md:flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              theme === "dark"
                ? "hover:bg-accent/20 hover:shadow-[0_0_10px_theme(colors.accent.DEFAULT/30)]"
                : "hover:bg-accent/10 hover:shadow-[0_0_10px_theme(colors.accent.DEFAULT/20)]"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-primary" />
            )}
          </motion.button>

          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                asChild
              >
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          className="lg:hidden p-2 rounded-full hover:bg-accent/10 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden border-b bg-background"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="container py-4">
              <motion.div
                className="flex flex-col space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
              >
                {/* Public Nav Items */}
                {publicNavItems.map((item) => (
                  <motion.div
                    key={item.label}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        location.pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Divider */}
                {isSignedIn && (
                  <motion.div
                    className="h-px bg-border my-2"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  />
                )}

                {/* Dashboard Nav Items - Only show if signed in */}
                {isSignedIn &&
                  dashboardItems.map((item) => (
                    <motion.div
                      key={item.label}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 },
                      }}
                    >
                      <Link
                        to={item.href}
                        className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          location.pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}

                {/* Add Theme Toggle to Mobile Menu */}
                <motion.div
                  className="h-px bg-border my-2"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                  }}
                >
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-5 w-5 text-yellow-400 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-5 w-5 text-primary mr-2" />
                        Dark Mode
                      </>
                    )}
                  </button>
                </motion.div>

                {/* Mobile Auth Buttons */}
                {!isSignedIn && (
                  <>
                    <motion.div
                      className="h-px bg-border my-2"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 },
                      }}
                    >
                      <Link
                        to="/signin"
                        className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    </motion.div>
                    <motion.div
                      className="h-px bg-border my-2"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 },
                      }}
                    >
                      <Link
                        to="/signup"
                        className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;