import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

export default function ProductsInShipment() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/in-shipment"],
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Products Included in This Shipment</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 lg:p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-3" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Products Included in This Shipment</h1>
        <p className="text-gray-600 mt-2">
          Products that have been assigned to customers and are part of the current shipment.
        </p>
      </div>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No products are currently assigned to customers for shipment.</p>
            <p className="text-gray-400 text-sm mt-2">
              Assign products to customers to see them appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {products.length} product{products.length !== 1 ? 's' : ''} in shipment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-purple-600">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {product.category}
                    </Badge>
                  </div>
                  {product.sku && (
                    <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      In Shipment
                    </Badge>
                    {product.imageUrl && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}