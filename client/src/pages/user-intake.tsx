import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Users, FileSpreadsheet, Camera, Plus, Mail, Phone, Building2 } from "lucide-react";
import { SystemUser } from "@shared/schema";

export default function UserIntake() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});

  const { data: users = [], isLoading } = useQuery<SystemUser[]>({
    queryKey: ["/api/system-users"],
  });

  const uploadCsvMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest("POST", "/api/users/upload-csv", formData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "CSV Upload Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest("POST", "/api/users/upload-photo", formData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Photo Processing Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process photo",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent, uploadType: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive({ ...dragActive, [uploadType]: true });
    } else if (e.type === "dragleave") {
      setDragActive({ ...dragActive, [uploadType]: false });
    }
  };

  const handleDrop = (e: React.DragEvent, uploadType: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ ...dragActive, [uploadType]: false });

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (uploadType === 'csv') {
        uploadCsvMutation.mutate(file);
      } else if (uploadType === 'photo') {
        uploadPhotoMutation.mutate(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, uploadType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (uploadType === 'csv') {
        uploadCsvMutation.mutate(file);
      } else if (uploadType === 'photo') {
        uploadPhotoMutation.mutate(file);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Intake</h1>
          <p className="text-gray-600">Import customers via Excel/CSV files or handwritten photos</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          <Users className="h-4 w-4 mr-2" />
          {users.length} Customers
        </Badge>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Customers</TabsTrigger>
          <TabsTrigger value="manage">Manage Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV/Excel Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <CardTitle>Excel/CSV Upload</CardTitle>
                </div>
                <CardDescription>
                  Upload customer lists from Excel or CSV files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive.csv
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                  onDragEnter={(e) => handleDrag(e, 'csv')}
                  onDragLeave={(e) => handleDrag(e, 'csv')}
                  onDragOver={(e) => handleDrag(e, 'csv')}
                  onDrop={(e) => handleDrop(e, 'csv')}
                >
                  <Upload className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Drop your CSV/Excel file here
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Supports .csv, .xlsx, and .xls files
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, 'csv')}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                    disabled={uploadCsvMutation.isPending}
                  >
                    {uploadCsvMutation.isPending ? "Uploading..." : "Choose File"}
                  </Button>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">Expected columns:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span>• name (required)</span>
                    <span>• email (required)</span>
                    <span>• phone</span>
                    <span>• department</span>
                    <span>• role</span>
                    <span>• notes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  <CardTitle>Photo Upload</CardTitle>
                </div>
                <CardDescription>
                  Extract customer info from handwritten lists or printed documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive.photo
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                  onDragEnter={(e) => handleDrag(e, 'photo')}
                  onDragLeave={(e) => handleDrag(e, 'photo')}
                  onDragOver={(e) => handleDrag(e, 'photo')}
                  onDrop={(e) => handleDrop(e, 'photo')}
                >
                  <Camera className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Drop your photo here
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Supports JPG, PNG with English and Chinese text
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'photo')}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploadPhotoMutation.isPending}
                  >
                    {uploadPhotoMutation.isPending ? "Processing..." : "Choose Photo"}
                  </Button>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">OCR Tips:</p>
                  <div className="text-xs space-y-1">
                    <p>• Ensure good lighting and clear text</p>
                    <p>• Works with both handwritten and printed text</p>
                    <p>• Supports English and Chinese characters</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>
                View and manage all imported customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers imported yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start by uploading a CSV file or photo to import customers
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone ? (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{user.phone}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.department ? (
                              <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span>{user.department}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role ? (
                              <Badge variant="outline">{user.role}</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}