import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch Orders with details
    const sql = `
      SELECT
        o.id, o.created_at, o.status, o.total, o.shipping_cost,
        CONCAT(COALESCE(o.first_name, ''), ' ', COALESCE(o.last_name, '')) as customer_name,
        o.customer_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.created_at DESC
    `;

    const rows = await query(sql);

    // 2. Generate CSV Headers
    const header = [
      'Order ID',
      'Date',
      'Status',
      'Customer Name',
      'Customer Email',
      'Items Count',
      'Total',
      'Shipping',
      'Currency'
    ];

    // 3. Map Data safely
    const csvRows = rows.map((r: any) => {
      const dateStr = r.created_at instanceof Date
        ? r.created_at.toISOString()
        : new Date(r.created_at).toISOString();

      return [
        r.id,
        dateStr,
        r.status,
        `"${r.customer_name?.trim() || 'Guest'}"`,
        r.customer_email || '',
        r.item_count,
        r.total,
        r.shipping_cost,
        'USD'
      ].join(',');
    });

    const csvContent = [header.join(','), ...csvRows].join('\n');

    // 4. Return as Download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename = "store-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (e) {
    console.error("Export Error:", e);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
