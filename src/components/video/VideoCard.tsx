
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Edit, Trash2, Play } from "lucide-react";
import { Video } from "@/store/videoStore";

interface VideoCardProps {
  video: Video;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPreview,
  onEdit,
  onDelete
}) => {
  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Truncar texto longo
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {/* Thumbnail */}
      <div 
        className="aspect-video relative overflow-hidden cursor-pointer group"
        onClick={onPreview}
      >
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-primary opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="h-12 w-12 text-white" />
        </div>
        
        {/* Badge de categoria */}
        <Badge className="absolute top-2 right-2 capitalize">
          {video.category}
        </Badge>
      </div>
      
      <CardContent className="flex-grow p-4">
        <h3 
          className="text-lg font-medium mb-2 line-clamp-1 cursor-pointer hover:text-primary"
          onClick={onPreview}
        >
          {video.title}
        </h3>
        
        {video.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {truncateText(video.description, 100)}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1 mt-auto">
          {video.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {video.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{video.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-border flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(video.dateUploaded)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{video.views} visualizações</span>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default VideoCard;
