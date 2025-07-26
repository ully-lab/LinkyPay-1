import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileSpreadsheet, Camera, Upload } from "lucide-react";

interface FileUploadProps {
  type: 'csv' | 'ocr';
  onSuccess?: () => void;
}

export default function FileUpload({ type, onSuccess }: FileUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      
      if (type === 'csv') {
        formData.append('file', files[0]);
        return apiRequest("POST", "/api/upload/csv", formData);
      } else {
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });
        return apiRequest("POST", "/api/upload/ocr", formData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      response.json().then(data => {
        toast({
          title: "Success!",
          description: data.message,
        });
      });
      
      setUploadProgress(0);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Upload failed",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadProgress(25);
      uploadMutation.mutate(files);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadProgress(25);
      uploadMutation.mutate(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const acceptedFiles = type === 'csv' ? '.xlsx,.xls,.csv' : 'image/*';
  const multiple = type === 'ocr';

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {type === 'csv' ? (
          <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500 mb-4" />
        ) : (
          <Camera className="mx-auto h-12 w-12 text-purple-500 mb-4" />
        )}
        
        <p className="text-sm text-gray-600 mb-2">
          {type === 'csv' 
            ? "Drop your Excel or CSV file here"
            : "Upload photos with product information"
          }
        </p>
        
        <p className="text-xs text-gray-500 mb-4">
          {type === 'csv'
            ? "Supports .xlsx, .xls, .csv files with Mandarin content"
            : "OCR will extract text in English and Mandarin"
          }
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFiles}
          multiple={multiple}
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className={type === 'csv' ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadMutation.isPending ? 'Processing...' : 'Choose Files'}
        </Button>
      </div>

      {uploadMutation.isPending && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {type === 'csv' ? 'Processing spreadsheet...' : 'Processing images with OCR...'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
}
