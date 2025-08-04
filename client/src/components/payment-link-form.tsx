import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink, Eye } from "lucide-react";
import { useEffect } from "react";

import { UserAssignment, Product } from "@shared/schema";

export default function PaymentLinkForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery<(UserAssignment & { product: Product })[]>({
    queryKey: ["/api/assignments"],
  });

  // Group assignments by user for the dropdown
  const userAssignments = assignments.reduce((acc: any, assignment: any) => {
    const key = assignment.userEmail;
    if (!acc[key]) {
      acc[key] = {
        userEmail: assignment.userEmail,
        userName: assignment.userName,
        products: [],
        totalValue: 0,
      };
    }
    acc[key].products.push(assignment.product);
    acc[key].totalValue += parseFloat(assignment.product.price);
    return acc;
  }, {});

  const userOptions = Object.values(userAssignments);

  const form = useForm({
    defaultValues: {
      userAssignment: "",
      paymentMethod: "card",
      dueDate: "",
      currency: "usd",
      notes: "",
    },
  });

  // Check for preselected assignment from localStorage
  useEffect(() => {
    const preselectedData = localStorage.getItem('preselectedAssignment');
    if (preselectedData) {
      try {
        const assignment = JSON.parse(preselectedData);
        form.setValue('userAssignment', assignment.userEmail);
        form.setValue('notes', `Payment link for ${assignment.userName} - Total: $${assignment.totalAmount.toFixed(2)}`);
        // Clear the localStorage after using it
        localStorage.removeItem('preselectedAssignment');
      } catch (error) {
        console.error('Error parsing preselected assignment:', error);
      }
    }
  }, [form]);

  const createPaymentLinkMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payment-links", data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      response.json().then(data => {
        toast({
          title: "Success!",
          description: "Payment link created successfully",
        });
        
        // Show the payment link
        if (data.stripeUrl) {
          navigator.clipboard.writeText(data.stripeUrl);
          toast({
            title: "Payment link copied!",
            description: "The payment link has been copied to your clipboard",
          });
        }
      });
      
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!data.userAssignment) {
      toast({
        title: "Error",
        description: "Please select a user assignment",
        variant: "destructive",
      });
      return;
    }

    const selectedAssignment = userOptions.find((ua: any) => 
      ua.userEmail === data.userAssignment
    );

    if (!selectedAssignment) {
      toast({
        title: "Error",
        description: "Selected assignment not found",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      userEmail: selectedAssignment.userEmail,
      userName: selectedAssignment.userName,
      productIds: selectedAssignment.products.map((p: any) => p.id),
      currency: data.currency,
      dueDate: data.dueDate || null,
      notes: data.notes,
    };

    createPaymentLinkMutation.mutate(payload);
  };

  const selectedAssignment = userOptions.find((ua: any) => 
    ua.userEmail === form.watch("userAssignment")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="userAssignment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select User Assignment</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose user assignment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {userOptions.map((assignment: any) => (
                      <SelectItem key={assignment.userEmail} value={assignment.userEmail}>
                        {assignment.userName} - {assignment.products.length} products (${assignment.totalValue.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="usd">USD - US Dollar</SelectItem>
                    <SelectItem value="eur">EUR - Euro</SelectItem>
                    <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    <SelectItem value="cny">CNY - Chinese Yuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional information for the payment request"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Assignment Preview */}
        {selectedAssignment && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Selected Assignment Preview</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">User:</span>
              <span className="text-sm font-medium">{selectedAssignment.userName} ({selectedAssignment.userEmail})</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Products:</span>
              <span className="text-sm font-medium">{selectedAssignment.products.length} items</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="text-sm font-medium">${selectedAssignment.totalValue.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <Button 
            type="submit"
            disabled={createPaymentLinkMutation.isPending}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {createPaymentLinkMutation.isPending ? "Creating..." : "Generate Payment Link"}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            disabled={!selectedAssignment}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Payment Page
          </Button>
        </div>
      </form>
    </Form>
  );
}
