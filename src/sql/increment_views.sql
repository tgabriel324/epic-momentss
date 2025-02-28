
-- Esta função será executada para incrementar as visualizações de um vídeo
CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE videos
  SET views = views + 1
  WHERE id = video_id;
END;
$$;
