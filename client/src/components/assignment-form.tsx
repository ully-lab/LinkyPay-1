import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, ChevronDown, User, Mail } from "lucide-react";

import { Product, SystemUser } from "@shared/schema";

export default function AssignmentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SystemUser | null>(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers = [] } = useQuery<SystemUser[]>({
    queryKey: ["/api/system-users"],
  });

  const form = useForm({
    defaultValues: {
      userEmail: "",
      userName: "",
    },
  });

  const assignProductsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success!",
        description: "Products assigned successfully",
      });
      form.reset();
      setSelectedProducts([]);
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign products",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }

    assignProductsMutation.mutate({
      ...data,
      productIds: selectedProducts,
      assignedBy: "admin",
    });
  };

  const selectedProductDetails = products.filter((p: Product) => 
    selectedProducts.includes(p.id)
  );

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  const handleCustomerSelect = (customer: SystemUser) => {
    setSelectedCustomer(customer);
    form.setValue("userEmail", customer.email);
    form.setValue("userName", customer.name);
    setCustomerPopoverOpen(false);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <FormLabel>Select Customer *</FormLabel>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerPopoverOpen}
                    className="w-full justify-between mt-2"
                  >
                    {selectedCustomer ? (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{selectedCustomer.name}</span>
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-500 text-sm">{selectedCustomer.email}</span>
                      </div>
                    ) : (
                      "Search and select a customer..."
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customers by name or email..." />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            onSelect={() => handleCustomerSelect(customer)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center space-x-3 w-full">
                              <User className="h-4 w-4 text-gray-400" />
                              <div className="flex-1">
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-gray-500">{customer.email}</div>
                                {customer.department && (
                                  <div className="text-xs text-gray-400">{customer.department}</div>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="customer@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <FormLabel>Selected Products</FormLabel>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[120px] mt-2">
              {selectedProductDetails.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Select products from the list below to assign them to users.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedProductDetails.map((product: Product) => (
                    <div key={product.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">${product.price}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeProduct(product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              type="submit"
              disabled={assignProductsMutation.isPending || selectedProducts.length === 0}
            >
              {assignProductsMutation.isPending ? "Assigning..." : "Assign Products"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                form.reset();
                setSelectedProducts([]);
              }}
            >
              Clear Selection
            </Button>
          </div>
        </form>
      </Form>

      {/* Product Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {products.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-500">${product.price}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
