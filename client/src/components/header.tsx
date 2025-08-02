import { User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const pageInfo = {
  "/": {
    title: "Product Dashboard",
    subtitle: "Manage your product inventory and assignments"
  },
  "/add-products": {
    title: "Add Products",
    subtitle: "Add new products manually, via Excel/CSV, or photo OCR"
  },
  "/assignments": {
    title: "User Assignments",
    subtitle: "Assign products to users and manage assignments"
  },
  "/payments": {
    title: "Payment Links",
    subtitle: "Generate and manage Stripe payment links"
  }
};

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const currentPage = pageInfo[location as keyof typeof pageInfo] || pageInfo["/"];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{currentPage.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{currentPage.subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          {(user as any)?.profileImageUrl ? (
            <img 
              src={(user as any).profileImageUrl} 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          )}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : 'User'}
            </div>
            <div className="text-xs text-gray-500">
              {(user as any)?.email}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
