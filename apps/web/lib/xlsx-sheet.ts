import * as XLSX from "xlsx";

export type SheetRow = (string | number)[];

export function downloadSheet(options: {
  rows: SheetRow[];
  sheetName: string;
  fileName: string;
  columnWidths?: number[];
}) {
  const sheet = XLSX.utils.aoa_to_sheet(options.rows);
  if (options.columnWidths) {
    sheet["!cols"] = options.columnWidths.map((width) => ({ wch: width }));
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, options.sheetName);
  XLSX.writeFile(workbook, options.fileName);
}
