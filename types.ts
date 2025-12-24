
export enum Role {
  ADMIN = "Admin",
  MANAGER = "Team Manager",
  PLAYER = "Player",
}

export interface User {
  id: string;
  username: string;
  role: Role;
  teamId?: string; // if role is MANAGER
}

export interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export interface PlayerPerformance {
  matchId: string;
  runsScored: number;
  ballsFaced: number;
  wicketsTaken: number;
  runsConceded: number;
}

export interface PlayerStats {
  battingAverage: number;
  strikeRate: number;
  wicketsTaken: number;
  economyRate: number;
  matchesPlayed: number;
}

export interface Player {
  id: string;
  name: string;
  role: string;
  base_price: number;
  team_id?: string | null;
  user_id?: string | null;
  sold_price?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  manager_id: string;
  budget_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  team: Team;
  amount: number;
  timestamp: Date;
}

export interface MatchSummary {
  team1: Team;
  team2: Team;
  winner: Team;
  team1Score: number;
  team1Wickets: number;
  team1Overs: string;
  team2Score: number;
  team2Wickets: number;
  team2Overs: string;
  topScorer: { player: Player; runs: number; balls: number };
  topBowler: { player: Player; wickets: number; runs: number };
  commentary: string[];
}

export interface RegistrationTokenPayload {
  role: Role;
  teamId?: string;
  exp: number;
}


export enum AuctionStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  PAUSED = "Paused",
  PLAYER_SOLD = "Player Sold",
  PLAYER_UNSOLD = "Player Unsold",
  FINISHED = "Finished"
}

export enum Page {
    Dashboard = "dashboard",
    Players = "players",
    Teams = "teams",
    Auction = "auction",
    Simulation = "simulation",
    LiveMatch = "live-match"
}
