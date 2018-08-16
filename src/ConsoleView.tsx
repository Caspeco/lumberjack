import * as React from "react";
import DynamicList from "@researchgate/react-intersection-list";
import { List } from "immutable";
import { ConsoleRow, ILogRow } from "./ConsoleRow";
import { logContainer } from "./logContainer"
import { worker1 } from "./workerWrap";

interface IConsoleProps {
    rows: List<ILogRow>;
    setGrep: (str: {}) => void;
    showDetails: (row: ILogRow) => void;
    onRowHover: (row: ILogRow) => void;
}

export class ConsoleView extends React.Component<IConsoleProps, any> {
    private static pageSize: number = 50;

    constructor(props: any) {
        super(props);
    }

    public render() {
        console.log("render rows count", this.props.rows.count());
        return this.props.rows.isEmpty() ? (
            <div className="consoleView">No entries...</div>
        ) : (
                <DynamicList
                    rows={this.props.rows}
                    currentLength={this.props.rows.count()}
                    threshold={"50%"}
                    pageSize={ConsoleView.pageSize}
                    awaitMore={true}
                    itemsRenderer={this.itemsRenderer}
                    onIntersection={this.intersect}
                >
                    {this.itemRenderer}
                </DynamicList>
            );
    }

    private intersect = (size: number, pageSize: number) => {
        console.log("Intersect event:", size, pageSize);
        worker1.emit("loadmore", {
            skip: size,
            take: pageSize
        }
        );
        this.setState(() => {
            return { rowsToRender: size + pageSize };
        });
    };

    private itemsRenderer = (items: any, ref: any) => (
        <div className="consoleView" ref={ref}>
            {items}
        </div>
    );

    private itemRenderer = (index: number, key: string) => {
        return (
            <ConsoleRow
                row={logContainer.state.rows.get(index)}
                key={key}
                setGrep={this.props.setGrep}
                showDetails={this.props.showDetails}
                onHover={this.props.onRowHover}
            />
        );
    };
}