import { memo } from "react";

import type { PlatformInfo } from "../../utils/browser";

import styles from "./index.module.less";

interface PlatformFooterProps {
  platform: PlatformInfo;
}

function formatPlatformFooter({ os, pageType, runtime, harmonyTerminal }: PlatformInfo): string {
  return [
    os === "unknown" ? "未知" : os,
    pageType === "unknown" ? "未知" : pageType,
    runtime === "unknown" ? "未知" : runtime,
    harmonyTerminal ?? "未知",
  ].join(" · ");
}

const PlatformFooter = memo(({ platform }: PlatformFooterProps) => {
  return <footer className={styles.footer}>{formatPlatformFooter(platform)}</footer>;
});

PlatformFooter.displayName = "PlatformFooter";

export { PlatformFooter };
