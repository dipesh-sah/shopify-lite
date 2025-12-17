
import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Determine export type? For now extract all orders
    const sql = `
      SELECT 
        o.id, o.created_at, o.status, o.total, o.shipping_cost,
        CONCAT(o.first_name, ' ', o.last_name) as customer_name,
        o.customer_email,
        o.shipping_method_id
      FROM orders o
      ORDER BY o.created_at DESC
    `;

    const rows = await query(sql);

    // Generate CSV
    const header = ['Order ID', 'Date', 'Status', 'Total', 'Shipping Cost', 'Customer', 'Email'];
    const csvRows = rows.map((r: any) => [
      r.id,
      r.created_at.toISOString(),
      r.status,
      r.total,
      r.shipping_cost,
      `"${r.customer_name}"`,
      r.customer_email
    ].join(','));

    const csvContent = [header.join(','), ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (e) {
    console.error("Export Error:", e);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
