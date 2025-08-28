const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;

export const MASTER_CONFIGS: Record<string, { title: string; columns: any[]; endpoint: string }> = {
  operating_vessels: {
    title: "運航船社リスト",
    columns: [
      { header: "船社名", accessor: "name" },
      { header: "略称", accessor: "short_name" },
    ],
    endpoint: `${endpoint}/master/operating-vessels`,
  },
  ports: {
    title: "港リスト",
    columns: [
      { header: "港名", accessor: "name" },
      { header: "港略称", accessor: "short_name" },
    ],
    endpoint: `${endpoint}/master/ports`,
  },
  agents: {
    title: "代理店リスト",
    columns: [
      { header: "代理店名", accessor: "name" },
      { header: "略称", accessor: "short_name" },
    ],
    endpoint: `${endpoint}/master/agents`,
  },
  escort_locations: {
    title: "エスコート地リスト",
    columns: [
      { header: "航路名", accessor: "name" },
      { header: "航路略称", accessor: "short_name" },
    ],
    endpoint: `${endpoint}/master/escort-locations`,
  },
  loaded_cargo: {
    title: "積載貨物リスト",
    columns: [
      { header: "積貨詳細", accessor: "name" },
      { header: "略称", accessor: "short_name" },
    ],
    endpoint: `${endpoint}/master/loaded-cargo`,
  },
  berths: {
    title: "バースリスト",
    columns: [
      {
        header: "港略称",
        accessor: "port_id",
      },
      { header: "バース名", accessor: "name" },
      { header: "バース略称", accessor: "short_name" },
    ],
    endpoint: `${endpoint}/master/berths`,
  },
  master_towing: {
    title: "曳船マスターリスト",
    columns: [
      { header: "社名", accessor: "name" },
      { header: "社名略称", accessor: "short_name" },
      { header: "曳船名", accessor: "t_name" },
      { header: "PS", accessor: "ps" },
    ],
    endpoint: `${endpoint}/master/master-towing`,
  },
};

export const MasterDataLoader = async () => {
  const entries = Object.entries(MASTER_CONFIGS);

  const dataPairs = await Promise.all(
    entries.map(async ([key, config]) => {
      try {
        const res = await fetch(config.endpoint);
        const json = await res.json();

        let data: any[] = [];

        if (Array.isArray(json)) data = json;
        else if (Array.isArray(json.data)) data = json.data;

        return [key, data] as [string, any[]];
      } catch (e) {
        console.error(`Failed to fetch ${key}:`, e);
        return [key, []] as [string, any[]];
      }
    })
  );

  const result = Object.fromEntries(dataPairs);
  const portMap = new Map((result.ports || []).map((port: any) => [port.id, port]));

  if (Array.isArray(result.berths)) {
    result.berths = result.berths.map((berth: any) => {
      const port = portMap.get(berth.port_id) || {};
      return {
        ...berth,
        port_name: port.name || "",
        port_short_name: port.short_name || "",
      };
    });
  }

  console.log(result);
  return result;
};
