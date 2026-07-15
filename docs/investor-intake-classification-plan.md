# Investor intake and preliminary classification plan

## Purpose

Collect the facts a licensed reviewer needs to determine whether a proposed exempt-market purchase has an available prospectus exemption. The intake must never tell a partner or client that they are finally eligible, accepted, or suitable.

## Source basis

The redesign is based on the attached *Exempt Market Proficiency Course* booklet:

- PDF pages 19-20: exempt securities, KYC, suitability, and the prospectus-exemption framework.
- PDF page 20: individual accredited-investor financial-asset, income, and net-asset tests; Form 45-106F9 acknowledgement.
- PDF page 21: eligible-investor tests under the offering-memorandum exemption; family, friends, and close business associates; Forms 45-106F4/F5 and 45-106F12.
- PDF page 22: entity-only $150,000 minimum-amount route and the private-issuer route.
- PDF pages 24-25: investor types, distribution reporting, risk acknowledgements, illiquidity, loss, and limited-information warnings.
- PDF pages 98-100: relationship disclosure, KYC use, suitability, evidence of disclosure, and the need to keep personal circumstances, financial circumstances, objectives, risk profile, and time horizon current.

Current Ontario implementation should also be checked against the latest official rule and staff guidance before release. OSC Staff Notice 33-759 specifically identifies failures to collect and document other OM purchases within the preceding 12 months when applying the $30,000 and $100,000 limits.

Official references:

- [OSC Staff Notice 33-759 (July 2025 OSC Bulletin)](https://www.osc.ca/sites/default/files/2025-07/20250724_oscb_4829.pdf)
- [OSC unofficial consolidation of NI 45-106 and Form 45-106F4 schedules](https://www.osc.ca/sites/default/files/pdfs/irps/ni_20170401_45-106_unofficial-consolidation.pdf)

## Intake flow

1. Identity and purchaser type
   - Individual or entity.
   - Legal/contact details and entity name where applicable.

2. Nationality, residence, and jurisdiction
   - Collect nationality (or country of incorporation), country of residence, province/state, and city.
   - Ontario residents follow the structured preliminary classification.
   - Anyone outside Ontario is routed to licensed manual review for the applicable Canadian and foreign rules, tax residence, AML, and transfers.

3. Proposed investment
   - Issuer/fund, share class, quantity, unit price, total acquisition cost, and account type.
   - The amount is needed for OM-limit and entity minimum-amount checks.

4. KYC and suitability preparation
   - Objective, time horizon, risk tolerance, loss capacity, liquidity need, and private-market experience.
   - These facts prepare licensed review; they do not replace a suitability determination.

5. Financial qualification facts
   - Individual accredited indicators:
     - Net financial assets over $1,000,000, alone or with a spouse, net of related liabilities.
     - Net income over $200,000 in each of the two previous calendar years with a reasonable expectation for the current year.
     - Combined spousal net income over $300,000 on the same basis.
     - Net assets of at least $5,000,000, alone or with a spouse.
   - Individual eligible indicators:
     - Net assets over $400,000, alone or with a spouse.
     - Net income over $75,000 in each of the two previous calendar years with a reasonable expectation for the current year.
     - Combined spousal net income over $125,000 on the same basis.
   - Entity accredited indicators:
     - Net assets of at least $5,000,000 according to the most recent financial statements.
     - Another institutional accredited-investor category, to be identified and verified by the licensed team.

6. OM 12-month history
   - Capture the exact or best-estimate amount invested under the OM exemption in the preceding 12 months, excluding the proposed purchase.
   - Record whether a registered PM, investment dealer, or EMD provided the positive suitability assessment required for the higher individual eligible-investor limit.
   - Preliminary Ontario limits shown by the interface:
     - Non-eligible individual: $10,000.
     - Eligible individual: $30,000.
     - Eligible individual with qualifying registered advice: $100,000.
     - Accredited individual: no individual OM investment limit indicated by this check.

7. Relationship and entity-only facts
   - Record the relationship type, related person's name, and role for a possible FFBA or private-issuer route.
   - For the $150,000 minimum-amount route, confirm the purchaser is not an individual, buys as principal, pays the full cost at the trade, and purchases at least $150,000 of one issuer's securities.

8. Preliminary output and licensed handoff
   - Show the financial category: accredited indicator, eligible indicator, non-eligible, entity review, or cross-border review.
   - Show every candidate route supported by the recorded facts; do not silently choose one when several may apply.
   - Show the OM 12-month total and any preliminary limit warning.
   - Preserve the selected criteria, route candidates, relationship facts, limit calculation, and acknowledgements on the client profile.

## Required safeguards

- Use "indicator", "possible route", and "licensed review required" language.
- Never convert a threshold checkbox into final eligibility, trade acceptance, or suitability.
- Never treat a family/friend assertion as sufficient evidence; the issuer bears responsibility for establishing the relationship.
- Require fund- and exemption-specific risk acknowledgement forms in the licensed workflow, not through a generic checkbox.
- Keep evidence versions, timestamps, the rule version used, reviewer identity, and final exemption paragraph in the future persistent backend.
- Re-run the assessment whenever purchaser type, jurisdiction, investment amount, prior OM purchases, advice status, or relationship facts change.

## Implementation boundary

The current front end implements the structured intake, preliminary assessment, and profile readback. Production release still requires counsel/compliance approval, persistent audited storage, document-version control, reviewer workflow, and validation against the offering's actual issuer status and available exemption.
