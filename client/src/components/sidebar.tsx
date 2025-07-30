import { Link, useLocation } from "wouter";
import { Boxes, Plus, Users, CreditCard, BarChart3, UserPlus, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Add Products", href: "/add-products", icon: Plus },
  { name: "User Intake", href: "/user-intake", icon: UserPlus },
  { name: "User Assignments", href: "/assignments", icon: Users },
  { name: "Payment Links", href: "/payments", icon: CreditCard },
  { name: "User Management", href: "/admin", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Boxes className="text-primary-foreground text-sm" />
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900">ProductHub</span>
        </div>
      </div>
      
      <nav className="mt-8 flex-1">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-gray-600 hover:bg-gray-50"
                )}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
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
          onClick={() => window.location.href = "/api/logout"}
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
