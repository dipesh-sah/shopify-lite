export const generateOrderConfirmationEmail = (order: {
  id: string;
  orderNumber: string;
  customerFirstName: string;
  total: number;
  items: Array<{ title: string; quantity: number; price: number }>;
  shippingAddress: any;
}) => {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${Number(item.price).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #000; text-align: center;">Order Confirmed!</h1>
      <p>Hi ${order.customerFirstName},</p>
      <p>Thank you for your purchase. We're getting your order ready to be shipped. We will notify you when it has been sent.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order #${order.orderNumber}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left;">
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">Product</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 10px; font-weight: bold;">$${Number(order.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h3>Shipping to:</h3>
      <p>
        ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
        ${order.shippingAddress.address1} ${order.shippingAddress.address2 || ''}<br>
        ${order.shippingAddress.city}, ${order.shippingAddress.province || ''} ${order.shippingAddress.zip}<br>
        ${order.shippingAddress.country}
      </p>

      <p style="text-align: center; margin-top: 30px; color: #888;">
        Need help? <a href="mailto:support@shopifylite.com">Contact Support</a>
      </p>
    </div>
  `;
};
