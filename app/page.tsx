"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, BarChart3, LineChart, PieChart, Table2 } from "lucide-react"
import Papa from "papaparse"
import DataTable from "@/components/data-table"
import BarChartView from "@/components/bar-chart-view"
import LineChartView from "@/components/line-chart-view"
import PieChartView from "@/components/pie-chart-view"

export default function Home() {
  const [csvData, setCsvData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]
        setCsvData(data)

        // Extract column headers
        if (data.length > 0) {
          setColumns(Object.keys(data[0]))
        }

        setIsLoading(false)
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        setIsLoading(false)
      },
    })
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold text-center mb-8">CSV Data Visualizer</h1>

      {csvData.length === 0 ? (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Upload your CSV file</CardTitle>
            <CardDescription>Upload a CSV file to visualize your data with charts and tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900">
              <Upload className="h-10 w-10 text-gray-400 mb-4" />
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Button asChild>
                <label>
                  Browse Files
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{fileName}</h2>
              <p className="text-muted-foreground">
                {csvData.length} rows, {columns.length} columns
              </p>
            </div>
            <Button asChild variant="outline">
              <label>
                Upload New File
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </Button>
          </div>

          <Tabs defaultValue="table">
            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
              <TabsTrigger value="table">
                <Table2 className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger value="bar">
                <BarChart3 className="h-4 w-4 mr-2" />
                Bar
              </TabsTrigger>
              <TabsTrigger value="line">
                <LineChart className="h-4 w-4 mr-2" />
                Line
              </TabsTrigger>
              <TabsTrigger value="pie">
                <PieChart className="h-4 w-4 mr-2" />
                Pie
              </TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Table</CardTitle>
                  <CardDescription>View your CSV data in a table format</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable data={csvData} columns={columns} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bar" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bar Chart</CardTitle>
                  <CardDescription>Visualize your data as a bar chart</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChartView data={csvData} columns={columns} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="line" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Line Chart</CardTitle>
                  <CardDescription>Visualize your data as a line chart</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChartView data={csvData} columns={columns} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pie" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pie Chart</CardTitle>
                  <CardDescription>Visualize your data as a pie chart</CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChartView data={csvData} columns={columns} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  )
}

