import { Home20Regular, Book20Regular, TableRegular } from "@fluentui/react-icons";

interface NavItem {
  label: string;
  route?: string;
  icon?: React.ReactNode;
  showActiveIcon?: boolean;
  id?: string;
  children?: NavItem[];
}

export const navConfig: NavItem[] = [
  {
    label: "ホーム",
    route: "/",
    icon: <Home20Regular color="#272f47" />,
    showActiveIcon: false,
  },
  {
    label: "PDF変換",
    route: "/pdf",
    icon: <Book20Regular color="#272f47" />,
    showActiveIcon: false,
  },
  {
    label: "マスター管理",
    route: "/master",
    icon: <TableRegular color="#272f47" />,
    showActiveIcon: false,
    children: [
      {
        label: "運航船社",
        id: "operating_vessels",
        showActiveIcon: true,
      },
      { label: "港", id: "ports", showActiveIcon: true },
      { label: "代理店リスト", id: "agents", showActiveIcon: true },
      {
        label: "エスコート地",
        id: "escort_locations",
        showActiveIcon: true,
      },
      { label: "積載貨物", id: "loaded_cargo", showActiveIcon: true },
      { label: "バース", id: "berths", showActiveIcon: true },
      { label: "曳船マスター", id: "master_towing", showActiveIcon: true },
    ].map((item) => ({
      ...item,
      route: `/master/${item.id}`,
    })),
  },
];
