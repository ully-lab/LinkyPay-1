import { Link, useLocation } from "wouter";
import { Boxes, Plus, Users, CreditCard, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Add Products", href: "/add-products", icon: Plus },
  { name: "User Assignments", href: "/assignments", icon: Users },
  { name: "Payment Links", href: "/payments", icon: CreditCard },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Boxes className="text-primary-foreground text-sm" />
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900">ProductHub</span>
        </div>
      </div>
      
      <nav className="mt-8">
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
    </div>
  );
}
