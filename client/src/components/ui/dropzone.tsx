import React from 'react';
import { cn } from '@/lib/utils';

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onDrop?: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  ({ className, onDrop, accept, multiple, disabled, children, ...props }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      
      if (disabled || !onDrop) return;
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onDrop(files);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          isDragOver && 'drag-over',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Dropzone.displayName = 'Dropzone';

export { Dropzone };
