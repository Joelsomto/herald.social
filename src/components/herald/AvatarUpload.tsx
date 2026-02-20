import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string | null;
  onAvatarChange: (url: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

export function AvatarUpload({ userId, currentAvatarUrl, displayName, onAvatarChange, size = 'lg' }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to Supabase Storage
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Delete existing avatar if any
      await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting timestamp
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarChange(avatarUrl);
      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload avatar',
        variant: 'destructive',
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative group">
      <Avatar className={`${sizeClasses[size]} border-4 border-background`}>
        <AvatarImage src={previewUrl || currentAvatarUrl || ''} />
        <AvatarFallback className="text-2xl font-display font-bold bg-secondary">
          {displayName?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : previewUrl ? (
        <Button
          size="icon"
          variant="destructive"
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full"
          onClick={cancelPreview}
        >
          <X className="w-3 h-3" />
        </Button>
      ) : (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={triggerFileInput}
        >
          <Camera className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}