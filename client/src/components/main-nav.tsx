import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { LogOut, Menu, BookOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function MainNav() {
  const { logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/study">
        <a className="text-sm font-medium transition-colors hover:text-primary">
          Study
        </a>
      </Link>
      <Link href="/guide">
        <a className="text-sm font-medium transition-colors hover:text-primary">
          Guide
        </a>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="text-sm font-medium transition-colors hover:text-primary"
        onClick={() => logoutMutation.mutate()}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </>
  );

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/">
          <a className="font-bold text-xl md:text-2xl mr-4 md:mr-6 flex items-center gap-2 md:gap-3">
            <img 
              src="/images/logo.jpg" 
              alt="TOEFL Prep Logo" 
              className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover border-2 border-primary/20"
            />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              TOEFL Study
            </span>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          <NavLinks />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden ml-auto">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[200px] sm:w-[300px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}