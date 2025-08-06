import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, FileSpreadsheet, Camera } from "lucide-react";
import ManualProductForm from "@/components/manual-product-form";
import FileUpload from "@/components/file-upload";

export default function AddProducts() {
  const [activeMethod, setActiveMethod] = useState<'manual' | 'csv' | 'ocr' | null>(null);

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Product Entry Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="text-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <Edit className="text-primary h-5 w-5 lg:h-6 lg:w-6" />
                </div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-xs lg:text-sm text-gray-500 mb-3 lg:mb-4">Add products one by one with detailed information</p>
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
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="text-accent h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel/CSV Import</h3>
                <p className="text-sm text-gray-500 mb-4">Bulk import products from spreadsheet files</p>
                <Button 
                  onClick={() => setActiveMethod('csv')}
                  variant="secondary"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Upload Spreadsheet
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-secondary h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Photo OCR</h3>
                <p className="text-sm text-gray-500 mb-4">Extract product details from photos using OCR</p>
                <Button 
                  onClick={() => setActiveMethod('ocr')}
                  variant="secondary"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
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
