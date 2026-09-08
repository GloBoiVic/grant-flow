import { AuthorizationError } from "@/lib/clerk/authorization";
import { formatUtcDate, utcToday } from "@/lib/dates/utc-dates";
import { getPortfolioExport } from "@/lib/queries/portfolio-export";
import { serializePortfolioCsv } from "@/lib/export/portfolio-csv";

const errorHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(_request: Request): Promise<Response> {
  void _request;
  try {
    const rows = await getPortfolioExport();
    const csv = serializePortfolioCsv(rows);
    const filename = `grantflow-portfolio-${formatUtcDate(utcToday())}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response("Unable to export this portfolio.", { status: 401, headers: errorHeaders });
    }
    return new Response("We could not export this portfolio. Please try again.", { status: 500, headers: errorHeaders });
  }
}
