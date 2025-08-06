import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const pageInfo = {
  "/": {
    title: "Product Dashboard",
    subtitle: "Manage your product inventory and assignments"
  },
  "/add-products": {
    title: "Add Products",
    subtitle: "Add new products manually, via Excel/CSV, or photo OCR"
  },
  "/user-intake": {
    title: "Customer Intake",
    subtitle: "Import customer information via Excel/CSV files or photo OCR"
  },
  "/assignments": {
    title: "Assign Products to Customers",
    subtitle: "Assign products to customers and manage assignments"
  },
  "/payments": {
    title: "Payment Links",
    subtitle: "Generate and manage Stripe payment links"
  },
  "/settings": {
    title: "Settings",
    subtitle: "Configure your account and application settings"
  }
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  const currentPage = pageInfo[location as keyof typeof pageInfo] || pageInfo["/"];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-4 lg:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden mr-3 h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{currentPage.title}</h1>
            <p className="text-xs lg:text-sm text-gray-500 mt-1 hidden sm:block">{currentPage.subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
