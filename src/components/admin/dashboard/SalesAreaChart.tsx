
"use client"

import { useState, useRef, useMemo } from "react"

interface SalesData {
  date: string
  revenue: number
  orders: number
}

interface SalesAreaChartProps {
  data: SalesData[]
  height?: number
}

export function SalesAreaChart({ data, height = 300 }: SalesAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // 1. Calculations
  const processedData = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.revenue), 1)
    return { maxVal, data }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
        No sales data available
      </div>
    )
  }

  // Chart dimensions (viewBox)
  const W = 1000
  const H = 400
  const PADDING_X = 0
  const PADDING_Y = 20

  // X scale: map index to [0, W]
  const getX = (i: number) => (i / (data.length - 1)) * W

  // Y scale: map value to [H, 0] (taking padding into account)
  const getY = (val: number) => {
    const ratio = val / processedData.maxVal
    return H - (ratio * (H - PADDING_Y * 2)) - PADDING_Y
  }

  // Create SVG Path (Line)
  // Simple Catmull-Rom or jagged line? Let's use simple straight lines for L commands first, 
  // but if we want smooth we can try to use cubic-bezier. 
  // For simplicity and robustness, standard lines (L) with a small curve radius or just L is safer.
  // Let's do a polyline first, it looks clean enough if points are dense (30 days).

  const points = data.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ')
  const areaPoints = `${getX(0)},${H} ${points} ${getX(data.length - 1)},${H}`

  return (
    <div className="w-full relative select-none" style={{ height: height }}>
      {/* Tooltip Overlay */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute bg-popover text-popover-foreground border shadow-lg rounded-lg px-3 py-2 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full z-20 flex flex-col gap-1"
          style={{
            left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
            top: '10%' // Fixed top pos or dynamic 
          }}
        >
          <div className="font-bold">{data[hoveredIndex].date}</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>${data[hoveredIndex].revenue.toLocaleString()}</span>
          </div>
          <div className="text-muted-foreground">{data[hoveredIndex].orders} orders</div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines (Horizontal) */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = H - (t * (H - PADDING_Y * 2)) - PADDING_Y
          return (
            <g key={t}>
              <line x1="0" y1={y} x2={W} y2={y} stroke="hsl(var(--muted))" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            </g>
          )
        })}

        {/* Area */}
        <polygon points={areaPoints} fill="url(#chartGradient)" />

        {/* Line */}
        <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points & Interactive Zones */}
        {data.map((d, i) => (
          <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
            {/* Invisible hover bar */}
            <rect
              x={getX(i) - (W / data.length / 2)}
              y="0"
              width={W / data.length}
              height={H}
              fill="transparent"
              className="cursor-crosshair"
            />

            {/* Dot (only visible on hover or if it's a peak?) */}
            {hoveredIndex === i && (
              <circle
                cx={getX(i)}
                cy={getY(d.revenue)}
                r="6"
                fill="hsl(var(--background))"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
              />
            )}
          </g>
        ))}
      </svg>

      {/* X Axis Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-2">
        {data.filter((_, i) => i % 5 === 0).map((d) => ( // Show every 5th label
          <span key={d.date}>{d.date.slice(5)}</span> // 'MM-DD'
        ))}
      </div>
    </div>
  )
}
