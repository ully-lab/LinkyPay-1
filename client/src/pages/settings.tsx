import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Key, ExternalLink, User, Mail, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stripeKeys, setStripeKeys] = useState({
    stripeSecretKey: "",
    stripePublishableKey: ""
  });

  // Update user's Stripe keys
  const updateStripeKeysMutation = useMutation({
    mutationFn: async (keys: { stripeSecretKey: string; stripePublishableKey: string }) => {
      return await apiRequest("PUT", "/api/auth/stripe-keys", keys);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stripe API keys updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setStripeKeys({ stripeSecretKey: "", stripePublishableKey: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Stripe keys",
        variant: "destructive",
      });
    },
  });

  const handleSubmitStripeKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeKeys.stripeSecretKey || !stripeKeys.stripePublishableKey) {
      toast({
        title: "Missing Information",
        description: "Please provide both secret and publishable keys",
        variant: "destructive",
      });
      return;
    }

    if (!stripeKeys.stripeSecretKey.startsWith('sk_')) {
      toast({
        title: "Invalid Secret Key",
        description: "Stripe secret key should start with 'sk_'",
        variant: "destructive",
      });
      return;
    }

    if (!stripeKeys.stripePublishableKey.startsWith('pk_')) {
      toast({
        title: "Invalid Publishable Key", 
        description: "Stripe publishable key should start with 'pk_'",
        variant: "destructive",
      });
      return;
    }

    updateStripeKeysMutation.mutate(stripeKeys);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and API integrations</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your account details from authentication provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {(user as any)?.profileImageUrl ? (
              <img
                src={(user as any).profileImageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium">
                {(user as any)?.firstName || "User"}
              </h3>
              <p className="text-gray-600 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {(user as any)?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Stripe Integration
          </CardTitle>
          <CardDescription>
            Configure your Stripe API keys to enable payment link generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Getting Your Stripe API Keys</h4>
                <p className="text-sm text-blue-800 mt-1">
                  1. Go to your{" "}
                  <a 
                    href="https://dashboard.stripe.com/apikeys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline inline-flex items-center gap-1"
                  >
                    Stripe Dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p className="text-sm text-blue-800">
                  2. Copy your "Publishable key" (starts with pk_) and "Secret key" (starts with sk_)
                </p>
                <p className="text-sm text-blue-800">
                  3. Use test keys for development, live keys for production
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitStripeKeys} className="space-y-4">
            <div>
              <Label htmlFor="stripeSecretKey">Secret Key</Label>
              <Input
                id="stripeSecretKey"
                type="password"
                placeholder="sk_test_... or sk_live_..."
                value={stripeKeys.stripeSecretKey}
                onChange={(e) => setStripeKeys(prev => ({ 
                  ...prev, 
                  stripeSecretKey: e.target.value 
                }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your secret key is encrypted and stored securely
              </p>
            </div>

            <div>
              <Label htmlFor="stripePublishableKey">Publishable Key</Label>
              <Input
                id="stripePublishableKey"
                type="text"
                placeholder="pk_test_... or pk_live_..."
                value={stripeKeys.stripePublishableKey}
                onChange={(e) => setStripeKeys(prev => ({ 
                  ...prev, 
                  stripePublishableKey: e.target.value 
                }))}
                className="font-mono text-sm"
              />
            </div>

            <Button 
              type="submit" 
              disabled={updateStripeKeysMutation.isPending}
              className="w-full"
            >
              {updateStripeKeysMutation.isPending ? "Validating Keys..." : "Save Stripe Keys"}
            </Button>
          </form>

          {(user as any)?.stripePublishableKey && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✅ Stripe keys configured successfully
              </p>
              <p className="text-xs text-green-700 mt-1">
                Using publishable key: {(user as any).stripePublishableKey}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}