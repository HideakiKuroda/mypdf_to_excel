"use client";

import React, { useRef, useState } from "react";
import { Button } from "@vaadin/react-components/Button.js";
import { Notification } from "@vaadin/react-components/Notification.js";
import { Upload } from "@vaadin/react-components/Upload.js";
import { PulseLoader } from "react-spinners";
import PreviewTable from "../previewTable/PreviewTable";

const PdfUpload = () => {
  const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(true); // New flag
  const maxFilesReached = useRef(false);
  const [converting, setConverting] = useState<boolean>(false);

  const fileRejectHandler = (event: any) => {
    Notification.show(`エラー: ${event.detail.error} '${event.detail.file.name}'`, { position: "bottom-center" });
  };

  const maxFilesReachedChangedHandler = (event: any) => {
    maxFilesReached.current = event.detail.value;
  };

  const onUploadSuccess = (event: any) => {
    const file = event.detail.file;
    if (file && file.name) {
      setUploadedFileName(file.name);
      Notification.show(`ファイル '${file.name}' がアップロードされました`, { position: "bottom-center" });
    }
  };

  const handleConvert = async () => {
    if (!uploadedFileName) return;
    try {
      setConverting(true);
      const response = await fetch(`${endpoint}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: uploadedFileName }),
      });

      if (!response.ok) {
        throw new Error("変換に失敗しました。");
      }

      const result = await response.json();
      const dataArray = JSON.parse(result);
      setJsonData(dataArray);
      Notification.show("PDFが正常にJSONへ変換されました。", { position: "bottom-center" });
      setShowUpload(false); // Hide upload after conversion success
    } catch (error: any) {
      Notification.show(error.message || "変換中にエラーが発生しました。", { position: "bottom-center" });
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      {showUpload && jsonData.length === 0 && (
        <div className="pdf-upload">
          <h2 className="home-title">PDFファイルをアップロードしてください。</h2>
          <p>使用可能なファイル形式 PDF (.pdf)</p>
          <Upload
            maxFiles={1}
            accept="application/pdf,.pdf"
            onFileReject={fileRejectHandler}
            onMaxFilesReachedChanged={maxFilesReachedChangedHandler}
            onUploadSuccess={onUploadSuccess}
            target={`${endpoint}/upload`}
            method="POST"
            i18n={{
              dropFiles: {
                one: "ここにファイルをドロップする",
              },
            }}
          >
            <Button slot="add-button" theme="primary">
              PDFを選択
            </Button>
          </Upload>
        </div>
      )}

      {showUpload && uploadedFileName && (
        <div className="pdf-convert">
          <p>
            アップロード済みファイル: <strong>{uploadedFileName}</strong>
          </p>
          <Button theme="primary" onClick={handleConvert}>
            変 換
          </Button>
          {converting && <PulseLoader color="#272f47" size={10} />}
        </div>
      )}

      {!showUpload && jsonData.length > 0 && (
        <PreviewTable
          initialData={jsonData}
          onReset={() => {
            setShowUpload(true);
            setJsonData([]);
            setUploadedFileName(null);
          }}
          fileName={uploadedFileName ?? ""}
        />
      )}
    </>
  );
};

export default PdfUpload;
