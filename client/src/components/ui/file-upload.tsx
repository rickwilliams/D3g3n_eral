import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  onFileChange?: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  label,
  description,
  value = '',
  onChange,
  onFileChange,
  accept,
  maxSizeMB = 3
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set preview URL when value changes
  useEffect(() => {
    if (value && value.startsWith('blob:')) {
      setPreviewUrl(value);
    } else if (value && value.startsWith('http')) {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    
    if (file) {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }

      // Create URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onChange(objectUrl);
      
      if (onFileChange) {
        onFileChange(file);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-medium">{label}</h4>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      <div className="space-y-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          accept={accept}
        />
        
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-contain rounded-md border" 
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-background/80"
              onClick={() => {
                setPreviewUrl(null);
                onChange('');
              }}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button 
            type="button"
            variant="outline"
            className="w-full h-32 flex flex-col items-center justify-center border-dashed"
            onClick={triggerFileInput}
          >
            <span className="text-sm">Click to upload</span>
            <span className="text-xs text-muted-foreground">Max. {maxSizeMB}MB</span>
          </Button>
        )}

        {error && (
          <div className="text-destructive text-sm flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
} 