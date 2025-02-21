import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Image, Upload } from "lucide-react";

/**
 * Dropzone Component
 * Handles drag & drop or click file uploads with preview
 * 
 * Features:
 * - Drag & drop interface
 * - Click to upload alternative
 * - Image preview
 * - Visual feedback during drag
 * - Hover effects on preview
 */

interface DropzoneProps {
    /** Callback when a file is selected */
    onFileSelect: (file: File) => void;
    /** Current preview URL */
    value?: string;
    /** Additional className for styling */
    className?: string;
}

export function Dropzone({ onFileSelect, value, className }: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            const imageFile = files.find(file => file.type.startsWith('image/'));
            if (imageFile) {
                onFileSelect(imageFile);
            }
        },
        [onFileSelect]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.preventDefault();
            if (e.target.files?.[0]) {
                onFileSelect(e.target.files[0]);
            }
        },
        [onFileSelect]
    );

    return (
        <div
            className={cn(
                "relative group rounded-lg border border-dashed p-6 transition-all",
                isDragging && "border-primary bg-primary/5",
                className
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
                accept="image/*"
            />
            
            {value ? (
                <div className="aspect-square w-full relative group rounded-lg overflow-hidden">
                    <img 
                        src={value} 
                        alt="Avatar preview"
                        className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6" />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Image className="w-8 h-8" />
                    <p className="text-sm">Drag & drop or click to upload</p>
                </div>
            )}
        </div>
    );
} 