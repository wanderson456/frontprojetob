
export interface ElectionResult {
  municipalityCode: string;
  municipalityName: string;
  year: number;
  round: number;
  offices: OfficeResult[];
}

export interface OfficeResult {
  officeCode: number;
  officeName: string;
  totalVotes: number;
  validVotes: number;
  nominalVotes: number;
  legendVotes: number;
  blankVotes: number;
  nullVotes: number;
  candidates: CandidateResult[];
  parties: PartyResult[];
}

export interface CandidateResult {
  candidateId: string;
  candidateNumber: number;
  candidateName: string;
  partyNumber: number;
  partyAbbreviation: string;
  partyName: string;
  votes: number;
  percentage: number;
}

export interface PartyResult {
  partyNumber: number;
  partyAbbreviation: string;
  partyName: string;
  nominalVotes: number;
  legendVotes: number;
  totalVotes: number;
  percentage: number;
}

export interface CandidateListItem {
  id: number;
  sqCandidato: string;
  candidateNumber: string | null;
  candidateName: string;
  ballotName: string | null;
  officeCode: number;
  officeName: string;
  partyNumber: number | null;
  partyAbbreviation: string | null;
  partyName: string | null;
  totalVotes: number;
}

export interface CandidateListResponse {
  items: CandidateListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface CandidateGeoMunicipality {
  ibgeCode: string;
  municipality: string;
  votes: number;
  latitude: number | null;
  longitude: number | null;
}

export interface GeoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CandidateGeoResponse {
  sqCandidato: string | number;
  year: number;
  round: number;
  municipalities: CandidateGeoMunicipality[];
  pagination: GeoPagination;
}


export interface SectionItem {
  municipalityCode: string;
  zone: number;
  section: number;
  latitude: number | null;
  longitude: number | null;
  votes: number;
}

export interface SectionResponse {
  items: SectionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SectionSearchParams {
  municipalityCode: string;
  sqCandidato: string;
  ano: number;
  turno: number;
  pagina?: number;
  limite?: number;
}

