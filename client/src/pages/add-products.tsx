import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, FileSpreadsheet, Camera } from "lucide-react";
import ManualProductForm from "@/components/manual-product-form";
import FileUpload from "@/components/file-upload";

export default function AddProducts() {
  const [activeMethod, setActiveMethod] = useState<'manual' | 'csv' | 'ocr' | null>(null);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Product Entry Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Edit className="text-blue-600 h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-500 mb-4">Add products one by one with detailed information</p>
                <Button 
                  onClick={() => setActiveMethod('manual')}
                  className="w-full"
                >
                  Start Manual Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="text-green-600 h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel/CSV Import</h3>
                <p className="text-sm text-gray-500 mb-4">Bulk import products from spreadsheet files</p>
                <Button 
                  onClick={() => setActiveMethod('csv')}
                  variant="secondary"
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  Upload Spreadsheet
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-purple-600 h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Photo OCR</h3>
                <p className="text-sm text-gray-500 mb-4">Extract product details from photos using OCR</p>
                <Button 
                  onClick={() => setActiveMethod('ocr')}
                  variant="secondary"
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Upload Photos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Entry Form */}
        {activeMethod === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualProductForm onSuccess={() => setActiveMethod(null)} />
            </CardContent>
          </Card>
        )}

        {/* File Upload Areas */}
        {(activeMethod === 'csv' || activeMethod === 'ocr') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeMethod === 'csv' && (
              <Card>
                <CardHeader>
                  <CardTitle>Excel/CSV Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload 
                    type="csv" 
                    onSuccess={() => setActiveMethod(null)}
                  />
                </CardContent>
              </Card>
            )}

            {activeMethod === 'ocr' && (
              <Card>
                <CardHeader>
                  <CardTitle>Photo OCR Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload 
                    type="ocr" 
                    onSuccess={() => setActiveMethod(null)}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
