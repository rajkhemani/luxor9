import type { Metadata } from "next";
import { DubaiGenUiStream } from "@/components/dubai/DubaiGenUiStream";

export const metadata: Metadata = {
  title: "Dubai Launch Assistant",
  description:
    "Tell us your launch problem, review source-checked plans and previews, approve with one tap, and receive verifiable proof.",
};

export default function DubaiGenerativeUiPage() {
  return <DubaiGenUiStream />;
}
