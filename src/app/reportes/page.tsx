"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DateRangePicker from "@/components/reports/date-range-picker";
import { formatCOP } from "@/components/products/products-list";

type ReportData = {
  totalSold: number;
  transactionCount: number;
  averageTicket: number;
  salesByOrg: { organization: string; totalSold: number }[];
  salesByPaymentMethod: {
    paymentMethod: string;
    transactionCount: number;
    totalSold: number;
  }[];
  mostSoldProducts: {
    productName: string;
    variantName: string;
    totalQuantity: number;
  }[];
  topRevenueProducts: {
    productName: string;
    variantName: string;
    totalRevenue: number;
  }[];
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  qr_code: "QR",
  mixed: "Mixto",
};

export default function ReportesPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({ from: today, to: today });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async (from: Date, to: Date) => {
    setIsLoading(true);
    try {
      const fromIso = format(from, "yyyy-MM-dd");
      const toIso = format(to, "yyyy-MM-dd");
      const response = await fetch(
        `/api/reports/range?from=${fromIso}&to=${toIso}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(dateRange.from, dateRange.to);
  }, [dateRange, fetchReports]);

  const handleRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  return (
    <main className="font-sans min-h-screen p-5 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onRangeChange={handleRangeChange}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      ) : reportData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard title="Total vendido" value={formatCOP(reportData.totalSold)} />
            <SummaryCard title="Transacciones" value={String(reportData.transactionCount)} />
            <SummaryCard title="Ticket promedio" value={formatCOP(reportData.averageTicket)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por organización</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.salesByOrg.length === 0 ? (
                  <EmptyState />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organización</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.salesByOrg.map(row => (
                        <TableRow key={row.organization}>
                          <TableCell>{row.organization}</TableCell>
                          <TableCell className="text-right">
                            {formatCOP(row.totalSold)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas por método de pago</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.salesByPaymentMethod.length === 0 ? (
                  <EmptyState />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.salesByPaymentMethod.map(row => (
                        <TableRow key={row.paymentMethod}>
                          <TableCell>
                            {PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.transactionCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCOP(row.totalSold)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos más vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.mostSoldProducts.length === 0 ? (
                  <EmptyState />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variante</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.mostSoldProducts.map((row, index) => (
                        <TableRow key={`${row.productName}-${row.variantName}-${index}`}>
                          <TableCell>{row.productName}</TableCell>
                          <TableCell>{row.variantName}</TableCell>
                          <TableCell className="text-right">
                            {row.totalQuantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos que más facturan</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.topRevenueProducts.length === 0 ? (
                  <EmptyState />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variante</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topRevenueProducts.map((row, index) => (
                        <TableRow key={`${row.productName}-${row.variantName}-${index}`}>
                          <TableCell>{row.productName}</TableCell>
                          <TableCell>{row.variantName}</TableCell>
                          <TableCell className="text-right">
                            {formatCOP(row.totalRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">No se pudieron cargar los reportes</p>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground py-4 text-center">
      Sin datos para este periodo
    </p>
  );
}
