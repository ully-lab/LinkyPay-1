import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AssignmentForm from "@/components/assignment-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, ExternalLink } from "lucide-react";

import { UserAssignment, Product } from "@shared/schema";

export default function Assignments() {
  const { data: assignments, isLoading } = useQuery<(UserAssignment & { product: Product })[]>({
    queryKey: ["/api/assignments"],
  });

  // Group assignments by user
  const groupedAssignments = assignments?.reduce((acc: any, assignment: any) => {
    const key = assignment.userEmail;
    if (!acc[key]) {
      acc[key] = {
        userEmail: assignment.userEmail,
        userName: assignment.userName,
        products: [],
        totalValue: 0,
      };
    }
    acc[key].products.push(assignment.product);
    acc[key].totalValue += parseFloat(assignment.product.price);
    return acc;
  }, {}) || {};

  const userAssignments = Object.values(groupedAssignments);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Assignment Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Assign Products to Users</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm />
          </CardContent>
        </Card>

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, j) => (
                        <Skeleton key={j} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : userAssignments.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                <p className="text-gray-500">Start by assigning products to users above.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {userAssignments.map((assignment: any, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{assignment.userName}</h4>
                          <p className="text-sm text-gray-500">{assignment.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                          Total: ${assignment.totalValue.toFixed(2)}
                        </span>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Generate Payment Link
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignment.products.map((product: any) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-3">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-900">{product.name}</h5>
                              <p className="text-sm text-gray-500">${product.price}</p>
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
