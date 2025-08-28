"use client";

import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import PdfUpload from "@/components/pdfUpload/PdfUpload";
import { ErrorMessage } from "@/components/errorMessage/ErrorMessage";

export default function PdfPageClient() {
  return (
    <>
      {/* <PdfUpload /> */}
      <UnauthenticatedTemplate>
        <ErrorMessage />
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <PdfUpload />
      </AuthenticatedTemplate>
    </>
  );
}
