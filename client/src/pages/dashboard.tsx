import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Boxes, Users, CreditCard, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalProducts: number;
    activeUsers: number;
    paymentLinks: number;
    paidPaymentLinks: number;
    pendingPaymentLinks: number;
    revenue: number;
  }>({
    queryKey: ["/api/stats"],
  });



  if (statsLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 lg:p-6">
                <Skeleton className="h-10 w-10 lg:h-12 lg:w-12 mb-3 lg:mb-4" />
                <Skeleton className="h-3 lg:h-4 w-16 lg:w-20 mb-2" />
                <Skeleton className="h-6 lg:h-8 w-12 lg:w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 rounded-lg bg-blue-50">
                <Boxes className="text-blue-600 h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                  {stats?.totalProducts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 rounded-lg bg-green-50">
                <Users className="text-green-600 h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                  {stats?.activeUsers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 rounded-lg bg-yellow-50">
                <CreditCard className="text-yellow-600 h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Links</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                  {stats?.paymentLinks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 rounded-lg bg-green-50">
                <CreditCard className="text-green-600 h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Paid</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                  {stats?.paidPaymentLinks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 rounded-lg bg-orange-50">
                <CreditCard className="text-orange-600 h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                  {stats?.pendingPaymentLinks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 rounded-lg bg-purple-50">
                <DollarSign className="text-purple-600 h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                  ${stats?.revenue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
