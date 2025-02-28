
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { QrCode, Upload, Library, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-8 w-8 text-primary" />
          <Link to="/" className="logo-text">Epic Moments</Link>
        </div>

        {/* Menu para desktop */}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/upload">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/library">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Library className="mr-2 h-4 w-4" />
                    <span>Biblioteca</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/qrcodes">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <QrCode className="mr-2 h-4 w-4" />
                    <span>QR Codes</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Botão de configurações para desktop */}
        <div className="hidden md:block">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            <span>Configurações</span>
          </Button>
        </div>

        {/* Botão do menu hamburger para mobile */}
        <div className="md:hidden">
          <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="container mx-auto py-2 px-4 flex flex-col space-y-2">
            <Link 
              to="/upload" 
              className="flex items-center p-3 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Upload className="mr-2 h-5 w-5" />
              <span>Upload</span>
            </Link>
            <Link 
              to="/library" 
              className="flex items-center p-3 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Library className="mr-2 h-5 w-5" />
              <span>Biblioteca</span>
            </Link>
            <Link 
              to="/qrcodes" 
              className="flex items-center p-3 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <QrCode className="mr-2 h-5 w-5" />
              <span>QR Codes</span>
            </Link>
            <Link 
              to="/settings" 
              className="flex items-center p-3 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="mr-2 h-5 w-5" />
              <span>Configurações</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
