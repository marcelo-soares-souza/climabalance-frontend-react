import { TreePine } from 'lucide-react';

interface AreaThumbnailProps {
  imageUrl?: string;
  thumbnailUrl?: string;
  name: string;
}

export function AreaThumbnail({ imageUrl, thumbnailUrl, name }: AreaThumbnailProps) {
  const src = imageUrl || thumbnailUrl;

  if (src) {
    return (
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="relative h-40 w-full bg-primary-50 flex items-center justify-center">
      <TreePine className="h-10 w-10 text-primary/40" />
    </div>
  );
}