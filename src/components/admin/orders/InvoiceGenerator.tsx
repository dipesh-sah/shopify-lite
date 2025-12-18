
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define strict types for the order object to ensure type safety
interface OrderItem {
  name?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: string | Date;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: {
    address1: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
    firstName?: string;
    lastName?: string;
  };
  billingAddress?: {
    address1?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  };
  items: OrderItem[];
  total: number;
  subtotal?: number;
  taxTotal?: number;
  status: string;
}

export const generateInvoice = (order: any) => {
  const doc = new jsPDF();

  // Company Logo/Header
  doc.setFontSize(20);
  doc.text('INVOICE', 14, 22);

  doc.setFontSize(10);
  doc.text(`Order #${order.id.slice(-6).toUpperCase()}`, 14, 30);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35);
  doc.text(`Status: ${order.status.toUpperCase()}`, 14, 40);

  // Customer Details
  const customerName = order.customerFirstName
    ? `${order.customerFirstName} ${order.customerLastName}`
    : (order.shippingAddress?.firstName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'Guest');

  doc.text('Bill To:', 14, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(customerName, 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerEmail || '', 14, 65);

  if (order.billingAddress) {
    doc.text(`${order.billingAddress.address1 || ''}`, 14, 70);
    doc.text(`${order.billingAddress.city || ''}, ${order.billingAddress.zip || ''}`, 14, 75);
  } else if (order.shippingAddress) {
    doc.text(`${order.shippingAddress.address1 || ''}`, 14, 70);
    doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.zip || ''}`, 14, 75);
  }

  // Items Table
  const tableColumn = ["Item", "Quantity", "Price", "Total"];
  const tableRows = [];

  order.items.forEach((item: any) => {
    const itemData = [
      item.name || 'Product',
      item.quantity,
      `$${Number(item.price).toFixed(2)}`,
      `$${(Number(item.price) * item.quantity).toFixed(2)}`,
    ];
    tableRows.push(itemData);
  });

  // @ts-ignore
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 90,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0] }, // Black header
  });

  // Totals
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 150;

  doc.text(`Subtotal: $${(Number(order.total) - (Number(order.taxTotal) || 0)).toFixed(2)}`, 140, finalY + 10);
  doc.text(`Tax: $${(Number(order.taxTotal) || 0).toFixed(2)}`, 140, finalY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: $${Number(order.total).toFixed(2)}`, 140, finalY + 25);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your business.', 14, 280);

  // Download
  doc.save(`invoice-${order.id}.pdf`);
};
