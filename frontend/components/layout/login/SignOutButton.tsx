import { handleSignOut } from "@/lib/msal/helper";
import { msalInstance } from "@/lib/msal/instance";
import { msGraphEndPoints } from "@/lib/msgraph/endpoints";
import { fetcher } from "@/lib/msgraph/fetcher";
import {
  Avatar,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useEffect, useState } from "react";
import useSWR from "swr";

const useStyles = makeStyles({
  buttonContent: {
    paddingRight: "8px",
    display: "flex",
    alignItems: "center",
    maxWidth: "250px",
    height: "60px",
    backgroundColor: "#272F47",
    color: tokens.colorBrandBackgroundInverted,
    ":hover:active": {
      backgroundColor: "#3d4766",
      color: "#fff",
    },
    ":hover": {
      backgroundColor: "#3d4766",
      color: "#fff",
    },
  },
  textContainer: {
    textAlign: "left",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    paddingRight: "8px",
    paddingLeft: "8px",
  },
  text: {
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    textAlign: "right",
  },
});

export default function SignOutButton() {
  const styles = useStyles();
  const account = msalInstance.getActiveAccount();

  const { data, isLoading } = useSWR<Blob>(msGraphEndPoints.graphMePhoto, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });
  const [imageSrc, setImageSrc] = useState<string | undefined>();

  useEffect(() => {
    if (data && data instanceof Blob) {
      const objectUrl = URL.createObjectURL(data);
      setImageSrc(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [data]);

  if (isLoading) return <div style={{ color: "white", marginRight: "10px" }}>読み込み中</div>;
  // if (error) return <div>画像の読み込みエラー</div>;

  return (
    <>
      <Menu positioning="below-end">
        <MenuTrigger disableButtonEnhancement>
          <Button
            className={styles.buttonContent}
            size="small"
            shape="square"
            appearance="primary"
            style={{ minWidth: 0 }}
          >
            <div className={styles.textContainer} style={{ flex: 1, overflow: "hidden" }}>
              <div className={styles.text} style={{ overflow: "hidden" }}>
                {account?.username}
              </div>
              <div className={styles.text} style={{ overflow: "hidden" }}>
                {account?.name}
              </div>
            </div>
            <Avatar name={account?.name} image={imageSrc ? { src: imageSrc } : undefined} />
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => handleSignOut()} key="logoutRedirect" style={{ textAlign: "left" }}>
              ログアウト
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </>
  );
}
