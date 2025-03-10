"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pie, PieChart, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { isNumeric } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface PieChartViewProps {
  data: any[]
  columns: string[]
}

export default function PieChartView({ data, columns }: PieChartViewProps) {
  // Find categorical columns for labels
  const categoricalColumns = useMemo(() => {
    return columns.filter((column) => {
      // If it has few unique values (less than 20% of total rows or max 10)
      const uniqueValues = new Set(data.map((row) => row[column])).size
      return uniqueValues < Math.min(data.length * 0.2, 10)
    })
  }, [data, columns])

  // Find numeric columns for values
  const numericColumns = useMemo(() => {
    return columns.filter((column) => {
      // Check if at least 80% of values in this column are numeric
      const numericCount = data.filter((row) => isNumeric(row[column])).length
      return numericCount / data.length >= 0.8
    })
  }, [data, columns])

  // Add a new useMemo to detect state/region columns
  const stateColumns = useMemo(() => {
    return columns.filter((column) => {
      const name = column.toLowerCase()
      // Check if column name suggests state/region/location
      if (
        name.includes("state") ||
        name.includes("region") ||
        name.includes("country") ||
        name.includes("province") ||
        name.includes("location") ||
        name.includes("territory")
      ) {
        return true
      }

      // Check if it has a reasonable number of unique values (more than 2, less than 100)
      const uniqueValues = new Set(data.map((row) => row[column])).size
      return uniqueValues >= 2 && uniqueValues <= 100
    })
  }, [data, columns])

  const [labelColumn, setLabelColumn] = useState<string>(categoricalColumns[0] || columns[0])
  const [valueColumn, setValueColumn] = useState<string>(numericColumns[0] || columns[1] || columns[0])

  // Add state selection state
  const [stateColumn, setStateColumn] = useState<string>(stateColumns[0] || "")
  const [selectedState, setSelectedState] = useState<string>("")
  const [groupByState, setGroupByState] = useState<boolean>(false)

  // Add state options
  const stateOptions = useMemo(() => {
    if (!stateColumn) return []

    const options = [...new Set(data.map((row) => String(row[stateColumn] || "Unknown")))]
    return options.sort()
  }, [data, stateColumn])

  // Prepare chart data
  const chartData = useMemo(() => {
    let filteredData = data

    // Apply state filter if needed
    if (stateColumn && !groupByState && selectedState) {
      filteredData = filteredData.filter((row) => String(row[stateColumn]) === selectedState)
    }

    // If grouping by state, use state as the label
    const actualLabelColumn = groupByState && stateColumn ? stateColumn : labelColumn

    // Group by label and sum values
    const groupedData = filteredData.reduce(
      (acc, row) => {
        const label = String(row[actualLabelColumn] || "Unknown")

        if (!acc[label]) {
          acc[label] = { name: label, value: 0 }
        }

        // If value is numeric, add it
        if (isNumeric(row[valueColumn])) {
          acc[label].value += Number(row[valueColumn])
        }

        return acc
      },
      {} as Record<string, { name: string; value: number }>,
    )

    // Convert to array and sort by value
    return Object.values(groupedData)
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 12) // Increased limit for better visualization
  }, [data, labelColumn, valueColumn, stateColumn, selectedState, groupByState])

  // Generate colors for pie slices
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6, var(--chart-1)))",
    "hsl(var(--chart-7, var(--chart-2)))",
    "hsl(var(--chart-8, var(--chart-3)))",
  ]

  // Create chart config
  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {}
    chartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [chartData])

  if (columns.length < 2) {
    return (
      <Card className="p-6 text-center">
        <p>Not enough columns for a pie chart. Please upload a CSV with at least two columns.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <label className="text-sm font-medium mb-2 block">Label Column</label>
          <Select value={labelColumn} onValueChange={setLabelColumn} disabled={groupByState && stateColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select Label Column" />
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
          <label className="text-sm font-medium mb-2 block">Value Column</label>
          <Select value={valueColumn} onValueChange={setValueColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select Value Column" />
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

      {stateColumns.length > 0 && (
        <div className="space-y-4 border p-4 rounded-md">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="groupByState"
              checked={groupByState}
              onCheckedChange={(checked) => setGroupByState(checked as boolean)}
            />
            <label htmlFor="groupByState" className="text-sm font-medium">
              Group by state/region (use states as pie slices)
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <label className="text-sm font-medium mb-2 block">State/Region Column</label>
              <Select value={stateColumn} onValueChange={setStateColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State Column" />
                </SelectTrigger>
                <SelectContent>
                  {stateColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!groupByState && stateColumn && (
              <div className="w-full sm:w-1/2">
                <label className="text-sm font-medium mb-2 block">Select State/Region</label>
                <Select value={selectedState} onValueChange={setSelectedState} disabled={!stateColumn || groupByState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {stateOptions.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {chartData.length > 0 ? (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="w-full md:w-1/2 min-h-[300px]">
            <ChartContainer config={chartConfig}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
          <div className="w-full md:w-1/2">
            <div className="grid gap-2">
              {chartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div className="flex-1 text-sm truncate" title={entry.name}>
                    {entry.name}
                  </div>
                  <div className="font-medium">{entry.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
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

