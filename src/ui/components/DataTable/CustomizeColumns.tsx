import type { Col } from ".";
import { useState } from "react";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import classNames from "classnames";
import Modal from "../Modal";

const Item = SortableElement(
	({
		col,
		hidden,
		onToggleHidden,
	}: {
		col?: Col;
		hidden?: boolean;
		onToggleHidden: () => void;
	}) => {
		let title;
		if (col) {
			title = col.title;
			if (col.desc) {
				title += ` (${col.desc})`;
			}
			if (title === "") {
				title = "No Title";
			}
		} else {
			title = <span className="text-muted">Not Currently Available</span>;
		}

		return (
			<div className="form-check">
				<input
					className="form-check-input"
					type="checkbox"
					checked={!hidden}
					onChange={onToggleHidden}
				/>
				<label className="form-check-label cursor-grab">{title}</label>
			</div>
		);
	},
);

const Container = SortableContainer(
	({ children, isDragged }: { children: any[]; isDragged: boolean }) => {
		return (
			<ul
				className={classNames(
					"list-unstyled mb-0 cursor-grab user-select-none",
					{
						"cursor-grabbing": isDragged,
					},
				)}
			>
				{children}
			</ul>
		);
	},
);

const CustomizeColumns = ({
	colOrder,
	cols,
	hasSuperCols,
	onChangeStickyCols,
	onHide,
	onReset,
	onSortEnd,
	onToggleHidden,
	show,
	stickyCols,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	cols: Col[];
	hasSuperCols: boolean;
	onChangeStickyCols: (stickyCols: 0 | 1 | 2) => void;
	onHide: () => void;
	onReset: () => void;
	onSortEnd: (arg: { oldIndex: number; newIndex: number }) => void;
	onToggleHidden: (i: number) => () => void;
	show: boolean;
	stickyCols: 0 | 1 | 2;
}) => {
	const [isDragged, setIsDragged] = useState(false);

	const stickyColsOptions = [0, 1, 2] as const;

	return (
		<Modal animation={false} centered show={show} onHide={onHide}>
			<Modal.Header closeButton>Customize Columns</Modal.Header>
			<Modal.Body>
				<p>
					Click and drag to reorder columns, or use the checkboxes to show/hide
					columns.
				</p>
				{hasSuperCols ? (
					<p className="text-danger">
						This table has two header rows. That means you can enable/disable
						columns, but not reorder them.
					</p>
				) : null}
				<Container
					helperClass="sort-inside-modal"
					isDragged={isDragged}
					onSortStart={() => {
						setIsDragged(true);
					}}
					onSortEnd={args => {
						setIsDragged(false);
						if (!hasSuperCols) {
							onSortEnd(args);
						}
					}}
				>
					{colOrder.map(({ colIndex, hidden }, i) => {
						const col = cols[colIndex];
						return (
							<Item
								key={colIndex}
								index={i}
								onToggleHidden={onToggleHidden(i)}
								hidden={hidden}
								col={col}
							/>
						);
					})}
				</Container>
				<h3 className="mt-3">Number of sticky columns:</h3>
				<div className="btn-group">
					{stickyColsOptions.map(i => (
						<button
							key={i}
							className={`btn ${
								stickyCols === i ? "btn-primary" : "btn-secondary"
							}`}
							onClick={() => {
								onChangeStickyCols(i);
							}}
						>
							{i}
						</button>
					))}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-danger" onClick={onReset}>
					Reset
				</button>
				<button className="btn btn-secondary" onClick={onHide}>
					Close
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default CustomizeColumns;
