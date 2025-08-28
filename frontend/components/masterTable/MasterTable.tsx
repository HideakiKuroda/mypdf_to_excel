import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@vaadin/react-components/Button.js";
import { TextField } from "@vaadin/react-components/TextField.js";
import { Select } from "@vaadin/react-components/Select.js";
import { Dialog } from "@vaadin/react-components/Dialog.js";
import { Edit16Filled, Delete16Filled, Save16Filled, ArrowUndo16Filled } from "@fluentui/react-icons";
import { Notification } from "@vaadin/react-components/Notification.js";
import EditableRow from "./EditableRow";
import { useMasterData } from "./MasterDataContext";

interface RowData {
  id: number;
  [key: string]: any;
}

interface MasterTableProps {
  title: string;
  columns: { header: string; accessor: string }[];
  endpoint: string;
}

export default function MasterTable({ title, columns, endpoint }: MasterTableProps) {
  const [data, setData] = useState<RowData[]>([]);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<RowData | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addRowData, setAddRowData] = useState<RowData>({} as RowData);
  const [globalFilter, setGlobalFilter] = useState("");

  const { masterData } = useMasterData();

  const selectOptions = useMemo(() => {
    const options: Record<string, { label: string; value: any }[]> = {};

    // Special case: if table is berths, use ports as select options
    if (endpoint.includes("/master/berths")) {
      options["port_id"] = (masterData.ports || []).map((p) => ({
        label: p.short_name,
        value: p.id,
      }));
    }

    // You can add more special cases here as needed

    return options;
  }, [masterData, endpoint]);

  const [modal, setModal] = useState<{
    open: boolean;
    action: "delete" | "save" | null;
    rowId: number | null;
    payload?: RowData | null;
  }>({ open: false, action: null, rowId: null, payload: null });

  const handleFetch = async () => {
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setData(Array.isArray(json) ? json : json.data || []);
    } catch (error) {
      console.error("Fetch failed:", error);
      setData([]);
    }
  };

  useEffect(() => {
    handleFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (id: number, updatedRow: RowData) => {
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedRow, updated_by: "admin" }),
      });
      if (res.ok) {
        setData((prev) => prev.map((row) => (row.id === id ? updatedRow : row)));
        setEditingRowId(null);
        setEditingRowData(null);
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      Notification.show(error?.message || "変換中にエラーが発生しました。", { position: "bottom-center" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${endpoint}/${id}?deleted_by=admin`, {
        method: "DELETE",
      });
      if (res.ok) {
        setData((prev) => prev.filter((r) => r.id !== id));
        if (editingRowId === id) {
          setEditingRowId(null);
          setEditingRowData(null);
        }
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      Notification.show(error.message || "変換中にエラーが発生しました。", { position: "bottom-center" });
    }
  };

  const validateRowData = (rowData: RowData) => {
    const missingFields = columns
      .filter((col) => col.accessor !== "ps") // exclude ps
      .filter((col) => !rowData[col.accessor]); // check if value is empty or falsy

    return missingFields.length === 0;
  };

  const tableColumns = useMemo<ColumnDef<RowData>[]>(() => {
    const cols = columns.map((col) => ({
      header: col.header,
      accessorKey: col.accessor,
      cell: ({ row }: any) => {
        if (editingRowId === row.original.id) {
          return null;
        }

        const value = row.getValue(col.accessor);

        // 特別な変換: /master/berths のとき port_id を short_name に変換
        if (endpoint.includes("/master/berths") && col.accessor === "port_id" && masterData?.ports) {
          const port = masterData.ports.find((p: any) => String(p.id) === String(value));
          return port?.short_name ?? "";
        }

        return value;
      },
    }));

    cols.push({
      header: "アクション",
      cell: ({ row }) => {
        const id = row.original.id;
        if (editingRowId === id) {
          return (
            <>
              <Button
                theme="secondary small"
                onClick={() => setModal({ open: true, action: "save", rowId: id, payload: editingRowData })}
              >
                <Save16Filled />
              </Button>
              <Button
                theme="secondary error small"
                onClick={() => {
                  setEditingRowId(null);
                  setEditingRowData(null);
                }}
              >
                <ArrowUndo16Filled />
              </Button>
            </>
          );
        }
        return (
          <>
            <Button
              theme="small"
              onClick={() => {
                setEditingRowId(id);
                const rowData = data.find((r) => r.id === id) || null;
                setEditingRowData(rowData);
              }}
            >
              <Edit16Filled />
            </Button>
            <Button theme="error small" onClick={() => setModal({ open: true, action: "delete", rowId: id })}>
              <Delete16Filled />
            </Button>
          </>
        );
      },
      accessorKey: "",
    });

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, data, editingRowId, editingRowData]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="master">
      <div className="title-container">
        <div className="master-title">{title}</div>
      </div>

      <div className="search-container">
        <div>
          <span>検索: </span>
          <TextField
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ marginBottom: "1rem" }}
          />
        </div>
        <Button theme="primary" onClick={() => setAddModalOpen(true)}>
          新規登録
        </Button>
      </div>

      <table border={1} cellPadding={6} style={{ width: "100%" }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} style={{ textAlign: "center" }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => {
            if (editingRowId === row.original.id && editingRowData) {
              return (
                <tr key={row.id}>
                  <EditableRow
                    rowData={editingRowData}
                    columns={columns}
                    onChange={setEditingRowData}
                    selectOptions={selectOptions}
                  />
                  {/* Action cell */}
                  <td style={{ textAlign: "center" }}>
                    <Button
                      theme="secondary small"
                      onClick={() =>
                        setModal({ open: true, action: "save", rowId: row.original.id, payload: editingRowData })
                      }
                    >
                      <Save16Filled />
                    </Button>
                    <Button
                      theme="secondary error small"
                      onClick={() => {
                        setEditingRowId(null);
                        setEditingRowData(null);
                      }}
                    >
                      <ArrowUndo16Filled />
                    </Button>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ textAlign: "center" }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 10 }}>
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          前へ
        </Button>
        <span style={{ margin: "0 1rem" }}>
          {table.getState().pagination.pageIndex + 1}/{table.getPageCount()} ページ
        </span>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          次へ
        </Button>
      </div>

      {/* Confirm Delete/Save Modal */}
      <Dialog opened={modal.open} onOpenedChanged={({ detail }) => setModal((m) => ({ ...m, open: detail.value }))}>
        <div style={{ padding: "1rem", paddingTop: "0" }}>
          <h3>確認</h3>
          <p>
            {modal.action === "delete"
              ? "このデータを削除してもよろしいですか？"
              : "この変更を保存してもよろしいですか？"}
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button
              theme="primary"
              onClick={() => {
                if (modal.action === "delete" && modal.rowId !== null) {
                  handleDelete(modal.rowId);
                } else if (modal.action === "save" && modal.rowId !== null && modal.payload) {
                  if (!validateRowData(modal.payload)) {
                    Notification.show("必須項目をすべて入力してください。", { position: "bottom-center" });
                    return;
                  }
                  handleSave(modal.rowId, modal.payload);
                  setEditingRowId(null);
                  setEditingRowData(null);
                }
                setModal({ open: false, action: null, rowId: null, payload: null });
              }}
            >
              は い
            </Button>
            <Button
              theme="tertiary"
              onClick={() => setModal({ open: false, action: null, rowId: null, payload: null })}
            >
              いいえ
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add Row Modal */}
      <Dialog opened={addModalOpen} onOpenedChanged={({ detail }) => setAddModalOpen(detail.value)}>
        <div style={{ padding: "1rem", paddingTop: "0", minWidth: "300px" }}>
          <h3>新規登録</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            {columns.map((col) => (
              <div key={col.accessor} style={{ flex: 1 }}>
                {selectOptions[col.accessor] ? (
                  <Select
                    label={col.header}
                    value={String(addRowData[col.accessor] ?? "")}
                    items={(selectOptions[col.accessor] ?? []).map((opt) => ({
                      ...opt,
                      value: String(opt.value),
                    }))}
                    onValueChanged={(e) => setAddRowData((prev) => ({ ...prev, [col.accessor]: e.detail.value }))}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <TextField
                    label={col.header}
                    value={addRowData[col.accessor] ?? ""}
                    onChange={(e) => setAddRowData((prev) => ({ ...prev, [col.accessor]: e.target.value }))}
                    style={{ marginBottom: "0.5rem" }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button
              theme="primary"
              onClick={async () => {
                if (!validateRowData(addRowData)) {
                  Notification.show("必須項目をすべて入力してください。", { position: "bottom-center" });
                  return;
                }

                try {
                  const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...addRowData, created_by: "admin" }),
                  });
                  if (res.ok) {
                    setAddModalOpen(false);
                    setAddRowData({} as RowData);
                    handleFetch();
                  }
                } catch (error) {
                  console.error("Add failed:", error);
                }
              }}
            >
              追 加
            </Button>
            <Button theme="tertiary" onClick={() => setAddModalOpen(false)}>
              キャンセル
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
