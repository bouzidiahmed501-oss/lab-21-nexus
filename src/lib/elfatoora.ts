/**
 * Elfatoora UBL 2.1 XML generator for Tunisian electronic invoicing (DGI).
 * Generates a simplified UBL Invoice XML compliant with Elfatoora specifications.
 */

export interface ElfatooraInvoice {
  numero: string;
  date_facture: string;
  devise: string;
  fournisseur: {
    raison_sociale: string;
    matricule_fiscal: string;
    adresse?: string;
    ville?: string;
    pays_code?: string;
  };
  client: {
    raison_sociale: string;
    matricule_fiscal: string;
    adresse?: string;
    ville?: string;
    pays_code?: string;
  };
  lignes: {
    designation: string;
    quantite: number;
    prix_unitaire: number;
    tva_pct: number;
    total_ht: number;
  }[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  timbre: number;
  net_a_payer: number;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function partyXml(tag: string, p: ElfatooraInvoice["fournisseur"]): string {
  return `
    <cac:${tag}>
      <cac:Party>
        <cac:PartyName><cbc:Name>${esc(p.raison_sociale)}</cbc:Name></cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${esc(p.adresse || "")}</cbc:StreetName>
          <cbc:CityName>${esc(p.ville || "")}</cbc:CityName>
          <cac:Country><cbc:IdentificationCode>${p.pays_code || "TN"}</cbc:IdentificationCode></cac:Country>
        </cac:PostalAddress>
        <cac:PartyTaxScheme>
          <cbc:CompanyID>${esc(p.matricule_fiscal)}</cbc:CompanyID>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:PartyTaxScheme>
      </cac:Party>
    </cac:${tag}>`;
}

export function generateElfatooraXml(inv: ElfatooraInvoice): string {
  const lines = inv.lignes.map((l, i) => `
    <cac:InvoiceLine>
      <cbc:ID>${i + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${l.quantite}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${inv.devise}">${l.total_ht.toFixed(3)}</cbc:LineExtensionAmount>
      <cac:Item><cbc:Name>${esc(l.designation)}</cbc:Name></cac:Item>
      <cac:Price><cbc:PriceAmount currencyID="${inv.devise}">${l.prix_unitaire.toFixed(3)}</cbc:PriceAmount></cac:Price>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${inv.devise}">${(l.total_ht * l.tva_pct / 100).toFixed(3)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${inv.devise}">${l.total_ht.toFixed(3)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${inv.devise}">${(l.total_ht * l.tva_pct / 100).toFixed(3)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:Percent>${l.tva_pct}</cbc:Percent>
            <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
    </cac:InvoiceLine>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${esc(inv.numero)}</cbc:ID>
  <cbc:IssueDate>${inv.date_facture}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${inv.devise}</cbc:DocumentCurrencyCode>
  ${partyXml("AccountingSupplierParty", inv.fournisseur)}
  ${partyXml("AccountingCustomerParty", inv.client)}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${inv.devise}">${inv.total_tva.toFixed(3)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${inv.devise}">${inv.total_ht.toFixed(3)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${inv.devise}">${inv.total_ht.toFixed(3)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${inv.devise}">${inv.total_ttc.toFixed(3)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${inv.devise}">${inv.net_a_payer.toFixed(3)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${lines}
</Invoice>`;
}
