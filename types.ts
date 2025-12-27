
export enum Role {
  ADMIN = "admin",
  MANAGER = "team_manager",
  PLAYER = "player",
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
  profile_photo_url?: string | null;
  city?: string | null;
  state?: string | null;
  phone_number?: string | null;
  is_approved?: boolean;
  matches_played?: number;
  runs_scored?: number;
  wickets_taken?: number;
  batting_style?: string;
  bowling_style?: string;
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
    PlayerRegistration = "player-registration",
    Login = "login"
}
