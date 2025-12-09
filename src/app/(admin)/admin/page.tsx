export default function AdminDashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold">$0.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Orders</h3>
          <p className="mt-2 text-3xl font-bold">+0</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Products</h3>
          <p className="mt-2 text-3xl font-bold">+0</p>
        </div>
      </div>
    </div>
  )
}
