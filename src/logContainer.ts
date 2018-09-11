import { Container } from "unstated";
import { List } from "immutable";

export interface ILogState {
    rows: List<any>
}

export class LogContainer extends Container<ILogState> {

    public state = {
        rows: List(),
        totalCount: 0
    };

    private pendingSet: List<any> = List();
    private pendingChanges: List<any> = List();

    public add = (rows: List<any>) => {
        console.log("adding new", rows.count());
        this.pendingChanges = this.pendingChanges.concat(rows).toList();
        console.log("pending changes", this.pendingChanges.count());
        this.innerAdd();
    };

    public setCount(count:number) {
        // @ts-ignore
        this.setState(() => {
            return {totalCount: count};
        });
    }

    public set = (rows: List<any>) => {
        console.log("set", rows);
        this.pendingSet = rows;
        this.pendingChanges = this.pendingChanges.clear();
        this.innerSet();
    };

    public innerAdd = () => {
        // @ts-ignore
        this.setState(s => {
            const rows = s.rows.concat(this.pendingChanges).toList();
            this.pendingChanges = this.pendingChanges.clear();
            return { rows };
        });
    };

    public innerSet = () => {
        console.log("inner set");
        // @ts-ignore
        this.setState(() => {
            return { rows: this.pendingSet };
        });
    };
}

export const logContainer = new LogContainer();