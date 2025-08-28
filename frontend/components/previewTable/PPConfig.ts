export const BGCOLOR = "#E6B8B7";
export const COLUMN1 = "№";
export const COLUMN2 = "船  名／国  籍\n運航者／代理店";
export const COLUMN3 = "D/W\nG/T";
export const COLUMN4 = "積荷内容\n(ｽﾗｽﾀｰ)";
export const COLUMN5 = "乗船地";
export const COLUMN6 = "下船地";
export const COLUMN7 = "航路通報";
export const COLUMN8 = "備考";

export interface PPTemplate {
  no: CellResult;
  b: CellResult;
  c: CellResult;
  shipName: CellResult;
  ovc: CellResult;
  agent: CellResult;
  dwt: CellResult;
  load: CellResult;
  loadDetail: CellResult;
  port: CellResult;
  berth: CellResult;
  work: CellResult;
  ne: CellResult;
  na: CellResult;
  sk: CellResult;
  nk: CellResult;
  nt: CellResult;
  sg: CellResult;
  hk: CellResult;
  fp: CellResult;
  ek: CellResult;
  up: CellResult;
  gs: CellResult;
  a: CellResult;
  zz: CellResult;
  ppnp: CellResult;
  [key: string]: CellResult;
}

export interface CellResult {
  value: string | number;
  error?: boolean;
  bgColor?: string;
}

export const PP_TABLE_HEADER = {
  no: "No",
  b: "B",
  c: "C",
  shipName: "船名",
  ovc: "運航船社",
  agent: "代理店",
  dwt: "DWT",
  load: "積荷",
  loadDetail: "積荷詳細",
  port: "港",
  berth: "バース",
  work: "作業",
  ne: "NE",
  na: "NA",
  sk: "SK",
  nk: "NK",
  nt: "NT",
  sg: "SG",
  hk: "HK",
  fp: "FP",
  ek: "EK",
  up: "UP",
  gs: "GS",
  a: "A",
  zz: "ZZ",
  nnk: "NNK",
  or: "OR",
  fk: "FK",
  yk: "YK",
  sb: "SB",
  dm: "DM",
  se: "SE",
  ppnp: "前港・次港",
};

export type PPHeaderKey = keyof typeof PP_TABLE_HEADER;

export interface EscortInfo {
  route: string;
  ships: string[];
}

export const DEFAULT_BERTHS = ["明石", "備讃東", "備讃南", "来島", "水島"];
