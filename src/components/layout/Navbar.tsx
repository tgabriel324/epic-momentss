
import React from "react";
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
import { QrCode, Upload, Library, Settings } from "lucide-react";

const Navbar: React.FC = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-8 w-8 text-primary" />
          <Link to="/" className="logo-text">QR Vídeo</Link>
        </div>

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

        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          <span>Configurações</span>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
