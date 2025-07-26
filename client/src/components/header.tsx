import { Bell, User } from "lucide-react";
import { useLocation } from "wouter";

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
  const currentPage = pageInfo[location as keyof typeof pageInfo] || pageInfo["/"];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{currentPage.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{currentPage.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-500">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  );
}
