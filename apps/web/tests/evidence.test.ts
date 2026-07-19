import { describe, expect, it } from "vitest";
import {
  buildEvidenceInspection,
  formatEvidenceRef,
  statusTone,
} from "../src/features/negotiation/evidence";
import { demoVendors } from "../src/features/negotiation/fixtures";

describe("evidence inspection", () => {
  it("maps fee statuses to distinct visual tones", () => {
    expect(statusTone("confirmed")).toBe("confirmed");
    expect(statusTone("waived")).toBe("concession");
    expect(statusTone("declined")).toBe("declined");
    expect(statusTone("vague")).toBe("caution");
    expect(statusTone("hidden")).toBe("caution");
    expect(statusTone("contradicted")).toBe("caution");
  });

  it("formats transcript evidence references", () => {
    const evidence = demoVendors[1].assertions[0].evidence;
    expect(formatEvidenceRef(evidence)).toBe("call-b lines 18-21");
  });

  it("builds an inspectable evidence view model from fixture data", () => {
    const vendor = demoVendors[1];
    const assertion = vendor.assertions[0];
    const inspection = buildEvidenceInspection(vendor, assertion);

    expect(inspection).toEqual({
      assertionId: "b-all-in",
      vendorName: "Queen City Movers",
      label: "All-in move",
      status: "confirmed",
      amountLabel: "$1,850",
      transcriptId: "call-b",
      lineRange: "18-21",
      quote: "That is eighteen fifty all-in, stairs included.",
      evidenceRef: "call-b lines 18-21",
      tone: "confirmed",
    });
  });

  it("marks vague and declined assertions with non-confirmed tones", () => {
    const vague = buildEvidenceInspection(demoVendors[0], demoVendors[0].assertions[1]);
    const declined = buildEvidenceInspection(demoVendors[2], demoVendors[2].assertions[1]);

    expect(vague.tone).toBe("caution");
    expect(vague.status).toBe("vague");
    expect(declined.tone).toBe("declined");
    expect(declined.status).toBe("declined");
  });
});
