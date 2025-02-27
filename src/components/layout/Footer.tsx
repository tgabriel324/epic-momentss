
import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-secondary/10 border-t border-border py-4">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-secondary-foreground">
          &copy; {currentYear} Epic Moments - Todos os direitos reservados
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Uma aplicação para gerenciar vídeos e QR codes com visualização em AR
        </p>
      </div>
    </footer>
  );
};

export default Footer;
