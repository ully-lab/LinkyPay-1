import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Package, CreditCard } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Linky Pay
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive product management system with OCR capabilities, user assignments, 
            and seamless Stripe payment integration for fashion retailers.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Shield className="mr-2 h-5 w-5" />
            Sign In to Continue
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Package className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add products manually, via CSV import, or extract from photos using OCR technology.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <CardTitle>User Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Assign products to users and track assignments with comprehensive user management.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CreditCard className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Payment Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generate secure Stripe payment links for assigned products and track payments.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="mx-auto h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Protected with authentication to keep your business data and API keys secure.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Secure, reliable, and built for fashion retail businesses
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}