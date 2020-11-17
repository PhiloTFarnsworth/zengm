import React, { useCallback, useEffect, useState } from "react";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { select } from "d3-selection";
import type { View } from "../../../common/types";
import { helpers } from "../../util";
import { PHASE } from "../../../common";

const colors = ["var(--blue)", "var(--green)"];

const Charts = ({
	phase,
	season,
	seasonsToPlot,
	stat,
	teams,
}: Pick<
	View<"tradeSummary">,
	"phase" | "season" | "seasonsToPlot" | "stat" | "teams"
>) => {
	const [node, setNode] = useState<HTMLDivElement | null>(null);
	const getNode = useCallback(node2 => {
		if (node2 !== null) {
			setNode(node2);
		}
	}, []);

	const [node2, setNode2] = useState<HTMLDivElement | null>(null);
	const getNode2 = useCallback(node2 => {
		if (node2 !== null) {
			setNode2(node2);
		}
	}, []);

	useEffect(() => {
		if (node && node2) {
			const allStats: number[] = [];
			const seasons: string[] = [];

			for (const row of seasonsToPlot) {
				for (const team of row.teams) {
					if (team.stat !== undefined) {
						allStats.push(team.stat);
					}
				}
				seasons.push(row.season);
			}

			// totals span -1 to 3, others -3 to 1
			const margin = {
				top: 15,
				right: 15,
				bottom: 30,
				left: 30,
			};
			const width = node.clientWidth - margin.left - margin.right;
			const height = 200;
			const xScale = scalePoint().domain(seasons).range([0, width]);
			const yScale = scaleLinear().domain([0, 1]).range([height, 0]);
			const svg = select(node)
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			const drawHorizontal = (
				svg: any,
				yScale: (y: number) => number,
				y: number,
				color: string,
			) => {
				const line2 = line<number>()
					.x(d => d)
					.y(() => yScale(y));
				svg
					.append("path")
					.datum(xScale.range())
					.attr("class", "chart-line")
					.style("stroke", color)
					.style("stroke-dasharray", "5 5")
					.attr("d", line2);
			};
			drawHorizontal(svg, yScale, 0.5, "var(--secondary)");

			let xMarker: number | undefined;
			if (phase < PHASE.REGULAR_SEASON) {
				const left = xScale(String(season - 1));
				const right = xScale(String(season));
				if (left !== undefined && right !== undefined) {
					xMarker = (left + right) / 2;
				}
			} else if (phase === PHASE.REGULAR_SEASON) {
				xMarker = xScale(String(season));
			} else {
				const left = xScale(String(season));
				const right = xScale(String(season + 1));
				if (left !== undefined && right !== undefined) {
					xMarker = (left + right) / 2;
				}
			}
			if (xMarker !== undefined) {
				console.log(yScale.range(), yScale(1));
				const tradeMarker = line<number>()
					.x(() => xMarker as number)
					.y(d => yScale(d));
				svg
					.append("path")
					.datum(yScale.domain())
					.attr("class", "chart-line")
					.style("stroke", "var(--danger)")
					.style("stroke-dasharray", "5 5")
					.attr("d", tradeMarker);

				svg
					.append("text")
					.attr("y", margin.top)
					.attr("x", xMarker + 5)
					.style("fill", "var(--danger)")
					.text("Trade");
			}

			const strokeWidth = 1;

			for (let i = 0; i < 2; i++) {
				const line2 = line<typeof seasonsToPlot[number]>()
					.x(d => xScale(d.season) as number)
					.y(d => yScale(d.teams[i].winp ?? 0))
					.curve(curveMonotoneX);

				svg
					.append("path")
					.datum(seasonsToPlot)
					.attr("class", "chart-line")
					.style("stroke", colors[i])
					.style("stroke-width", strokeWidth)
					.attr("d", line2);

				svg
					.selectAll()
					.data(seasonsToPlot)
					.enter()
					.append("circle")
					.attr("class", "chart-point")
					.attr("stroke", colors[i])
					.style("stroke-width", strokeWidth)
					.attr("cx", d => xScale(d.season) as number)
					.attr("cy", d => yScale(d.teams[i].winp ?? 0))
					.attr("r", 5 * Math.sqrt(strokeWidth));

				svg
					.append("g")
					.attr("class", "chart-axis")
					.attr("transform", `translate(0,${height})`)
					.call(axisBottom(xScale));

				svg
					.append("g")
					.attr("class", "chart-axis")
					.attr("transform", `translate(0,0)`)
					.call(axisLeft(yScale).tickFormat(helpers.roundWinp as any));
			}

			const yDomainStat = [Math.min(0, ...allStats), Math.max(1, ...allStats)];
			const yScale2 = scaleLinear().domain(yDomainStat).range([height, 0]);
			const svg2 = select(node2)
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			drawHorizontal(svg2, yScale2, 0, "var(--secondary)");

			if (xMarker !== undefined) {
				const tradeMarker = line<number>()
					.x(() => xMarker as number)
					.y(d => yScale2(d));
				svg2
					.append("path")
					.datum(yScale2.domain())
					.attr("class", "chart-line")
					.style("stroke", "var(--danger)")
					.style("stroke-dasharray", "5 5")
					.attr("d", tradeMarker);

				svg2
					.append("text")
					.attr("y", margin.top)
					.attr("x", xMarker + 5)
					.style("fill", "var(--danger)")
					.text("Trade");
			}

			for (let i = 0; i < 2; i++) {
				const line2 = line<typeof seasonsToPlot[number]>()
					.x(d => xScale(d.season) as number)
					.y(d => yScale2(d.teams[i].stat ?? 0))
					.curve(curveMonotoneX);

				svg2
					.append("path")
					.datum(seasonsToPlot)
					.attr("class", "chart-line")
					.style("stroke", colors[i])
					.style("stroke-width", strokeWidth)
					.attr("d", line2);

				svg2
					.selectAll()
					.data(seasonsToPlot)
					.enter()
					.append("circle")
					.attr("class", "chart-point")
					.attr("stroke", colors[i])
					.style("stroke-width", strokeWidth)
					.attr("cx", d => xScale(d.season) as number)
					.attr("cy", d => yScale2(d.teams[i].stat ?? 0))
					.attr("r", 5 * Math.sqrt(strokeWidth));

				svg2
					.append("g")
					.attr("class", "chart-axis")
					.attr("transform", `translate(0,${height})`)
					.call(axisBottom(xScale));

				svg2
					.append("g")
					.attr("class", "chart-axis")
					.attr("transform", `translate(0,0)`)
					.call(axisLeft(yScale2));
			}
		}
	}, [node, node2, phase, season, seasonsToPlot, teams]);

	return (
		<>
			<div
				className="position-relative"
				style={{
					maxWidth: 400,
				}}
			>
				<div className="text-center">
					Team winning percentages before and after the trade
				</div>
				<div ref={getNode} />
				<div
					className="chart-legend"
					style={{
						top: 24,
						left: "inherit",
						right: 13,
					}}
				>
					<ul className="list-unstyled mb-0">
						{teams.map((t, i) => (
							<li key={i} style={{ color: colors[i] }}>
								— {t.abbrev}
							</li>
						))}
					</ul>
				</div>
			</div>

			<div
				className="position-relative mt-3"
				style={{
					maxWidth: 400,
				}}
			>
				<div className="text-center">{stat} by traded assets</div>
				<div ref={getNode2} />
				<div
					className="chart-legend"
					style={{
						top: 24,
						left: "inherit",
						right: 13,
					}}
				>
					<ul className="list-unstyled mb-0">
						{teams.map((t, i) => (
							<li key={i} style={{ color: colors[i] }}>
								— {t.abbrev}
							</li>
						))}
					</ul>
				</div>
			</div>
		</>
	);
};

export default Charts;
