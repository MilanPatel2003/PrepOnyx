import { Button } from "@/components/ui/button";
import { UserButton, useAuth } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { Menu,Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
];

const dashboardItems = [
  { label: "Skribble AI", href: "/dashboard/skribbleAI" },
  { label: "Mock Interview", href: "/dashboard/mock-interview" },
  { label: "PDF Analyzer", href: "/dashboard/pdf-analyzer" },
  { label: "Course Generator", href: "/dashboard/course-generator" },
  { label: "Flashcards", href: "/dashboard/flashcards" },
];

const Header = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/assets/img/PrepOnyx_New_Logo.svg"
            alt="PrepOnyx"
            className="h-10 w-auto md:h-12"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {publicNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}

          {isSignedIn && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Link
                to="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                )}
              >
                Dashboard
              </Link>
              {dashboardItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === item.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Button - Always visible when signed in */}
          {isSignedIn && (
            <div className="relative">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                    userButtonPopoverCard: "z-[1000]"
                  }
                }}
              />
            </div>
          )}

          {/* Sign In Button - Only shown when not signed in */}
          {!isSignedIn && (
            <Button asChild variant="outline">
              <Link to="/signin">Sign In</Link>
            </Button>
          )}

          {/* Mobile Sidebar Trigger */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <div className="flex flex-col h-full">
                {/* Mobile Navigation */}
                <nav className="flex-1 py-6">
                  <div className="space-y-1">
                    {publicNavItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className={cn(
                          "block px-4 py-2 text-sm font-medium rounded-md",
                          "hover:bg-accent hover:text-accent-foreground",
                          location.pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}

                    {isSignedIn && (
                      <>
                        <Separator className="my-2" />
                        <Link
                          to="/dashboard"
                          className={cn(
                            "block px-4 py-2 text-sm font-medium rounded-md",
                            "hover:bg-accent hover:text-accent-foreground",
                            location.pathname === "/dashboard"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          Dashboard
                        </Link>
                        {dashboardItems.map((item) => (
                          <Link
                            key={item.label}
                            to={item.href}
                            className={cn(
                              "block px-4 py-2 text-sm font-medium rounded-md",
                              "hover:bg-accent hover:text-accent-foreground",
                              location.pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </nav>

                {/* Bottom Section */}
                <div className="mt-auto space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </Button>

                  {!isSignedIn && (
                    <Button asChild className="w-full">
                      <Link to="/signin">Sign In</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;