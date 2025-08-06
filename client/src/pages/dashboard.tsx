import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Boxes, Users, CreditCard, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalProducts: number;
    productsInShipment: number;
    productsNotInShipment: number;
    totalCustomers: number;
    customersWithOrders: number;
    customersWithoutOrders: number;
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className={(i === 0 || i === 1 || i === 2) ? "sm:col-span-2 lg:col-span-1" : ""}>
              <CardContent className="p-4 lg:p-6">
                <Skeleton className="h-10 w-10 lg:h-12 lg:w-12 mb-3 lg:mb-4" />
                <Skeleton className="h-3 lg:h-4 w-16 lg:w-20 mb-2" />
                <Skeleton className="h-6 lg:h-8 w-12 lg:w-16" />
                {(i === 0 || i === 1 || i === 2) && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Products Section with Subelements */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4">
              {/* Main Products Header */}
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

              {/* Subelements */}
              <div className="grid grid-cols-1 gap-3 lg:gap-4 pl-2">
                <Link href="/products/in-shipment" className="block">
                  <div className="flex items-center space-x-2 p-2 lg:p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-indigo-700">Included in this shipment</p>
                      <p className="text-sm lg:text-base font-semibold text-indigo-900">
                        {stats?.productsInShipment || 0}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center space-x-2 p-2 lg:p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">Not in this shipment</p>
                    <p className="text-sm lg:text-base font-semibold text-slate-900">
                      {stats?.productsNotInShipment || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Customers Section with Subelements */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4">
              {/* Main Customers Header */}
              <div className="flex items-center">
                <div className="p-2 lg:p-3 rounded-lg bg-green-50">
                  <Users className="text-green-600 h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                    {stats?.totalCustomers || 0}
                  </p>
                </div>
              </div>

              {/* Subelements */}
              <div className="grid grid-cols-1 gap-3 lg:gap-4 pl-2">
                <div className="flex items-center space-x-2 p-2 lg:p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700">Ordered this shipment</p>
                    <p className="text-sm lg:text-base font-semibold text-blue-900">
                      {stats?.customersWithOrders || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-2 lg:p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">No order this time</p>
                    <p className="text-sm lg:text-base font-semibold text-gray-900">
                      {stats?.customersWithoutOrders || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Payment Links Section with Subelements */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4">
              {/* Main Payment Links Header */}
              <div className="flex items-center">
                <div className="p-2 lg:p-3 rounded-lg bg-yellow-50">
                  <CreditCard className="text-yellow-600 h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Payment Links</p>
                  <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                    {stats?.paymentLinks || 0}
                  </p>
                </div>
              </div>

              {/* Subelements */}
              <div className="grid grid-cols-2 gap-3 lg:gap-4 pl-2">
                <div className="flex items-center space-x-2 p-2 lg:p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-green-700">Paid</p>
                    <p className="text-sm lg:text-base font-semibold text-green-900">
                      {stats?.paidPaymentLinks || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-2 lg:p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-orange-700">Outstanding</p>
                    <p className="text-sm lg:text-base font-semibold text-orange-900">
                      {stats?.pendingPaymentLinks || 0}
                    </p>
                  </div>
                </div>
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
