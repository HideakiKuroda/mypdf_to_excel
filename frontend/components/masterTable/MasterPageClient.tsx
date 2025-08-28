"use client";

import { ErrorMessage } from "../errorMessage/ErrorMessage";
import MasterTable from "./MasterTable";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";

interface MasterPageClientProps {
  config: {
    title: string;
    columns: any[];
    endpoint: string;
  };
}

export default function MasterPageClient({ config }: MasterPageClientProps) {
  return (
    <>
      {/* <MasterTable title={config.title} columns={config.columns} endpoint={config.endpoint} /> */}

      <UnauthenticatedTemplate>
        <ErrorMessage />
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <MasterTable title={config.title} columns={config.columns} endpoint={config.endpoint} />
      </AuthenticatedTemplate>
    </>
  );
}
