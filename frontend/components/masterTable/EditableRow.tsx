import React, { useEffect, useState } from "react";
import { TextField } from "@vaadin/react-components/TextField.js";
import { Select } from "@vaadin/react-components/Select.js";

interface EditableRowProps {
  rowData: any;
  columns: { header: string; accessor: string }[];
  onChange: (newRow: any) => void;
  selectOptions?: Record<string, { label: string; value: any }[]>;
}

export default function EditableRow({ rowData, columns, onChange, selectOptions = {} }: EditableRowProps) {
  const [localData, setLocalData] = useState(rowData);

  useEffect(() => {
    setLocalData(rowData);
  }, [rowData]);

  const handleInputChange = (accessor: string, value: string) => {
    const updated = { ...localData, [accessor]: value };
    setLocalData(updated);
    onChange(updated);
  };

  return (
    <>
      {columns.map((col) => {
        const value = localData[col.accessor] ?? "";
        const options =
          selectOptions[col.accessor]?.map((opt) => ({
            label: opt.label,
            value: String(opt.value),
          })) ?? [];

        return (
          <td key={col.accessor} style={{ textAlign: "center" }}>
            {options.length > 0 ? (
              <Select
                value={String(value)}
                items={options}
                onValueChanged={(e) => handleInputChange(col.accessor, e.detail.value)}
                style={{ width: "100%" }}
              />
            ) : (
              <TextField
                value={String(value)}
                onChange={(e) => handleInputChange(col.accessor, e.target.value)}
                onFocus={(e) => e.target.focus()}
                style={{ width: "100%" }}
              />
            )}
          </td>
        );
      })}
    </>
  );
}
