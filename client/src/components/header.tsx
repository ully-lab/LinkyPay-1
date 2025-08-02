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
  }
};

export default function Header() {
  const [location] = useLocation();
  const currentPage = pageInfo[location as keyof typeof pageInfo] || pageInfo["/"];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">{currentPage.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{currentPage.subtitle}</p>
      </div>
    </header>
  );
}
