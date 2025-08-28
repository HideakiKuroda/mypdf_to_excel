import { EmpData, MasterData } from "../masterTable/MasterDataContext";
import { extractRoute } from "./extractRoute";
import { findTowingShipNames } from "./findTowingShipNames";
import { isValidLine } from "./isValidLine";
import {
  BGCOLOR,
  CellResult,
  COLUMN1,
  COLUMN2,
  COLUMN3,
  COLUMN4,
  COLUMN5,
  COLUMN6,
  COLUMN7,
  COLUMN8,
  DEFAULT_BERTHS,
  EscortInfo,
  PPTemplate,
} from "./PPConfig";

export const parseRowToTemplate = (
  item: any,
  fileName: string,
  masterData: MasterData,
  empData: EmpData
): PPTemplate[] => {
  const no = extractNo(fileName);
  const b = extractB(item[COLUMN1]);
  const c = extractC(fileName);
  const shipName = extractShipName(item[COLUMN2]);
  const dwt = extractDWT(item[COLUMN3]);
  const isLNG = isLNGShip(item[COLUMN2], item[COLUMN4], item[COLUMN5], item[COLUMN6], item[COLUMN7], item[COLUMN8]);

  const port = getPort(item[COLUMN5], item[COLUMN6], masterData.ports);
  const workInfo = getWorkWithEscort(item[COLUMN5], item[COLUMN6], item[COLUMN7], item[COLUMN8], isLNG);

  const baseTemplate: PPTemplate = {
    no: { value: no },
    b: { value: b },
    c: { value: c },
    shipName: { value: shipName },
    ovc: getOvc(item[COLUMN2], masterData.operating_vessels),
    agent: getAgent(item[COLUMN2], masterData.agents),
    dwt: { value: dwt },
    load: getLoad(item[COLUMN4], masterData.loaded_cargo, shipName, dwt, no, empData),
    loadDetail: { value: "" },
    port,
    berth: { value: "", error: true, bgColor: BGCOLOR },
    work: { value: "", error: true, bgColor: BGCOLOR },
    ne: { value: 0 },
    na: { value: 0 },
    sk: { value: 0 },
    nk: { value: 0 },
    nt: { value: 0 },
    sg: { value: 0 },
    hk: { value: 0 },
    fp: { value: 0 },
    ek: { value: 0 },
    up: { value: 0 },
    gs: { value: 0 },
    a: { value: 0 },
    zz: { value: 0 },
    nnk: { value: 0 },
    or: { value: 0 },
    fk: { value: 0 },
    yk: { value: 0 },
    sb: { value: 0 },
    dm: { value: 0 },
    se: { value: 0 },
    ppnp: { value: "", error: true, bgColor: BGCOLOR },
  };

  // Build primary row
  const ppnp = getPpnp(workInfo.primaryWork, item[COLUMN5], item[COLUMN6]);
  const primaryRow = {
    ...baseTemplate,
    work: workInfo.primaryWork,
    berth: resolveBerth(workInfo.primaryWork, port, item[COLUMN5], item[COLUMN6], masterData.berths),
    ppnp,
  };

  const primaryShips = findTowingShipNames(item, masterData.master_towing);
  const completedPrimaryRow = getShip(primaryRow, primaryShips, masterData.master_towing);
  const getEscortBerth = (escort: any) => {
    const match = masterData.escort_locations.find((el) => {
      return el.name === escort.route;
    });
    let result = null;

    if (match) {
      result = { value: match.short_name };
    } else {
      result = { value: "OTHERS" };
    }

    if (isLNG) {
      if (match && match.short_name === "AKASHI") {
        result = { value: "AKASHIL" };
      } else {
        result = { value: "LNGES" };
      }
    }

    return result;
  };

  // Escort rows
  const escortRows = workInfo.escortWork.map((escort) => {
    const escortRow = {
      ...baseTemplate,
      work: { value: "E" },
      berth: getEscortBerth(escort),
      ppnp,
    };
    return getShip(escortRow, escort.ships, masterData.master_towing);
  });

  return [completedPrimaryRow, ...escortRows].filter((row) => row.work?.value !== "");
};

// (A: Ref.No)
const extractNo = (fileName: string): number => Number(fileName.match(/\d+/g)?.join("") ?? "");
// (B: Ref.No)
const extractB = (col: string): number => Number(col.match(/\d+/g)?.join("") ?? "");
// (C: Ref.No)
const extractC = (fileName: string): string => fileName.at(0) ?? "";
// (D: 船名)
const extractShipName = (col: string): string => col.split("\n")[0] ?? "";
// (E: 運航船社)
const getOvc = (raw: string, operatingVessels: { name: string; short_name: string }[]): CellResult => {
  const companyName = raw.split("\n")[2].split("/")[0].trim();
  const match = operatingVessels.find((item) => item.name.trim() === companyName);
  return match
    ? { value: match.short_name }
    : {
        value: companyName,
        error: true,
        bgColor: BGCOLOR,
      };
};
// (F: 代理店)
const getAgent = (raw: string, agents: { name: string; short_name: string }[]): CellResult => {
  const agentName = raw.split("\n")[3].split("/")[0].trim();
  const match = agents.find((item) => item.name.trim() === agentName);
  return match
    ? { value: match.short_name }
    : {
        value: agentName,
        error: true,
        bgColor: BGCOLOR,
      };
};
// (G: DWT)
const extractDWT = (col: string): number => Number(col.split("\n")[0].replace(/,/g, "") ?? "");
// (H: 積荷)
const getLoad = (
  raw: string,
  loaded_cargo: { name: string; short_name: string }[],
  shipName: string,
  dwt: number,
  no: number,
  empData: EmpData
): CellResult => {
  const load = raw.split("\n")[0].replace(/\s+/g, "");

  // If load matches 空船 or ｲﾅｰﾄ or is empty
  if (/(空船|ｲﾅｰﾄ)/.test(load)) {
    const hit = empData.find((e) => {
      const condition = e.ship_name === shipName && e.dw === dwt && Number(no) > Number(e.data_date);
      return condition;
    });

    return {
      value: `EMP (${hit?.loaded_cargo_name ?? ""})`,
    };
  }

  const match = loaded_cargo.find((item) => item.name.trim() === load);
  return match
    ? { value: match.short_name }
    : {
        value: load,
        error: true,
        bgColor: BGCOLOR,
      };
};

// (J: 港)
const hasStarboard = (text: string): boolean => /右舷/.test(text);
const hasPortside = (text: string): boolean => /左舷/.test(text);
const containsStarboardOrPortside = (text: string): boolean => hasStarboard(text) || hasPortside(text);
const containsAssistAnchor = (text: string): boolean => /(ｱﾝｶｰ|)/.test(text);
const findPortShortName = (text: string, ports: { name: string; short_name: string }[]): string | null => {
  for (const port of ports) {
    if (text.includes(port.name)) {
      return port.short_name;
    }
  }
  return null;
};
const getPort = (raw5: string, raw6: string, ports: { name: string; short_name: string }[]): CellResult => {
  const raw5HasDock = containsStarboardOrPortside(raw5);
  const raw6HasDock = containsStarboardOrPortside(raw6);

  if (raw5HasDock) {
    const portShort = findPortShortName(raw5, ports);
    if (portShort) return { value: portShort };
  }

  if (raw6HasDock) {
    const portShort = findPortShortName(raw6, ports);
    if (portShort) return { value: portShort };
  }

  if (!raw5HasDock && !raw6HasDock && containsAssistAnchor(raw6)) {
    const portShort = findPortShortName(raw6, ports);
    if (portShort) return { value: portShort };
  }

  if (raw5HasDock || raw6HasDock) {
    const portShort = findPortShortName(raw6, ports);
    if (portShort) return { value: portShort };
  }

  return { value: "", error: true, bgColor: BGCOLOR };
};

// (K: バース)
const isLNGShip = (...cols: string[]): boolean => cols.some((col) => col.includes("ＬＮＧ"));
const resolveBerth = (
  work: CellResult,
  port: CellResult,
  raw5: string,
  raw6: string,
  berths: MasterData["berths"]
): CellResult => {
  if (work.value && ["U", "M", "A", "S"].includes(work.value as string) && port.value) {
    const berthMatch = berths.find(
      (el) => el.port_short_name === port.value && (raw5.includes(el.name) || raw6.includes(el.name))
    );

    if (berthMatch) {
      return { value: berthMatch.short_name };
    }
  }

  return { value: "", error: true, bgColor: BGCOLOR };
};

// (L: 作業)
const parseEscortInfo = (raw7: string, isLNG: boolean): EscortInfo[] => {
  const result: { route: string; ships: string[] }[] = [];
  if (!raw7) return result;
  const separated = raw7.split(/(?=明石|備讃東|備讃北|備讃南|来島|水島)/);
  for (const line of separated) {
    const routeMatch = line.match(/^(明石|備讃東|備讃北|備讃南|来島|水島)/);
    if (!routeMatch) continue;

    const route = routeMatch[0];
    if (route === "備讃北") continue;

    // 時間の後のテキストを抽出（例: 03:15-03:35 の後の部分）
    const afterTime = line.split(/\d{2}:\d{2}-\d{2}:\d{2}/)[1];
    if (!afterTime) continue;

    // \nで分割して船名を抽出
    const ships = afterTime
      .split(/(?=\n|\s)/)
      .map((s) => s.trim())
      .filter((s) => s); // 空文字除外

    if (ships.length) {
      result.push({ route, ships });
    }
  }

  if (isLNG) {
    const updatedResult: EscortInfo[] = [];
    const lngGroup: EscortInfo[] = [];

    for (const entry of result) {
      if (entry.route === "明石") {
        const akashiRoute = entry.route;
        const akashiShips = [entry.ships[entry.ships.length - 1]];
        updatedResult.push({ route: akashiRoute, ships: akashiShips });
      } else {
        lngGroup.push(entry);
      }
    }

    if (lngGroup.length) {
      const combinedRoute = lngGroup[0].route;
      const combinedShips = lngGroup[0].ships;
      updatedResult.push({ route: combinedRoute, ships: combinedShips });
    }

    return updatedResult;
  }

  return result;
};

export const parseEscortInfo2 = (raw5: string, raw6: string, raw8: string): EscortInfo[] => {
  const filterRelevantLines = (raw: string): string[] => {
    const lines = raw.split(/\n/);
    const results: string[] = [];

    const isSharpContextLine = (line: string) => /#/.test(line);
    const isPattenContextLine = (line: string) =>
      /[^:\s]{1,10}[:：][^\s　]{1,10}/.test(line) || /[^\s→\-]{1,10}[→\-]{1,2}[^\s→\-]{1,10}/.test(line);
    const hasNumber = (line: string) => /\d/.test(line);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!/ｴｽｺｰﾄ|ES/i.test(line) || /交代/.test(line)) continue;

      const before = lines[i - 1]?.trim() ?? "";
      const after = lines[i + 1]?.trim() ?? "";

      let combinedLine = "";
      if (before && isSharpContextLine(before)) {
        combinedLine = before + line;
      } else if (after && isPattenContextLine(after) && !hasNumber(after)) {
        combinedLine = line + "　" + after;
      } else {
        combinedLine = line;
      }

      if (/((ｴｽｺｰﾄ|ES)\s*[:：]\s*)$/i.test(combinedLine)) continue;
      results.push(combinedLine);
    }

    return results;
  };

  const lines = [...filterRelevantLines(raw5), ...filterRelevantLines(raw6), ...filterRelevantLines(raw8)];
  const results: EscortInfo[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: Multi-escort in one line => 速吸:ｲｸﾀ　伊予灘:ｼﾘｳｽ 平郡:ｶｲﾀ
    const multiMatch = [...trimmed.matchAll(/([^\s:：]+)[：:]\s*([^\s　、,]+)/g)];
    if (multiMatch.length > 1) {
      // console.log("multiMatch", trimmed);

      for (const match of multiMatch) {
        const route = match[1].trim();
        const ship = match[2].trim();
        if (ship) {
          results.push({ route, ships: [ship] });
        }
      }
      continue;
    }

    // Pattern 2: Transition style => (ﾀﾂﾀ→ﾊﾙﾀ)
    const transitionMatch = trimmed.match(/\(([^→\-\(\)]+)[→\-]+([^→\-\(\)]+)\)/);
    if (transitionMatch) {
      const from = transitionMatch[1].trim();
      const to = transitionMatch[2].trim();
      const ships = [from, to];
      const route = trimmed.split(/～|-/)[0];
      results.push({ route, ships });
      // console.log("(ﾀﾂﾀ→ﾊﾙﾀ)", trimmed);
      continue;
    }

    // Pattern 3: ここで「route + 途中にｴｽｺｰﾄ + 船名」パターンを改良 例: 交差部～播磨灘#1by: ｴｽｺｰﾄ:ｵｵｼｵ
    const routeEscortShipMatch = trimmed.match(/(.+?[#by]+)[：:]*.*?(ｴｽｺｰﾄ|ES)[:：]?\s*(.+)/i);
    if (routeEscortShipMatch && !transitionMatch) {
      const route = extractRoute(trimmed, DEFAULT_BERTHS);
      const ship = routeEscortShipMatch[4]?.trim() ?? routeEscortShipMatch[3]?.trim();
      if (ship) {
        results.push({ route: route, ships: [ship] });
        // console.log("routeEscortShipMatch", trimmed);
        continue;
      }
    }

    // Pattern 4: Route info followed by escort => 播磨灘#1by-日出ｴｽｺｰﾄ:ﾚｲｺｳ
    const routeShipMatch = trimmed.match(/([^\s:：]+)[\s\-～]*[^\s]*[ｴｽｺｰﾄ|ES][:：]?\s*(.+)/i);
    if (routeShipMatch) {
      const route = extractRoute(trimmed, DEFAULT_BERTHS);
      const ship = trimmed.split(/ｴｽｺｰﾄ:|ES:/)[1];
      if (ship) {
        results.push({ route: route, ships: [ship] });
      }
      continue;
    }

    // Pattern 5: fallback multi escort single line
    const fallbackMultiMatch = [...trimmed.matchAll(/([^\s:：]+)[：:]\s*([^\s　、,]+)/g)];
    if (fallbackMultiMatch.length > 0) {
      // console.log("single line", trimmed);

      for (const match of fallbackMultiMatch) {
        const route = match[1].trim();
        const ship = match[2].trim();
        if (ship) {
          results.push({ route, ships: [ship] });
        }
      }
    }
  }

  return results;
};

const getWorkWithEscort = (
  raw5: string,
  raw6: string,
  raw7: string,
  raw8: string,
  isLNG: boolean
): {
  primaryWork: CellResult;
  escortWork: { route: string; ships: string[] }[];
} => {
  const primaryWork = getWork(raw5, raw6);
  const escortWork: { route: string; ships: string[] }[] = [];

  // Check if escort work exists
  const escortInfo = parseEscortInfo(raw7, isLNG);
  const escortInfo2 = parseEscortInfo2(raw5, raw6, raw8);
  if (escortInfo.length) escortWork.push(...escortInfo);
  if (escortInfo2.length) escortWork.push(...escortInfo2);
  return { primaryWork, escortWork };
};

const getWork = (raw5: string, raw6: string): CellResult => {
  const raw5HasDock = containsStarboardOrPortside(raw5);
  const raw6HasDock = containsStarboardOrPortside(raw6);
  const raw6HasAssist = containsAssistAnchor(raw6);

  if (raw5HasDock && raw6HasDock) return { value: "S" };
  if (raw5HasDock) return { value: "U" };
  if (raw6HasDock) return { value: "M" };
  if (!raw5HasDock && !raw6HasDock && raw6HasAssist) return { value: "A" };

  return { value: "", error: true, bgColor: BGCOLOR };
};

// (M~Y: NE NA SK	NK NT SG HK	FP EK UP GS A ZZ)
const getShip = (
  pprow: PPTemplate,
  ships: string[],
  towing: { name: string; short_name: string; t_name: string; ps: string }[]
): PPTemplate => {
  // console.log(pprow.b, pprow.work, ships);
  ships.forEach((ship) => {
    const trimmed = ship.trim();
    const mark = towing.find((el) => el.t_name === trimmed)?.short_name ?? "";

    if (!mark) {
      pprow.zz = { value: (Number(pprow.zz?.value) || 0) + 1 };
    } else {
      const key = mark.toLowerCase();
      pprow[key] = { value: (Number(pprow[key]?.value) || 0) + 1 };
    }
  });

  return pprow;
};

// AG : ppnp
const getPpnp = (work: CellResult, raw5: string, raw6: string): CellResult => {
  const keywords = ["部埼", "関埼", "和田"];
  const isRelevantWork = ["U", "M", "A", "S"].includes(work.value as string);
  if (!isRelevantWork) return { value: "", error: true, bgColor: BGCOLOR };

  const hasDirection = (text: string) => /右舷|左舷|ｱﾝｶｰ|/.test(text);
  const oppositeText = hasDirection(raw5) ? raw6 : hasDirection(raw6) ? raw5 : null;
  if (!oppositeText) return { value: "", error: true, bgColor: BGCOLOR };

  const lines = oppositeText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const keywordIndex = lines.findIndex((line) => keywords.some((kw) => line.includes(kw)));
  if (keywordIndex === -1) return { value: "", error: true, bgColor: BGCOLOR };

  for (let i = keywordIndex + 1; i < Math.min(lines.length, keywordIndex + 6); i++) {
    const line = lines[i];
    if (!line) continue;

    if (isValidLine(line)) return { value: line };
  }

  return { value: "", error: true, bgColor: BGCOLOR };
};
