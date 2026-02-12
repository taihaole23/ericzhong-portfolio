import Editor from "@/components/font-maker/Editor";
import Script from "next/script";

import { Flex } from "@once-ui-system/core";

export default function Home() {
  return (
    <Flex fillWidth fillHeight horizontal="start" vertical="start" className="font-maker-wrapper">
      <Script src="/paper-full.min.js" strategy="beforeInteractive" />
      <Editor />
    </Flex>
  );
}
