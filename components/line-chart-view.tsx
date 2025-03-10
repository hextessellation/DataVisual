"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { isNumeric } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface LineChartViewProps {
  data: any[]
  columns: string[]
}

export default function LineChartView({ data, columns }: LineChartViewProps) {
  // Find numeric columns for y-axis
  const numericColumns = useMemo(() => {
    return columns.filter((column) => {
      // Check if at least 80% of values in this column are numeric
      const numericCount = data.filter((row) => isNumeric(row[column])).length
      return numericCount / data.length >= 0.8
    })
  }, [data, columns])

  // Find potential date/time columns or sequential columns for x-axis
  const sequentialColumns = useMemo(() => {
    return columns.filter((column) => {
      // Check if column name suggests date/time
      const name = column.toLowerCase()
      if (
        name.includes("date") ||
        name.includes("time") ||
        name.includes("year") ||
        name.includes("month") ||
        name.includes("day")
      ) {
        return true
      }

      // Check if values are sequential or ordered
      const values = data.map((row) => row[column])
      // Try to sort and see if it makes sense
      const uniqueValues = [...new Set(values)]
      if (uniqueValues.length > 3 && uniqueValues.length <= data.length * 0.5) {
        return true
      }

      return false
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

  const [xAxis, setXAxis] = useState<string>(sequentialColumns[0] || columns[0])
  const [yAxis, setYAxis] = useState<string>(numericColumns[0] || columns[1] || columns[0])

  // Add state selection state
  const [stateColumn, setStateColumn] = useState<string>(stateColumns[0] || "")
  const [selectedState, setSelectedState] = useState<string>("")
  const [showAllStates, setShowAllStates] = useState<boolean>(true)

  // Add state options
  const stateOptions = useMemo(() => {
    if (!stateColumn) return []

    const options = [...new Set(data.map((row) => String(row[stateColumn] || "Unknown")))]
    return options.sort()
  }, [data, stateColumn])

  // Sort data by x-axis if possible
  const sortedData = useMemo(() => {
    // Try to sort data if x-axis values are sortable
    const dataToSort = [...data]

    // Check if values are dates
    const isDate = dataToSort.some((row) => {
      const val = row[xAxis]
      return val && !isNaN(Date.parse(String(val)))
    })

    if (isDate) {
      return dataToSort.sort((a, b) => {
        return new Date(a[xAxis]).getTime() - new Date(b[xAxis]).getTime()
      })
    }

    // Check if values are numeric
    const isNum = dataToSort.some((row) => isNumeric(row[xAxis]))

    if (isNum) {
      return dataToSort.sort((a, b) => {
        return Number(a[xAxis]) - Number(b[xAxis])
      })
    }

    // Otherwise just use the original order
    return dataToSort
  }, [data, xAxis])

  // Update the chartData useMemo to filter by state if needed
  const chartData = useMemo(() => {
    let filteredData = sortedData

    // Apply state filter if needed
    if (stateColumn && !showAllStates && selectedState) {
      filteredData = filteredData.filter((row) => String(row[stateColumn]) === selectedState)
    }

    return filteredData
      .filter((row) => row[xAxis] !== undefined && row[xAxis] !== null)
      .map((row) => ({
        [xAxis]: row[xAxis],
        [yAxis]: isNumeric(row[yAxis]) ? Number(row[yAxis]) : 0,
        ...(stateColumn ? { [stateColumn]: row[stateColumn] } : {}),
      }))
      .slice(0, 100) // Increased limit for better visualization
  }, [sortedData, xAxis, yAxis, stateColumn, selectedState, showAllStates])

  // Update the chartConfig to include multiple lines if showing all states
  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {}

    if (stateColumn && !showAllStates) {
      // Single state mode - just one line
      config[yAxis] = {
        label: `${selectedState || "All"} - ${yAxis}`,
        color: "hsl(var(--chart-1))",
      }
    } else if (stateColumn && showAllStates) {
      // Multi-state mode - create a config entry for each state
      const uniqueStates = [...new Set(chartData.map((item) => String(item[stateColumn] || "Unknown")))]
      uniqueStates.forEach((state, index) => {
        const colorIndex = (index % 5) + 1
        config[`${state}`] = {
          label: String(state),
          color: `hsl(var(--chart-${colorIndex}))`,
        }
      })
    } else {
      // No state column - just one line
      config[yAxis] = {
        label: yAxis,
        color: "hsl(var(--chart-1))",
      }
    }

    return config
  }, [yAxis, stateColumn, selectedState, showAllStates, chartData])

  if (columns.length < 2) {
    return (
      <Card className="p-6 text-center">
        <p>Not enough columns for a line chart. Please upload a CSV with at least two columns.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <label className="text-sm font-medium mb-2 block">X-Axis (Sequence)</label>
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

      {stateColumns.length > 0 && (
        <div className="space-y-4 border p-4 rounded-md">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showAllStates"
              checked={showAllStates}
              onCheckedChange={(checked) => setShowAllStates(checked as boolean)}
            />
            <label htmlFor="showAllStates" className="text-sm font-medium">
              Show all states/regions together
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

            {!showAllStates && stateColumn && (
              <div className="w-full sm:w-1/2">
                <label className="text-sm font-medium mb-2 block">Select State/Region</label>
                <Select value={selectedState} onValueChange={setSelectedState} disabled={!stateColumn || showAllStates}>
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
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] min-h-[400px]">
            <ChartContainer config={chartConfig}>
              <LineChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 60 }}>
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

                {stateColumn && showAllStates ? (
                  // Multiple lines for each state
                  stateOptions.map((state, index) => {
                    const colorIndex = (index % 5) + 1
                    return (
                      <Line
                        key={state}
                        type="monotone"
                        data={chartData.filter((item) => String(item[stateColumn]) === state)}
                        dataKey={yAxis}
                        name={state}
                        stroke={`var(--color-${state})`}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: `var(--color-${state})` }}
                        activeDot={{ r: 6 }}
                        connectNulls={true}
                      />
                    )
                  })
                ) : (
                  // Single line
                  <Line
                    type="monotone"
                    dataKey={yAxis}
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--color-primary)" }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                  />
                )}
              </LineChart>
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

