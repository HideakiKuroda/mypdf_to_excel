import React, { useEffect, useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table";
import { Button } from "@vaadin/react-components/Button.js";
import { PPconvert } from "./PPconvert";
import { useMasterData } from "../masterTable/MasterDataContext";
import { CellResult, COLUMN2, PP_TABLE_HEADER, PPHeaderKey, PPTemplate } from "./PPConfig";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Notification } from "@vaadin/react-components/Notification.js";

const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;

type TableData = Record<string, string>;

interface PreviewTableProps {
  initialData: TableData[];
  onReset: () => void;
  fileName: string;
}

const PreviewTable: React.FC<PreviewTableProps> = ({ initialData, onReset, fileName }) => {
  const [data, setData] = useState<PPTemplate[]>([]);
  const { masterData, empData } = useMasterData();

  useEffect(() => {
    const parsedData = initialData.filter((item) => item[COLUMN2] !== "");
    const newData = PPconvert(parsedData, fileName, masterData, empData);
    console.log(parsedData);
    setData(newData);
  }, [fileName, initialData, masterData]);

  const handleDownload = async () => {
    if (data.length === 0) return;

    try {
      const payload = data
        .filter(
          (d) =>
            d.load &&
            !/(空船|ｲﾅｰﾄ)/.test(d.load.value as string) &&
            d.work.value !== "E" &&
            !d.load.value.toString().includes("EMP")
        )
        .map((row) => ({
          ship_name: row.shipName?.value ?? "",
          dw: row.dwt?.value ?? "",
          loaded_cargo_name: row.load?.value ?? null,
          created_by: "admin",
          data_date: row.no.value,
        }));
      await fetch(`${endpoint}/emps/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("EMP API failed", error);
      Notification.show("EMPデータ保存に失敗しました。", { position: "bottom-center" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Preview");

    const headers = Object.keys(data[0]);

    // Define columns
    worksheet.columns = headers.map((key) => ({
      header: PP_TABLE_HEADER[key as PPHeaderKey] ?? key,
      key,
      width: 5,
      style: key === "dwt" ? { numFmt: "#,##0" } : {},
    }));

    // Add rows
    data.forEach((row) => {
      const flatRow: Record<string, string | number> = {};
      for (const key of headers) {
        const val = row[key]?.value;
        if (val !== 0) {
          flatRow[key] = val ?? "";
        }
      }
      worksheet.addRow(flatRow);
    });

    // Apply background colors and track max width
    worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber - 1]; // Excel columns are 1-based
        const cellData = data[rowIndex - 2]?.[key];

        // Apply background color
        const bgColor = cellData?.bgColor;
        if (bgColor) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bgColor.replace("#", "") },
          };
        }

        // Auto-width: set column width based on content
        const text = String(cell.value ?? "");
        const currentWidth = worksheet.columns[colNumber - 1].width ?? 10;
        const estimatedWidth = text.length + 2;
        if (estimatedWidth > currentWidth) {
          worksheet.columns[colNumber - 1].width = estimatedWidth;
        }
      });
    });

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${cleanName}.xlsx`);
  };

  const columns = useMemo<ColumnDef<PPTemplate>[]>(() => {
    if (data.length === 0) return [];

    return Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }) => <span style={{ whiteSpace: "pre-wrap" }}>{String(getValue() ?? "")}</span>,
    }));
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="preview">
      <div className="d-flex">
        <div className="buttons">
          <Button theme="primary" onClick={onReset}>
            戻る
          </Button>
          <Button theme="primary" onClick={handleDownload}>
            ダウンロード
          </Button>
        </div>
        <div>{fileName}</div>
      </div>

      <table border={1} cellPadding={5}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id as PPHeaderKey;
                return (
                  <th key={header.id} style={{ whiteSpace: "nowrap", textAlign: "center" }}>
                    {PP_TABLE_HEADER[columnId] ?? flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const cellData = cell.getValue() as CellResult;

                return (
                  <td
                    key={cell.id}
                    style={{
                      whiteSpace: "pre-wrap",
                      maxWidth: "200px",
                      backgroundColor: cellData?.bgColor ?? "inherit",
                    }}
                  >
                    {(cellData?.value ?? "") === 0 ? "" : cellData?.value ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewTable;
