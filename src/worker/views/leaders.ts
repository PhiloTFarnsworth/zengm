import { bySport, isSport, PHASE } from "../../common";
import { idb } from "../db";
import {
	defaultGameAttributes,
	g,
	helpers,
	processPlayersHallOfFame,
} from "../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerFiltered,
	PlayerInjury,
	PlayerStatType,
	UpdateEvents,
	ViewInput,
} from "../../common/types";
import { groupByUnique } from "../../common/groupBy";
import range from "lodash-es/range";

export const getCategoriesAndStats = (onlyStat?: string) => {
	let categories = bySport<
		{
			titleOverride?: string;
			stat: string;
			minStats?: Record<string, number>;
			sortAscending?: true;
			filter?: (p: any) => boolean;
		}[]
	>({
		basketball: [
			{
				stat: "pts",
				minStats: { gp: 70, pts: 1400 },
			},
			{
				stat: "trb",
				minStats: { gp: 70, trb: 800 },
			},
			{
				stat: "ast",
				minStats: { gp: 70, ast: 400 },
			},
			{
				stat: "fg",
			},
			{
				stat: "fga",
			},
			{
				stat: "fgp",
				minStats: { fg: 300 * g.get("twoPointAccuracyFactor") },
			},
			{
				stat: "tp",
			},
			{
				stat: "tpa",
			},
			{
				stat: "tpp",
				minStats: { tp: Math.max(55 * g.get("threePointTendencyFactor"), 12) },
			},
			{
				stat: "ft",
			},
			{
				stat: "fta",
			},
			{
				stat: "ftp",
				minStats: { ft: 125 },
			},
			{
				stat: "blk",
				minStats: { gp: 70, blk: 100 },
			},
			{
				stat: "stl",
				minStats: { gp: 70, stl: 125 },
			},
			{
				stat: "min",
				minStats: { gp: 70, min: 2000 },
			},
			{
				stat: "per",
				minStats: { min: 2000 },
			},
			{
				stat: "ewa",
				minStats: { min: 2000 },
			},
			{
				titleOverride: "Win Shares / 48 Mins",
				stat: "ws48",
				minStats: { min: 2000 },
			},
			{
				stat: "ows",
				minStats: { min: 2000 },
			},
			{
				stat: "dws",
				minStats: { min: 2000 },
			},
			{
				stat: "ws",
				minStats: { min: 2000 },
			},
			{
				stat: "obpm",
				minStats: { min: 2000 },
			},
			{
				stat: "dbpm",
				minStats: { min: 2000 },
			},
			{
				stat: "bpm",
				minStats: { min: 2000 },
			},
			{
				stat: "vorp",
				minStats: { min: 2000 },
			},
		],
		football: [
			{
				stat: "pssYds",
			},
			{
				stat: "pssYdsPerAtt",
				minStats: { pss: 14 * 16 },
			},
			{
				stat: "cmpPct",
				minStats: { pss: 14 * 16 },
			},
			{
				stat: "pssTD",
				titleOverride: "Passing TDs",
			},
			{
				stat: "pssInt",
			},
			{
				stat: "qbRat",
				minStats: { pss: 14 * 16 },
			},
			{
				stat: "rusYds",
			},
			{
				stat: "rusYdsPerAtt",
				minStats: { rus: 6.25 * 16 },
			},
			{
				stat: "rusTD",
				titleOverride: "Rushing TDs",
			},
			{
				stat: "recYds",
			},
			{
				stat: "recYdsPerAtt",
				minStats: { rec: 1.875 * 16 },
			},
			{
				stat: "recTD",
				titleOverride: "Receiving TDs",
			},
			{
				stat: "ydsFromScrimmage",
				titleOverride: "Yards From Scrimmage",
			},
			{
				stat: "rusRecTD",
				titleOverride: "Rushing and Receiving TDs",
			},
			{
				stat: "defTck",
			},
			{
				stat: "defSk",
			},
			{
				stat: "defInt",
			},
			{
				stat: "defFmbFrc",
			},
			{
				stat: "defFmbRec",
			},
			{
				stat: "av",
			},
		],
		hockey: [
			{
				stat: "g",
			},
			{
				stat: "a",
			},
			{
				stat: "pts",
			},
			{
				stat: "pm",
				filter: p => p.ratings.pos !== "G",
			},
			{
				stat: "pim",
			},
			{
				stat: "min",
				filter: p => p.ratings.pos !== "G",
			},
			{
				stat: "blk",
			},
			{
				stat: "hit",
			},
			{
				stat: "tk",
			},
			{
				stat: "gv",
			},
			{
				stat: "svPct",
				minStats: { sv: 800 },
			},
			{
				stat: "gaa",
				minStats: { sv: 800 },
				sortAscending: true,
			},
			{
				stat: "so",
			},
			{
				stat: "gc",
			},
			{
				stat: "ops",
			},
			{
				stat: "dps",
			},
			{
				stat: "gps",
			},
			{
				stat: "ps",
			},
		],
	});

	if (onlyStat) {
		categories = categories.filter(row => row.stat === onlyStat);
		if (categories.length === 0) {
			throw new Error(`Invalid stat "${onlyStat}"`);
		}
	}

	// Always include GP, since it's used to scale minStats based on season length
	const statsSet = new Set<string>(["gp"]);
	for (const { minStats, stat } of categories) {
		statsSet.add(stat);

		if (minStats) {
			for (const stat of Object.keys(minStats)) {
				statsSet.add(stat);
			}
		}
	}
	const stats = Array.from(statsSet);

	return {
		categories,
		stats,
	};
};

// Calculate the number of games played for each team, which is used to test if a player qualifies as a league leader
export class GamesPlayedCache {
	currentSeasonCache: Record<number, number> | undefined;
	playoffsCache: Record<number, Record<number, number>>;

	constructor() {
		this.playoffsCache = {};
	}

	private straightNumGames(season: number, playoffs: boolean) {
		// Regular season, completed season -> we already know how many games each team played, from numGames
		return (
			!playoffs &&
			(season < g.get("season") || g.get("phase") >= PHASE.PLAYOFFS)
		);
	}

	async loadSeasons(seasons: number[], playoffs: boolean) {
		for (const season of seasons) {
			if (this.straightNumGames(season, playoffs)) {
				continue;
			}

			const teamSeasons = await idb.getCopies.teamSeasons(
				{
					season,
				},
				"noCopyCache",
			);

			const numGames = g.get("numGames", season);

			const cache: Record<number, number> = {};
			for (const teamSeason of teamSeasons) {
				if (playoffs) {
					if (teamSeason.gp < numGames) {
						cache[teamSeason.tid] = 0;
					} else {
						cache[teamSeason.tid] = teamSeason.gp - numGames;
					}
				} else {
					// Don't count playoff games
					if (teamSeason.gp > numGames) {
						cache[teamSeason.tid] = numGames;
					} else {
						cache[teamSeason.tid] = teamSeason.gp;
					}
				}
			}

			if (playoffs) {
				this.playoffsCache[season] = cache;
			} else {
				this.currentSeasonCache = cache;
			}
		}
	}

	get(season: number | "career", playoffs: boolean, tid: number) {
		if (season === "career") {
			if (playoffs) {
				// Arbitrary - two full playoffs runs
				const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries");
				let sum = 0;
				for (const games of numGamesPlayoffSeries) {
					sum += games;
				}
				return 2 * sum;
			}

			// Arbitrary - 5 seasons
			return g.get("numGames") * 5;
		}

		if (this.straightNumGames(season, playoffs)) {
			return g.get("numGames", season);
		}

		if (playoffs) {
			return this.playoffsCache[season]?.[tid] ?? null;
		}

		return this.currentSeasonCache?.[tid] ?? null;
	}
}

export const iterateAllPlayers = async (
	season: number | "all" | "career",
	cb: (
		p: Player<MinimalPlayerRatings>,
		season: number | "career",
	) => Promise<void>,
) => {
	// Even in past seasons, make sure we have latest info for players
	const cachePlayers = await idb.cache.players.getAll();
	const cachePlayersByPid = groupByUnique(cachePlayers, "pid");

	const applyCB = async (p: Player<MinimalPlayerRatings>) => {
		if (season === "all") {
			const seasons = new Set(p.stats.map(row => row.season));
			for (const season of seasons) {
				await cb(p, season);
			}
		} else {
			await cb(p, season);
		}
	};

	// For current season, assume everyone is cached, although this might not be true for tragic deaths and God Mode edited players
	if (season === g.get("season") && g.get("phase") <= PHASE.PLAYOFFS) {
		for (const p of cachePlayers) {
			await applyCB(p);
		}
		return;
	}

	// This is similar to activeSeason from getCopies.players
	const transaction = idb.league.transaction("players");

	let range;
	const useRange = typeof season === "number";
	if (useRange) {
		// + 1 in upper range is because you don't accumulate stats until the year after the draft
		range = IDBKeyRange.bound([-Infinity, season], [season + 1, Infinity]);
	}

	let cursor = await transaction.store
		.index("draft.year, retiredYear")
		.openCursor(range);

	while (cursor) {
		// https://gist.github.com/inexorabletash/704e9688f99ac12dd336
		const [draftYear, retiredYear] = cursor.key;
		if (useRange && retiredYear < season) {
			cursor = await cursor.continue([draftYear, season]);
		} else {
			const p = cachePlayersByPid[cursor.value.pid] ?? cursor.value;
			await applyCB(p);
			cursor = await cursor.continue();
		}
	}
};

type Category = ReturnType<typeof getCategoriesAndStats>["categories"][number];

export const playerMeetsCategoryRequirements = ({
	cat,
	gamesPlayedCache,
	p,
	playerStats,
	playoffs,
	season,
	statType,
}: {
	cat: Category;
	gamesPlayedCache: GamesPlayedCache;
	p: PlayerFiltered;
	playerStats: Record<string, any>;
	playoffs: boolean;
	season: number | "career";
	statType: PlayerStatType;
}) => {
	// In theory this should be the same for all sports, like basketball. But for a while FBGM set it to the same value as basketball, which didn't matter since it doesn't influence game sim, but it would mess this up.
	const numPlayersOnCourtFactor = bySport({
		basketball:
			defaultGameAttributes.numPlayersOnCourt / g.get("numPlayersOnCourt"),
		football: 1,
		hockey: 1,
	});

	// To handle changes in number of games, playing time, etc
	const factor =
		(g.get("numGames") / defaultGameAttributes.numGames) *
		numPlayersOnCourtFactor *
		helpers.quarterLengthFactor();

	// Test if the player meets the minimum statistical requirements for this category
	let pass = !cat.minStats && (!cat.filter || cat.filter(p));

	if (!pass && cat.minStats) {
		for (const [minStat, minValue] of Object.entries(cat.minStats)) {
			// In basketball, everything except gp is a per-game average, so we need to scale them by games played
			let playerValue;
			if (!isSport("basketball") || minStat === "gp" || statType === "totals") {
				playerValue = playerStats[minStat];
			} else if (statType === "per36") {
				playerValue =
					(playerStats[minStat] * playerStats.gp * playerStats.min) / 36;
			} else {
				playerValue = playerStats[minStat] * playerStats.gp;
			}

			const gpTeam = gamesPlayedCache.get(season, playoffs, playerStats.tid);

			if (gpTeam === null) {
				// Just include everyone, since there was some issue getting gamesPlayed (such as playoffs season before startingSeason)
				pass = true;
				break;
			}

			// Special case GP
			if (minStat === "gp") {
				if (playerValue / gpTeam >= minValue / g.get("numGames")) {
					pass = true;
					break; // If one is true, don't need to check the others
				}
			}

			// Other stats
			if (
				playerValue >=
				Math.ceil((minValue * factor * gpTeam) / g.get("numGames"))
			) {
				pass = true;
				break; // If one is true, don't need to check the others
			}
		}
	}

	return pass;
};

export type Leader = {
	abbrev: string;
	hof: boolean;
	injury: PlayerInjury | undefined;
	jerseyNumber: string;
	key: number | string;
	nameAbbrev: string;
	pid: number;
	pos: string;
	retiredYear: number;
	season: number | undefined;
	stat: number;
	skills: string[];
	tid: number;
	userTeam: boolean;
	watch: boolean;
};

const NUM_LEADERS = 10;

const updateLeaders = async (
	inputs: ViewInput<"leaders">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// Respond to watchList in case players are listed twice in different categories
	if (
		updateEvents.includes("watchList") ||
		(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
		inputs.season !== state.season ||
		inputs.playoffs !== state.playoffs ||
		inputs.statType !== state.statType
	) {
		const { categories, stats } = getCategoriesAndStats();
		const playoffs = inputs.playoffs === "playoffs";

		const outputCategories = categories.map(category => ({
			titleOverride: category.titleOverride,
			stat: category.stat,
			leaders: [] as Leader[],
		}));

		// Load all gameslayedCache seasons ahead of time, so we don't make IndexedDB transaction auto commit if doing this dynamically in iterateAllPlayers
		const gamesPlayedCache = new GamesPlayedCache();
		let seasons: number[];
		if (inputs.season === "career") {
			// Nothing to cache
			seasons = [];
		} else if (inputs.season === "all") {
			seasons = range(g.get("startingSeason"), g.get("season") + 1);
		} else {
			seasons = [inputs.season];
		}
		await gamesPlayedCache.loadSeasons(seasons, playoffs);

		await iterateAllPlayers(inputs.season, async (pRaw, season) => {
			const p = await idb.getCopy.playersPlus(pRaw, {
				attrs: [
					"pid",
					"nameAbbrev",
					"injury",
					"watch",
					"jerseyNumber",
					"hof",
					"retiredYear",
				],
				ratings: ["skills", "pos"],
				stats: ["abbrev", "tid", ...stats],
				season: season === "career" ? undefined : season,
				playoffs,
				regularSeason: !playoffs,
				mergeStats: true,
				statType: inputs.statType,
			});
			if (!p) {
				return;
			}

			// Shitty handling of career totals
			if (Array.isArray(p.ratings)) {
				p.ratings = {
					pos: p.ratings.at(-1).pos,
					skills: [],
				};
			}

			let playerStats;
			if (season === "career") {
				if (playoffs) {
					playerStats = p.careerStatsPlayoffs;
				} else {
					playerStats = p.careerStats;
				}
			} else {
				playerStats = p.stats;
			}

			for (let i = 0; i < categories.length; i++) {
				const cat = categories[i];
				const outputCat = outputCategories[i];

				const value = playerStats[cat.stat];
				const lastValue = outputCat.leaders.at(-1)?.stat;
				if (
					outputCat.leaders.length >= NUM_LEADERS &&
					((cat.sortAscending && value > lastValue) ||
						(!cat.sortAscending && value < lastValue))
				) {
					// Value is not good enough for the top 10
					continue;
				}

				const pass = playerMeetsCategoryRequirements({
					cat,
					gamesPlayedCache,
					p,
					playerStats,
					playoffs,
					season,
					statType: inputs.statType,
				});

				if (pass) {
					// Players can appear multiple times if looking at all seasons
					const key = inputs.season === "all" ? `${p.pid}|${season}` : p.pid;

					let tid = playerStats.tid;
					let abbrev = playerStats.abbrev;
					if (season === "career") {
						const { legacyTid } = processPlayersHallOfFame([p])[0];
						if (legacyTid >= 0) {
							tid = legacyTid;
							abbrev = g.get("teamInfoCache")[tid]?.abbrev;
						}
					}

					const userTid =
						season !== "career" ? g.get("userTid", season) : g.get("userTid");

					const leader = {
						abbrev,
						hof: p.hof,
						injury: p.injury,
						jerseyNumber: p.jerseyNumber,
						key,
						nameAbbrev: p.nameAbbrev,
						pid: p.pid,
						pos: p.ratings.pos,
						retiredYear: p.retiredYear,
						season:
							inputs.season === "all" && season !== "career"
								? season
								: undefined,
						stat: playerStats[cat.stat],
						skills: p.ratings.skills,
						tid,
						userTeam: userTid === tid,
						watch: p.watch,
					};

					outputCat.leaders = outputCat.leaders.slice(0, NUM_LEADERS - 1);
					outputCat.leaders.push(leader);
					if (cat.sortAscending) {
						outputCat.leaders.sort((a, b) => a.stat - b.stat);
					} else {
						outputCat.leaders.sort((a, b) => b.stat - a.stat);
					}
				}
			}
		});

		const highlightActiveAndHOF =
			inputs.season === "career" ||
			inputs.season === "all" ||
			inputs.season < g.get("season");

		return {
			categories: outputCategories,
			highlightActiveAndHOF,
			playoffs: inputs.playoffs,
			season: inputs.season,
			statType: inputs.statType,
		};
	}
};

export default updateLeaders;
