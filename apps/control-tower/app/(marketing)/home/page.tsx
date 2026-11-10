import { AccountableRoute } from "@/components/marketing/AccountableRoute";
import { ContextBlueprint } from "@/components/marketing/ContextBlueprint";
import { FaqPrecision } from "@/components/marketing/FaqPrecision";
import { FinalCta } from "@/components/marketing/FinalCta";
import { HeroChamber } from "@/components/marketing/HeroChamber";
import { LiveOverviewStrip } from "@/components/marketing/LiveOverviewStrip";
import { MarketingStoreProvider } from "@/components/marketing/marketing-store";
import { ProblemFracture } from "@/components/marketing/ProblemFracture";
import { ProductChamber } from "@/components/marketing/ProductChamber";
import { ProofAndTrust } from "@/components/marketing/ProofAndTrust";
import { SignalRouteDiagram } from "@/components/marketing/SignalRouteDiagram";
import { StackConstellation } from "@/components/marketing/StackConstellation";
import { ValueLattice } from "@/components/marketing/ValueLattice";
import { VerificationTheater } from "@/components/marketing/VerificationTheater";

export default function MarketingHomePage() {
  return (
    <MarketingStoreProvider>
      <HeroChamber />
      <ProblemFracture />
      <AccountableRoute />
      <ValueLattice />
      <ProductChamber />
      <VerificationTheater />
      <StackConstellation />
      <SignalRouteDiagram />
      <LiveOverviewStrip />
      <ContextBlueprint />
      <ProofAndTrust />
      <FaqPrecision />
      <FinalCta />
    </MarketingStoreProvider>
  );
}
