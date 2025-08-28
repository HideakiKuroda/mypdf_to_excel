import { EmpData, MasterData } from "../masterTable/MasterDataContext";
import { parseRowToTemplate } from "./parseRowToTemplate";
import { PPTemplate } from "./PPConfig";

export const PPconvert = (
  initialData: any[],
  fileName: string,
  masterData: MasterData,
  empData: EmpData
): PPTemplate[] => {
  return initialData.flatMap((item) => parseRowToTemplate(item, fileName, masterData, empData));
};
