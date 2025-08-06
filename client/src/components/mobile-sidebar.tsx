import { Link, useLocation } from "wouter";
import { Plus, Users, CreditCard, BarChart3, UserPlus, LogOut, User, Settings as SettingsIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/High-Resolution-Color-Logo_1754312782785.png";
import { apiRequest } from "@/lib/queryClient";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Add Products", href: "/add-products", icon: Plus },
  { name: "Customer Intake", href: "/user-intake", icon: UserPlus },
  { name: "Assign Products", href: "/assignments", icon: Users },
  { name: "Payment Links", href: "/payments", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <img 
                src={logoPath} 
                alt="Linky Pay" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                      onClick={onClose}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              {(user as any)?.profileImageUrl ? (
                <img 
                  src={(user as any).profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {(user as any)?.firstName || (user as any)?.email || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {(user as any)?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}