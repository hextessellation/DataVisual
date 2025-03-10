"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { isNumeric } from "@/lib/utils"

interface BarChartViewProps {
  data: any[]
  columns: string[]
}

export default function BarChartView({ data, columns }: BarChartViewProps) {
  // Find numeric columns for y-axis
  const numericColumns = useMemo(() => {
    return columns.filter((column) => {
      // Check if at least 80% of values in this column are numeric
      const numericCount = data.filter((row) => isNumeric(row[column])).length
      return numericCount / data.length >= 0.8
    })
  }, [data, columns])

  // Find categorical columns for x-axis (non-numeric or with few unique values)
  const categoricalColumns = useMemo(() => {
    return columns.filter((column) => {
      // If it's not numeric or has few unique values (less than 20% of total rows)
      const uniqueValues = new Set(data.map((row) => row[column])).size
      return !numericColumns.includes(column) || uniqueValues < data.length * 0.2
    })
  }, [data, columns, numericColumns])

  const [xAxis, setXAxis] = useState<string>(categoricalColumns[0] || columns[0])
  const [yAxis, setYAxis] = useState<string>(numericColumns[0] || columns[1] || columns[0])

  // Prepare chart data
  const chartData = useMemo(() => {
    // Group by x-axis value and calculate y-axis values
    const groupedData = data.reduce(
      (acc, row) => {
        const xValue = String(row[xAxis] || "Unknown")

        if (!acc[xValue]) {
          acc[xValue] = { [xAxis]: xValue, [yAxis]: 0, count: 0 }
        }

        // If y-value is numeric, add it
        if (isNumeric(row[yAxis])) {
          acc[xValue][yAxis] += Number(row[yAxis])
          acc[xValue].count += 1
        }

        return acc
      },
      {} as Record<string, any>,
    )

    // Convert to array and calculate averages if needed
    return Object.values(groupedData)
      .map((item) => ({
        [xAxis]: item[xAxis],
        [yAxis]: item[yAxis],
        fill: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))`,
      }))
      .slice(0, 20) // Limit to 20 items for better visualization
  }, [data, xAxis, yAxis])

  // Create chart config
  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {
      [yAxis]: {
        label: yAxis,
        color: "hsl(var(--chart-1))",
      },
    }
    return config
  }, [yAxis])

  if (columns.length < 2) {
    return (
      <Card className="p-6 text-center">
        <p>Not enough columns for a bar chart. Please upload a CSV with at least two columns.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <label className="text-sm font-medium mb-2 block">X-Axis (Category)</label>
          <Select value={xAxis} onValueChange={setXAxis}>
            <SelectTrigger>
              <SelectValue placeholder="Select X-Axis" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-1/2">
          <label className="text-sm font-medium mb-2 block">Y-Axis (Value)</label>
          <Select value={yAxis} onValueChange={setYAxis}>
            <SelectTrigger>
              <SelectValue placeholder="Select Y-Axis" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] min-h-[400px]">
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 60 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey={xAxis}
                  tickLine={false}
                  axisLine={true}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={true} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey={yAxis} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p>No valid data for the selected columns. Try selecting different columns.</p>
        </Card>
      )}
    </div>
  )
}

