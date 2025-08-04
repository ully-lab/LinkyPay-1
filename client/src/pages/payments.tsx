import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaymentLinkForm from "@/components/payment-link-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Mail, X, Receipt, Download, RotateCcw, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { PaymentLink, SystemUser } from "@shared/schema";

export default function Payments() {
  const { toast } = useToast();
  const { data: paymentLinks, isLoading } = useQuery<PaymentLink[]>({
    queryKey: ["/api/payment-links"],
  });

  const { data: customers = [] } = useQuery<SystemUser[]>({
    queryKey: ["/api/system-users"],
  });

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const sendWhatsApp = (paymentLink: PaymentLink) => {
    // Find customer phone number from system users
    const customer = customers.find(c => c.email.toLowerCase() === paymentLink.userEmail.toLowerCase());
    
    if (!customer?.phone) {
      toast({
        title: "Phone Number Not Found",
        description: "Customer phone number is required to send WhatsApp message",
        variant: "destructive",
      });
      return;
    }

    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhone = customer.phone.replace(/[\s\-\(\)]/g, '');
    
    // Create WhatsApp message
    const message = `Hi ${paymentLink.userName}! Here's your payment link for $${parseFloat(paymentLink.amount).toFixed(2)}: ${paymentLink.stripePaymentLinkUrl}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Opened",
      description: "Payment link message ready to send",
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Payment Link Generator */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Payment Links</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentLinkForm />
          </CardContent>
        </Card>

        {/* Generated Payment Links */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Links History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !paymentLinks || paymentLinks.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links yet</h3>
                <p className="text-gray-500">Create your first payment link above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLinks.map((payment: any) => (
                      <TableRow key={payment.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {payment.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{payment.userName}</div>
                              <div className="text-sm text-gray-500">{payment.userEmail}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {payment.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(payment.stripePaymentLinkUrl)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendWhatsApp(payment)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  WhatsApp
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Send
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {payment.status === "paid" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <Receipt className="h-3 w-3 mr-1" />
                                  Receipt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Export
                                </Button>
                              </>
                            )}
                            {payment.status === "expired" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Regenerate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Resend
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
