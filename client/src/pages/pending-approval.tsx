import { Clock, Mail, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been created successfully
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin Review</p>
                <p className="text-sm text-gray-500">
                  An administrator will review your account request
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notification</p>
                <p className="text-sm text-gray-500">
                  You'll receive an email once your account is approved
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Access Granted</p>
                <p className="text-sm text-gray-500">
                  Sign in again after approval to access the dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            This usually takes 1-2 business days
          </p>
          <Button
            onClick={() => window.location.href = "/api/logout"}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}