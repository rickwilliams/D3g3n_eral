import * as React from "react";
import { Upload, X, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

interface FileUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  previewHeight?: number;
  label?: string;
  description?: string;
  error?: string;
}

export function FileUpload({
  value,
  onChange,
  onFileChange,
  className,
  accept = "image/*",
  maxSize = 5, // 5MB default
  previewHeight = 200,
  label,
  description,
  error,
  ...props
}: FileUploadProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>) {
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [dragActive, setDragActive] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState(value || "");
  const [tab, setTab] = React.useState<"upload" | "url">("upload");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update preview when value changes externally
  React.useEffect(() => {
    if (value) {
      setPreview(value);
      setUrlInput(value);
    } else {
      setPreview(null);
      setUrlInput("");
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleFile = (file: File | null) => {
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Create local URL for preview
    const fileUrl = URL.createObjectURL(file);
    setPreview(fileUrl);
    onChange(fileUrl);
    if (onFileChange) onFileChange(file);
    
    // Reset input value to allow uploading the same file again
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      setPreview(urlInput);
      onChange(urlInput);
      if (onFileChange) onFileChange(null);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setUrlInput("");
    onChange("");
    if (onFileChange) onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const renderUploadTab = () => (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-md transition-all",
        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20",
        className
      )}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      {...props}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <Upload className="w-10 h-10 mb-2 text-muted-foreground" />
      <p className="mb-2 text-sm font-medium">Drag & drop or click to upload</p>
      <p className="text-xs text-muted-foreground">
        {accept === "image/*" ? "Supported formats: JPEG, PNG, GIF, etc." : accept} (Max {maxSize}MB)
      </p>
    </div>
  );

  const renderUrlTab = () => (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex gap-2">
        <Input
          placeholder="Enter image URL..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="flex-1"
        />
        <Button type="button" onClick={handleUrlSubmit}>
          <Link className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Enter the URL of an image hosted online
      </p>
    </div>
  );

  return (
    <FormItem className="space-y-2">
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(value) => setTab(value as "upload" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link className="mr-2 h-4 w-4" />
                URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              {renderUploadTab()}
            </TabsContent>
            <TabsContent value="url">
              {renderUrlTab()}
            </TabsContent>
          </Tabs>

          {preview && (
            <div className="relative">
              <div className="overflow-hidden rounded-md border">
                <img
                  src={preview}
                  alt="Preview"
                  className="object-cover w-full h-auto"
                  style={{ maxHeight: previewHeight }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/elizaos-icon.png";
                  }}
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
} 