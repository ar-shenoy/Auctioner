
import { Player, Team, MatchSummary } from '../types';

const OVERS = 5; // 5-over match for quick simulation

const getOutcome = (batsman: Player, bowler: Player): number | 'W' => {
  const { battingAverage, strikeRate } = batsman.stats;
  const { economyRate, wicketsTaken } = bowler.stats;

  // Base probabilities
  let outProb = 5 - (battingAverage / 15); // Higher avg = lower out chance
  let dotProb = 40 - (strikeRate / 5) + (economyRate * 2);
  let oneProb = 30 + (strikeRate / 10) - economyRate;
  let fourProb = 10 + (strikeRate / 12) - economyRate;
  let sixProb = 5 + (strikeRate / 20) - (economyRate / 2);

  // Bowler influence
  outProb += wicketsTaken / 50;
  
  const total = outProb + dotProb + oneProb + fourProb + sixProb;
  const rand = Math.random() * total;

  if (rand < outProb) return 'W';
  if (rand < outProb + dotProb) return 0;
  if (rand < outProb + dotProb + oneProb) return 1;
  // Let's add 2s and 3s for realism
  const subRand = Math.random();
  if (subRand < 0.6) return 1;
  if (subRand < 0.9) return 2;
  return 3;
  if (rand < outProb + dotProb + oneProb + fourProb) return 4;
  return 6;
};

const formatOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

const simulateInnings = (battingTeam: Team, bowlingTeam: Team, target: number | null) => {
  let score = 0;
  let wickets = 0;
  let balls = 0;
  const commentary: string[] = [];
  const MAX_BALLS = OVERS * 6;
  
  const batsmanStats: { [id: string]: { runs: number, balls: number } } = {};
  battingTeam.players.forEach(p => batsmanStats[p.id] = { runs: 0, balls: 0 });
  const bowlerStats: { [id: string]: { wickets: number, runs: number, balls: number } } = {};
  bowlingTeam.players.filter(p => p.role !== 'Batsman' && p.role !== 'Wicketkeeper').forEach(p => bowlerStats[p.id] = { wickets: 0, runs: 0, balls: 0 });

  const bowlers = Object.keys(bowlerStats);
  if (bowlers.length === 0) { // Handle case with no dedicated bowlers
      const allRounders = bowlingTeam.players.filter(p => p.role === 'All-Rounder');
      if (allRounders.length > 0) allRounders.forEach(p => bowlers.push(p.id));
      else bowlingTeam.players.forEach(p => bowlers.push(p.id)); // anyone can bowl
  }

  let bowlerIndex = 0;

  while (balls < MAX_BALLS && wickets < 10) {
    if (target && score > target) break;

    const batsman = battingTeam.players[wickets];
    const bowler = bowlingTeam.players.find(p => p.id === bowlers[bowlerIndex % bowlers.length])!;
    
    if (!batsman || !bowler) break;

    const outcome = getOutcome(batsman, bowler);
    const over = formatOvers(balls);

    if (outcome === 'W') {
      wickets++;
      commentary.push(`${over}: WICKET! ${batsman.name} is out, bowled by ${bowler.name}.`);
      if(bowlerStats[bowler.id]) bowlerStats[bowler.id].wickets++;
    } else {
      score += outcome;
      commentary.push(`${over}: ${batsman.name} scores ${outcome} run(s) off ${bowler.name}.`);
      if(batsmanStats[batsman.id]) {
          batsmanStats[batsman.id].runs += outcome;
      }
      if(bowlerStats[bowler.id]) bowlerStats[bowler.id].runs += outcome;
    }
    
    balls++;
    if(batsmanStats[batsman.id]) batsmanStats[batsman.id].balls++;
    if(bowlerStats[bowler.id]) bowlerStats[bowler.id].balls++;


    if (balls % 6 === 0) {
      bowlerIndex++;
    }
  }
  
  return { score, wickets, balls, commentary, batsmanStats, bowlerStats };
};


export const simulateMatch = (team1: Team, team2: Team): MatchSummary => {
  const [battingFirst, chasing] = Math.random() > 0.5 ? [team1, team2] : [team2, team1];

  const firstInnings = simulateInnings(battingFirst, chasing, null);
  const target = firstInnings.score + 1;
  const secondInnings = simulateInnings(chasing, battingFirst, target);

  let winner: Team;
  if (secondInnings.score >= target) {
    winner = chasing;
  } else {
    winner = battingFirst;
  }

  // Find top performers
  const allBatsmanStats = {...firstInnings.batsmanStats, ...secondInnings.batsmanStats};
  const topScorerId = Object.keys(allBatsmanStats).reduce((a, b) => allBatsmanStats[a].runs > allBatsmanStats[b].runs ? a : b);
  const topBowlerId = Object.keys({...firstInnings.bowlerStats, ...secondInnings.bowlerStats}).reduce((a, b) => {
      const statsA = firstInnings.bowlerStats[a] || secondInnings.bowlerStats[a];
      const statsB = firstInnings.bowlerStats[b] || secondInnings.bowlerStats[b];
      return statsA.wickets > statsB.wickets ? a : b
  });

  const allPlayers = [...team1.players, ...team2.players];
  const topScorerPlayer = allPlayers.find(p => p.id === topScorerId)!;
  const topBowlerPlayer = allPlayers.find(p => p.id === topBowlerId)!;


  return {
    team1: battingFirst,
    team2: chasing,
    winner,
    team1Score: firstInnings.score,
    team1Wickets: firstInnings.wickets,
    team1Overs: formatOvers(firstInnings.balls),
    team2Score: secondInnings.score,
    team2Wickets: secondInnings.wickets,
    team2Overs: formatOvers(secondInnings.balls),
    topScorer: { player: topScorerPlayer, runs: allBatsmanStats[topScorerId].runs, balls: allBatsmanStats[topScorerId].balls },
    topBowler: { player: topBowlerPlayer, wickets: (firstInnings.bowlerStats[topBowlerId]?.wickets || 0) + (secondInnings.bowlerStats[topBowlerId]?.wickets || 0), runs: (firstInnings.bowlerStats[topBowlerId]?.runs || 0) + (secondInnings.bowlerStats[topBowlerId]?.runs || 0) },
    commentary: [...firstInnings.commentary, `--- End of Innings ---`, ...secondInnings.commentary]
  };
};
