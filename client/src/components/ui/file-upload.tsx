import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';

interface FileUploadProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  onFileChange?: (file: File) => void;
}

export function FileUpload({
  label,
  description,
  value = '',
  onChange,
  onFileChange
}: FileUploadProps) {
  const [isUploadMode, setIsUploadMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileChange) {
      onFileChange(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleMode = () => {
    setIsUploadMode(!isUploadMode);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">{label}</h4>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleMode}
        >
          {isUploadMode ? 'Enter URL' : 'Upload File'}
        </Button>
      </div>

      {isUploadMode ? (
        <div className="space-y-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <Button 
            type="button"
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center border-dashed"
            onClick={triggerFileInput}
          >
            <span className="text-sm">Click to upload</span>
            <span className="text-xs text-muted-foreground">or drag and drop</span>
          </Button>
        </div>
      ) : (
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={handleUrlChange}
        />
      )}
    </div>
  );
} 