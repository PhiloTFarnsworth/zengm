import { g } from "../util";
import type { GameAttributesLeague, UpdateEvents } from "../../common/types";

export const keys = [
	"godMode",
	"godModeInPast",
	"numGames",
	"numActiveTeams",
	"quarterLength",
	"maxRosterSize",
	"minRosterSize",
	"salaryCap",
	"minPayroll",
	"luxuryPayroll",
	"luxuryTax",
	"minContract",
	"maxContract",
	"minContractLength",
	"maxContractLength",
	"aiTradesFactor",
	"injuryRate",
	"homeCourtAdvantage",
	"rookieContractLengths",
	"rookiesCanRefuse",
	"tragicDeathRate",
	"brotherRate",
	"sonRate",
	"forceRetireAge",
	"hardCap",
	"numGamesPlayoffSeries",
	"numPlayoffByes",
	"draftType",
	"draftAges",
	"playersRefuseToNegotiate",
	"allStarGame",
	"budget",
	"numSeasonsFutureDraftPicks",
	"foulRateFactor",
	"foulsNeededToFoulOut",
	"foulsUntilBonus",
	"threePointers",
	"pace",
	"threePointTendencyFactor",
	"threePointAccuracyFactor",
	"twoPointAccuracyFactor",
	"blockFactor",
	"stealFactor",
	"turnoverFactor",
	"orbFactor",
	"challengeNoDraftPicks",
	"challengeNoFreeAgents",
	"challengeNoTrades",
	"challengeLoseBestPlayer",
	"challengeNoRatings",
	"challengeFiredLuxuryTax",
	"challengeFiredMissPlayoffs",
	"challengeThanosMode",
	"realPlayerDeterminism",
	"repeatSeason",
	"ties",
	"otl",
	"spectator",
	"elam",
	"elamASG",
	"elamMinutes",
	"elamPoints",
	"playerMoodTraits",
	"numPlayersOnCourt",
	"numDraftRounds",
	"tradeDeadline",
	"autoDeleteOldBoxScores",
	"difficulty",
	"stopOnInjury",
	"stopOnInjuryGames",
	"aiJerseyRetirement",
	"numPeriods",
	"tiebreakers",
	"pointsFormula",
] as const;

export type Settings = Pick<
	GameAttributesLeague,
	Exclude<typeof keys[number], "repeatSeason">
> & {
	repeatSeason: boolean;
};

const updateSettings = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		const settings: Settings = {
			godMode: g.get("godMode"),
			godModeInPast: g.get("godModeInPast"),
			numGames: g.get("numGames"),
			numActiveTeams: g.get("numActiveTeams"),
			quarterLength: g.get("quarterLength"),
			maxRosterSize: g.get("maxRosterSize"),
			minRosterSize: g.get("minRosterSize"),
			salaryCap: g.get("salaryCap"),
			minPayroll: g.get("minPayroll"),
			luxuryPayroll: g.get("luxuryPayroll"),
			luxuryTax: g.get("luxuryTax"),
			minContract: g.get("minContract"),
			maxContract: g.get("maxContract"),
			minContractLength: g.get("minContractLength"),
			maxContractLength: g.get("maxContractLength"),
			aiTradesFactor: g.get("aiTradesFactor"),
			injuryRate: g.get("injuryRate"),
			homeCourtAdvantage: g.get("homeCourtAdvantage"),
			rookieContractLengths: g.get("rookieContractLengths"),
			rookiesCanRefuse: g.get("rookiesCanRefuse"),
			tragicDeathRate: g.get("tragicDeathRate"),
			brotherRate: g.get("brotherRate"),
			sonRate: g.get("sonRate"),
			forceRetireAge: g.get("forceRetireAge"),
			hardCap: g.get("hardCap"),
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries"),
			numPlayoffByes: g.get("numPlayoffByes"),
			draftType: g.get("draftType"),
			draftAges: g.get("draftAges"),
			playersRefuseToNegotiate: g.get("playersRefuseToNegotiate"),
			allStarGame: g.get("allStarGame"),
			budget: g.get("budget"),
			numSeasonsFutureDraftPicks: g.get("numSeasonsFutureDraftPicks"),
			foulRateFactor: g.get("foulRateFactor"),
			foulsNeededToFoulOut: g.get("foulsNeededToFoulOut"),
			foulsUntilBonus: g.get("foulsUntilBonus"),
			threePointers: g.get("threePointers"),
			pace: g.get("pace"),
			threePointTendencyFactor: g.get("threePointTendencyFactor"),
			threePointAccuracyFactor: g.get("threePointAccuracyFactor"),
			twoPointAccuracyFactor: g.get("twoPointAccuracyFactor"),
			blockFactor: g.get("blockFactor"),
			stealFactor: g.get("stealFactor"),
			turnoverFactor: g.get("turnoverFactor"),
			orbFactor: g.get("orbFactor"),
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
			challengeNoTrades: g.get("challengeNoTrades"),
			challengeLoseBestPlayer: g.get("challengeLoseBestPlayer"),
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeFiredLuxuryTax: g.get("challengeFiredLuxuryTax"),
			challengeFiredMissPlayoffs: g.get("challengeFiredMissPlayoffs"),
			challengeThanosMode: g.get("challengeThanosMode"),
			realPlayerDeterminism: g.get("realPlayerDeterminism"),
			repeatSeason: !!g.get("repeatSeason"),
			ties: g.get("ties"),
			otl: g.get("otl"),
			spectator: g.get("spectator"),
			elam: g.get("elam"),
			elamASG: g.get("elamASG"),
			elamMinutes: g.get("elamMinutes"),
			elamPoints: g.get("elamPoints"),
			playerMoodTraits: g.get("playerMoodTraits"),
			numPlayersOnCourt: g.get("numPlayersOnCourt"),
			numDraftRounds: g.get("numDraftRounds"),
			tradeDeadline: g.get("tradeDeadline"),
			autoDeleteOldBoxScores: g.get("autoDeleteOldBoxScores"),
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
			aiJerseyRetirement: g.get("aiJerseyRetirement"),
			numPeriods: g.get("numPeriods"),
			tiebreakers: g.get("tiebreakers"),
			pointsFormula: g.get("pointsFormula"),
		};

		return settings;
	}
};

export default updateSettings;
