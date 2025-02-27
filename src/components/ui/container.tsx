
import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <div 
      className={cn("container mx-auto px-4 py-8", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
