import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video, Film, X, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  userId: string;
  mediaType: string | null;
  onMediaUploaded: (url: string, type: string) => void;
  onMediaRemoved: () => void;
  currentMediaUrl?: string;
}

export function MediaUpload({ 
  userId, 
  mediaType, 
  onMediaUploaded, 
  onMediaRemoved,
  currentMediaUrl 
}: MediaUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentMediaUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes: Record<string, string> = {
    image: 'image/*',
    video: 'video/*',
    reel: 'video/*',
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !mediaType) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token =
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token.replace(/^Bearer\s+/i, '').trim()}`;
      }

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        'https://herald-backend-6i3m.onrender.com/api/v1';

      const response = await fetch(`${baseUrl}/media/upload/`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: { url: string; name: string } = await response.json();
      const publicUrl = result.url.startsWith('http')
        ? result.url
        : `${baseUrl.replace('/api/v1', '')}${result.url}`;

      setPreview(publicUrl);
      onMediaUploaded(publicUrl, mediaType);

      toast({
        title: 'Media uploaded',
        description: 'Your media has been uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message ?? 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onMediaRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!mediaType) return null;

  const Icon = mediaType === 'image' ? Image : mediaType === 'reel' ? Film : Video;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes[mediaType]}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          {mediaType === 'image' ? (
            <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
          ) : (
            <video src={preview} controls className="w-full max-h-64" />
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-foreground font-medium">
                Click to upload {mediaType}
              </p>
              <p className="text-xs text-muted-foreground">
                {mediaType === 'image' ? 'JPG, PNG, GIF up to 50MB' : 'MP4, MOV up to 50MB'}
              </p>
              <Button variant="outline" size="sm" className="mt-2 gap-2">
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
