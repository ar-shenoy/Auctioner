
import { Player, Team, User, Role } from '../types';

let players: Player[] = [
  { id: 'p1', name: 'Virat Kohli', country: 'India', age: 34, role: 'Batsman', battingStyle: 'Right-hand bat', basePrice: 200000, stats: { battingAverage: 50.1, strikeRate: 138.5, wicketsTaken: 4, economyRate: 8.5, matchesPlayed: 230 }, matchHistory: [] },
  { id: 'p2', name: 'Pat Cummins', country: 'Australia', age: 30, role: 'Bowler', bowlingStyle: 'Right-arm fast', basePrice: 150000, stats: { battingAverage: 15.2, strikeRate: 145.1, wicketsTaken: 150, economyRate: 7.8, matchesPlayed: 120 }, matchHistory: [] },
  { id: 'p3', name: 'Ben Stokes', country: 'England', age: 32, role: 'All-Rounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm fast-medium', basePrice: 250000, stats: { battingAverage: 28.5, strikeRate: 142.0, wicketsTaken: 95, economyRate: 8.6, matchesPlayed: 145 }, matchHistory: [] },
  { id: 'p4', name: 'Rashid Khan', country: 'Afghanistan', age: 25, role: 'Bowler', bowlingStyle: 'Right-arm leg-break', basePrice: 180000, stats: { battingAverage: 12.8, strikeRate: 155.2, wicketsTaken: 180, economyRate: 6.5, matchesPlayed: 160 }, matchHistory: [] },
  { id: 'p5', name: 'Jos Buttler', country: 'England', age: 32, role: 'Wicketkeeper', battingStyle: 'Right-hand bat', basePrice: 170000, stats: { battingAverage: 35.1, strikeRate: 148.3, wicketsTaken: 0, economyRate: 0, matchesPlayed: 165 }, matchHistory: [] },
];

let teams: Team[] = [
  { id: 't1', name: 'Mumbai Indians', owner: 'Reliance Industries', budget: 2000000, players: [] },
  { id: 't2', name: 'Chennai Super Kings', owner: 'India Cements', budget: 2000000, players: [] },
  { id: 't3', name: 'Royal Challengers Bangalore', owner: 'United Spirits', budget: 2000000, players: [] },
  { id: 't4', name: 'Kolkata Knight Riders', owner: 'Red Chillies Entertainment', budget: 2000000, players: [] },
];

let users: User[] = [
    { id: 'u1', username: 'admin', role: Role.ADMIN },
    { id: 'u2', username: 'manager', role: Role.MANAGER, teamId: 't1' },
    { id: 'u3', username: 'player', role: Role.PLAYER },
]

export const getPlayers = () => players;
export const getTeams = () => teams;
export const getUsers = () => users;
export const findUserByUsername = (username: string) => users.find(u => u.username === username);

export const updatePlayerStats = (playerId: string, performance: { runs?: number, wickets?: number }) => {
    players = players.map(p => {
        if (p.id === playerId) {
            const newStats = { ...p.stats };
            if (performance.runs !== undefined) {
                // This is a simplified update. A real system would recalculate averages.
                // For now, we'll just increment matches played as a proxy.
                newStats.matchesPlayed += 1;
            }
            if (performance.wickets !== undefined) {
                newStats.wicketsTaken += performance.wickets;
            }
            return { ...p, stats: newStats };
        }
        return p;
    });
    return players;
};

export const addUser = (user: User) => {
    users.push(user);
    return user;
}
