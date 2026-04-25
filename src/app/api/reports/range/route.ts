import { NextRequest, NextResponse } from "next/server";
import { dateRangeToUtc } from "@/lib/timezone";
import {
  getTotalSold,
  getSalesByOrg,
  getTransactionCount,
  getAverageTicket,
  getSalesByPaymentMethod,
  getMostSoldProducts,
  getTopRevenueProducts,
} from "@/domains/reports/data-access";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!fromParam || !toParam) {
    return NextResponse.json(
      { message: "from and to query params are required" },
      { status: 400 }
    );
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(fromParam) || !datePattern.test(toParam)) {
    return NextResponse.json(
      { message: "Invalid date format, expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const range = dateRangeToUtc(fromParam, toParam);

  try {
    const [
      totalSold,
      transactionCount,
      averageTicket,
      salesByOrg,
      salesByPaymentMethod,
      mostSoldProducts,
      topRevenueProducts,
    ] = await Promise.all([
      getTotalSold(range),
      getTransactionCount(range),
      getAverageTicket(range),
      getSalesByOrg(range),
      getSalesByPaymentMethod(range),
      getMostSoldProducts(range),
      getTopRevenueProducts(range),
    ]);

    return NextResponse.json({
      totalSold,
      transactionCount,
      averageTicket,
      salesByOrg,
      salesByPaymentMethod,
      mostSoldProducts,
      topRevenueProducts,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
