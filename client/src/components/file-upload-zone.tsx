import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

export default function FileUploadZone() {
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  return (
    <div className="mb-8">
      <div
        {...getRootProps()}
        className={`bg-nutrient-card rounded-lg border-2 border-dashed border-slate-600 p-12 text-center hover:border-nutrient-primary transition-colors duration-200 cursor-pointer ${
          isDragActive ? 'drag-over' : ''
        } ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto w-16 h-16 mb-4">
          <Upload className="w-full h-full text-nutrient-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-nutrient-text mb-2">
          {uploadMutation.isPending ? 'Uploading...' : 'Upload BOL Documents'}
        </h3>
        <p className="text-nutrient-text-secondary mb-4">
          {isDragActive 
            ? 'Drop your files here...' 
            : 'Drag and drop your files here, or click to browse'
          }
        </p>
        <p className="text-sm text-nutrient-text-secondary mb-6">
          Supports PDF, JPG, PNG, TIFF formats up to 10MB each
        </p>
        {!uploadMutation.isPending && (
          <Button 
            className="bg-nutrient-primary hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            Select Files
          </Button>
        )}
      </div>
    </div>
  );
}
