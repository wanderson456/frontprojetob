
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
