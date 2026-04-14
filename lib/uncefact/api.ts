export const LOOKUP_API_BASE_URL = 'http://localhost:8000/lookup';

export interface CompanyApiResponse {
  legacy_company_id: string;
  jurisdiction_code: string;
  company_number: string;
  name: string;
  ocid: string | null;
  is_legal_entity: string;
  registered_address_street_address: string;
  registered_address_postal_code: string;
  registered_address_country: string;
  registered_address_locality: string;
  status: string;
  plei: string | null;
  city?: string | null;
}

/**
 * Fetches company details from the backend API using a company ID.
 * @param companyId The ID of the company to look up (e.g., gb/15863314)
 * @returns A promise resolving to the company details or null if not found/error
 */
export async function fetchCompanyDetails(companyId: string): Promise<CompanyApiResponse | null> {
  if (!companyId) return null;

  try {
    const response = await fetch(`${LOOKUP_API_BASE_URL}?company_id=${encodeURIComponent(companyId)}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Company not found: ${companyId}`);
      } else {
        console.error(`API error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data = await response.json() as CompanyApiResponse;
    
    // Use the locality field from the primary response as the city
    data.city = data.registered_address_locality || null;

    return data;
  } catch (error) {
    console.error('Failed to fetch company details:', error);
    return null;
  }
}

/**
 * Fetches city name from a postcode using Postcodes.io (UK) or Zippopotam.us (Global).
 * @param postcode The postcode to look up
 * @param countryCode The ISO 3166-1 alpha-2 country code
 */
export async function fetchCityFromPostcode(postcode: string, countryCode: string): Promise<string | null> {
  const cleanPostcode = postcode.trim();
  if (!cleanPostcode || !countryCode) return null;

  try {
    if (countryCode === 'GB') {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`);
      if (response.ok) {
        const data = await response.json();
        return data.result?.admin_district || data.result?.parish || null;
      }
    } else {
      const response = await fetch(`https://api.zippopotam.us/${countryCode}/${encodeURIComponent(cleanPostcode)}`);
      if (response.ok) {
        const data = await response.json();
        return data.places?.[0]?.['place name'] || null;
      }
    }
  } catch (error) {
    console.error('Failed to fetch city from postcode:', error);
  }
  return null;
}
