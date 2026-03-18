import { Invoice } from './models';
import { format } from 'date-fns';

export function generateCIIXML(invoice: Invoice): string {
  const dateFormatted = format(invoice.issueDate, 'yyyyMMdd');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:a="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
                          xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <rsm:ExchangedDocumentContext>
        <ram:GuidelineSpecifiedDocumentContextParameter>
            <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID>
        </ram:GuidelineSpecifiedDocumentContextParameter>
    </rsm:ExchangedDocumentContext>
    <rsm:ExchangedDocument>
        <ram:ID>${invoice.id}</ram:ID>
        <ram:TypeCode>${invoice.typeCode}</ram:TypeCode>
        <ram:IssueDateTime>
            <a:DateTimeString format="102">${dateFormatted}</a:DateTimeString>
        </ram:IssueDateTime>
    </rsm:ExchangedDocument>
    <rsm:SupplyChainTradeTransaction>
        ${invoice.lines.map(line => `
        <ram:IncludedSupplyChainTradeLineItem>
            <ram:AssociatedDocumentLineDocument>
                <ram:LineID>${line.id}</ram:LineID>
            </ram:AssociatedDocumentLineDocument>
            <ram:SpecifiedTradeProduct>
                <ram:Name>${line.name}</ram:Name>
                ${line.hsCode ? `<ram:DesignatedProductClassification>
                    <ram:ClassCode listID="HS">${line.hsCode}</ram:ClassCode>
                </ram:DesignatedProductClassification>` : ''}
            </ram:SpecifiedTradeProduct>
            <ram:SpecifiedLineTradeAgreement>
                <ram:NetPriceProductTradePrice>
                    <ram:ChargeAmount>${line.unitPrice.toFixed(2)}</ram:ChargeAmount>
                </ram:NetPriceProductTradePrice>
            </ram:SpecifiedLineTradeAgreement>
            <ram:SpecifiedLineTradeDelivery>
                <ram:BilledQuantity unitCode="${line.unitCode}">${line.quantity}</ram:BilledQuantity>
            </ram:SpecifiedLineTradeDelivery>
            <ram:SpecifiedLineTradeSettlement>
                <ram:ApplicableTradeTax>
                    <ram:TypeCode>VAT</ram:TypeCode>
                    <ram:CategoryCode>${line.taxCategoryCode}</ram:CategoryCode>
                    <ram:RateApplicablePercent>${line.taxRate}</ram:RateApplicablePercent>
                </ram:ApplicableTradeTax>
                <ram:SpecifiedTradeSettlementLineMonetarySummation>
                    <ram:LineTotalAmount>${line.amount.toFixed(2)}</ram:LineTotalAmount>
                </ram:SpecifiedTradeSettlementLineMonetarySummation>
            </ram:SpecifiedLineTradeSettlement>
        </ram:IncludedSupplyChainTradeLineItem>`).join('')}
        
        <ram:ApplicableHeaderTradeAgreement>
            <ram:SellerTradeParty>
                <ram:Name>${invoice.seller.name}</ram:Name>
                ${invoice.seller.taxId ? `<ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">${invoice.seller.taxId}</ram:ID>
                </ram:SpecifiedTaxRegistration>` : ''}
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${invoice.seller.address?.postcode}</ram:PostcodeCode>
                    <ram:LineOne>${invoice.seller.address?.street}</ram:LineOne>
                    <ram:CityName>${invoice.seller.address?.city}</ram:CityName>
                    <ram:CountryID>${invoice.seller.address?.countryCode}</ram:CountryID>
                </ram:PostalTradeAddress>
            </ram:SellerTradeParty>
            <ram:BuyerTradeParty>
                <ram:Name>${invoice.buyer.name}</ram:Name>
                ${invoice.buyer.taxId ? `<ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">${invoice.buyer.taxId}</ram:ID>
                </ram:SpecifiedTaxRegistration>` : ''}
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${invoice.buyer.address?.postcode}</ram:PostcodeCode>
                    <ram:LineOne>${invoice.buyer.address?.street}</ram:LineOne>
                    <ram:CityName>${invoice.buyer.address?.city}</ram:CityName>
                    <ram:CountryID>${invoice.buyer.address?.countryCode}</ram:CountryID>
                </ram:PostalTradeAddress>
            </ram:BuyerTradeParty>
        </ram:ApplicableHeaderTradeAgreement>
        
        <ram:ApplicableHeaderTradeDelivery/>
        
        <ram:ApplicableHeaderTradeSettlement>
            <ram:InvoiceCurrencyCode>${invoice.currency}</ram:InvoiceCurrencyCode>
            <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
                <ram:LineTotalAmount>${invoice.totals.lineTotalAmount.toFixed(2)}</ram:LineTotalAmount>
                <ram:TaxBasisTotalAmount>${invoice.totals.lineTotalAmount.toFixed(2)}</ram:TaxBasisTotalAmount>
                <ram:TaxTotalAmount currencyID="${invoice.currency}">${invoice.totals.taxTotalAmount.toFixed(2)}</ram:TaxTotalAmount>
                <ram:GrandTotalAmount>${invoice.totals.grandTotalAmount.toFixed(2)}</ram:GrandTotalAmount>
                <ram:DuePayableAmount>${invoice.totals.duePayableAmount.toFixed(2)}</ram:DuePayableAmount>
            </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        </ram:ApplicableHeaderTradeSettlement>
    </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
