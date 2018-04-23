/* tslint:disable */
import { Select, message, Modal, Icon, DatePicker, Button, Input, Tooltip } from 'antd';
import momentjson from 'moment-json-parser';
const RangePicker = DatePicker.RangePicker;
const Option = Select.Option;
import * as moment from 'moment';
import * as React from 'react';
import * as reactreplace from "react-string-replace";
import { HotKeys } from 'react-hotkeys';
import './App.css';
// import Observer from '@researchgate/react-intersection-observer';
import DynamicList from '@researchgate/react-intersection-list';
import { List, Map } from "immutable";
import Worker from 'worker-loader!./worker.js';
import transit from 'transit-immutable-js';
import { Provider, Subscribe, Container } from 'unstated';

const worker = new Worker();

// worker.postMessage({ a: 1 });


// worker.addEventListener("message", (event:any) => {
//     console.log("event2",event);
// });

//momentjson.overrideDefault();

// import logo from './logo.svg';
type ILogState = {
    rows: List<any>;
};

class LogContainer extends Container<ILogState> {
    state = {
        rows: List(),
    };

    pendingSet:List<any> = List();
    pendingChanges:List<any> = List();

    add = (rows: List<any>) => {
        // this.setState((state: ILogState) => {
        //     const allRows = state.rows.concat(rows).toList();
        //     return { rows: allRows }
        // })
        this.pendingChanges = this.pendingChanges.concat(rows).toList();
        this.throttleAdd();
    }

    set = (rows: List<any>) => {
        console.log("set");
        this.pendingSet = rows;
        this.debounceSet();
    }

    innerAdd = () => {
        this.setState((s) => {
            return { rows: s.rows.concat(this.pendingChanges).toList() }
        }
        //, () => {console.warn("done add", this.state)}
        );
    }

    innerSet = () => {
        console.log("inner set");
        this.setState(() => {
            return { rows: this.pendingSet }
        }, () => {console.log("done set", this.state)});
    }

    debounceSet = debounce(this.innerSet,100,true);
    // debounceAdd = debounce(this.innerAdd,100,true);
    throttleAdd = throttle(this.innerAdd,100);
}
let logContainer = new LogContainer();

function throttle(fn:any, threshhold:number, scope?:any) {
    threshhold || (threshhold = 250);
    let last:any,
        deferTimer:any;
    return function () {
        // @ts-ignore
      var context = scope || this;
  
      var now = +new Date,
          args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }


const API_BASE = "https://api.applicationinsights.io/v1/apps/";
// let query = "GET /v1/apps/90f8abec-4ef1-45a3-b524-d65d1fd78e6a/query?timespan=PT12H&query=traces HTTP/1.1
// Host: api.applicationinsights.io
// x-api-key: a4qjgdzsvdkrhoisaxfey4csv6822yy1e208b8uu"

// curl "https://api.applicationinsights.io/v1/apps/90f8abec-4ef1-45a3-b524-d65d1fd78e6a/query?timespan=PT12H&query=traces" -H "x-api-key: a4qjgdzsvdkrhoisaxfey4csv6822yy1e208b8uu"

let controller: AbortController | null = null;
async function async_fetch(url: string, conf: {}) {
    if (controller) {
        console.warn("abort");
        controller.abort();
    }
    controller = new AbortController()

    const signal = controller.signal
    const response = await fetch(url, { ...conf, signal });
    if (response.ok) { return await response.json() }
    throw new Error(response.status.toString())
}

interface IQueryObject {
    timeRange: {
        from: moment.Moment;
        to: moment.Moment;
    };
    orderBy: "desc" | "asc";
    grep: string;
    severityLevel: [1, 2, 3, 4];
}

function escapeai(str: string) {
    return str.replace(/["]/g, '\\"')
}

async function async_fetch_data(appId: string, appKey: string, query: IQueryObject) {

    const severityLevel = query.severityLevel.length > 0 ? `where severityLevel in (${query.severityLevel.join(",")})` : "";

    const q2 = `
    exceptions
    | where cloud_RoleInstance contains "pingpong"
    | extend message2 = tostring(customDimensions["RenderedMessage"])
    | union (
        traces
        | project-rename ["message2"] = message)
    | where timestamp between(datetime(${query.timeRange.from.utc().format("YYYY-MM-DD HH:mm:ss")}) .. datetime(${query.timeRange.to.utc().format("YYYY-MM-DD HH:mm:ss")}))
    | project-away message 
    | project-rename message = message2
    | where message contains "${escapeai(query.grep)}"
    | ${severityLevel}
    | order by timestamp ${query.orderBy}
    `;


    // const q = `${query.source}
    // | where message contains "${query.grep}"
    // | where timestamp between(datetime(${query.timeRange.from.utc().format("YYYY-MM-DD HH:mm:ss")}) .. datetime(${query.timeRange.to.utc().format("YYYY-MM-DD HH:mm:ss")}))
    // | order by timestamp ${query.orderBy}
    // `;
    console.info(q2);
    return async_fetch(API_BASE + appId + "/query", {
        body: JSON.stringify({ query: q2 }),
        headers: {
            'x-api-key': appKey,
            'content-type': 'application/json'
        },
        method: "POST"
    })
}

// interface ITableColumn {
//     name: string
// }

// function getIndex(key: string, columns: ITableColumn[]) {
//     return columns.findIndex(c => c.name === key);
// }

// function get(key: string, table: any, row: any) {
//     const i = getIndex(key, table.columns);
//     return row[i];
// }

interface InsightsResponse {
    tables: Array<{
        rows: any[][]
    }>
}

interface IState {
    columns: any;
    rows: List<ILogRow>
    search: string
    query: IQueryObject;
    settings: ISettings;
    showSettings: boolean;
    loading: boolean;
    showDetails: ConsoleRow | null;
    // defaultRange: [moment.Moment,moment.Moment]
};

interface ISettings {
    apiId: string;
    apiKey: string;
}

const map = {
    'refresh': 'enter'
};

function debounce(func: any, wait: any, immediate: any) {
    let timeout: any;
    return function () {
        // @ts-ignore
        var context: any = this;
        var args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

class App extends React.Component<{}, IState> {

    /**
     *
     */
    constructor(props: {}) {
        super(props);

        const query: IQueryObject = {
            orderBy: "desc",
            source: "traces",
            timeRange: {
                from: moment().subtract(1, "h"),
                to: moment()
            },
            grep: "",
            severityLevel: [0, 1, 2, 3],
            ...momentjson(localStorage.getItem("query") as string)
        };

        const settings = JSON.parse(localStorage.getItem("settings") as string) || {
            apiKey: "<INSERT KEY>",
            apiId: "<INSERT ID>"
        };

        this.state = {
            columns: [],
            rows: List(),
            search: "",
            query,
            settings,
            showSettings: false,
            loading: false,
            showDetails: null
        }

        //let cachedRows = List();
        worker.onmessage = (event: any) => {
            console.time("des");
            const x = transit.fromJSON(event.data.payload);
            if (event.data.topic === "new") {
                logContainer.set(x);
            } else {
                logContainer.add(x);
            }
            console.timeEnd("des");

            // cachedRows = cachedRows.concat(x).toList();
            //this.setit(cachedRows);

        };


    }

    public async componentDidMount() {
        this.getData();
    }

    public render() {

        const handlers = {
            'refresh': this.handleRefresh
        };

        const orderBy = (
            <Select defaultValue={this.state.query.orderBy} onChange={this.handleChangeOrderBy}>
                <Option value="desc"><Icon type="arrow-down" /></Option>
                <Option value="asc"><Icon type="arrow-up" /></Option>
            </Select>);

        return (
            <Provider inject={[logContainer]}>
                <Subscribe to={[LogContainer]}>
                {lc => (
                <HotKeys keyMap={map} handlers={handlers}>
                    <div className="App">
                        <header className="App-header">
                            <div className="searchBar">
                                <Input.Search placeholder="Grep for message..." type="search"
                                    value={this.state.query.grep} onChange={this.handleSearchChange} addonAfter={orderBy} />
                            </div>
                            <div className="searchControls">

                                <RangePicker
                                    defaultValue={[this.state.query.timeRange.from, this.state.query.timeRange.to]}
                                    ranges={
                                        {
                                            'Last 30m': [moment().subtract(30, "m"), moment()],
                                            'Last 60m': [moment().subtract(60, "m"), moment()],
                                            'Last 2h': [moment().subtract(2, "h"), moment()],
                                            'Last 8h': [moment().subtract(8, "h"), moment()],
                                            'Today': [moment().startOf('day'), moment().endOf('day')],
                                            'This Month': [moment().startOf('month'), moment().endOf('month')]
                                        }}
                                    showTime
                                    format="YYYY-MM-DD HH:mm:ss"
                                    onChange={this.rangeChange}
                                />
                                <Button onClick={this.handleShowSettings}>Settings</Button>
                            </div>
                            <Tooltip placement="left" title="(Enter)">
                                <Button type="primary" className="refreshbtn" onClick={this.handleRefresh}>Refresh</Button>
                            </Tooltip>
                        </header>

                        <ConsoleView rows={lc.state.rows} />
                        <Modal
                            title="Basic Modal"
                            visible={this.state.showSettings}
                            onOk={this.handleSettingsSave}
                            onCancel={this.handleSettingsclose}
                        >
                            <Input value={this.state.settings.apiId} onChange={this.handleApiIdChange} addonBefore="Api ID" />
                            <Input value={this.state.settings.apiKey} onChange={this.handleApiKeyChange} addonBefore="Api Key" />
                        </Modal>
                    </div>
                </HotKeys>
                )}
                </Subscribe>
            </Provider>
        );
    }

    // private handleSettingsClose = () => {
    //     this.setState({
    //         showDetails: null
    //     });
    // }

    private handleApiIdChange = (e: any) => {
        this.setState({
            settings: {
                ...this.state.settings,
                apiId: e.target.value
            }
        });
    }

    private handleApiKeyChange = (e: any) => {
        this.setState({
            settings: {
                ...this.state.settings,
                apiKey: e.target.value
            }
        });
    }

    private handleShowSettings = () => {
        this.setState({
            showSettings: true
        });
    }

    private handleSettingsSave = () => {
        this.setState({
            showSettings: false
        });

        localStorage.setItem("settings", JSON.stringify(this.state.settings));
    }

    private handleSettingsclose = () => {
        this.setState({
            showSettings: false
        })
    }

    private handleChangeOrderBy = () => {
        this.setState((ps) => {
            return { query: { ...ps.query, orderBy: (ps.query.orderBy === "desc" ? "asc" : "desc") } }
        });
    }

    private rangeChange = (dates: [moment.Moment], dateStrings: string[]) => {
        this.setState((ps) => {
            return {
                query: {
                    ...ps.query, timeRange: {
                        from: dates[0],
                        to: dates[1],
                    }
                }
            }
        });
    }

    private handleSearchChange = (e: any) => {
        const v = e.target.value;
        this.setState((ps) => {
            return { query: { ...ps.query, grep: v } }
        });
    }

    // private handleSetGrep = (str: string) => {
    //     this.setState((ps) => {
    //         return { query: { ...ps.query, grep: str } }
    //     }, this.getData);
    // }

    private handleRefresh = async (e?: any) => {

        if (e) {
            e.stopPropagation();
        }

        await this.getData();
    }

    // private handleShowDetails = (r: any) => {
    //     const table = this.state.data.tables[0];
    //     const rows: any[] = table.rows
    //     // console.log(rows);
    //     const original = rows.find(x => get("itemId", table, x) === r.id);
    //     // console.log(original);
    //     // console.log(table);
    //     // construct obj with keys
    //     const obj = {};
    //     original.forEach((element: any[], index: number) => {
    //         // console.log(element,index, table.columns[index]);
    //         if (element) {
    //             obj[table.columns[index].name] = element;
    //         }
    //     });

    //     console.log(obj);
    //     Modal.info({
    //         title: 'Details',
    //         content: (
    //             <div>
    //                 <pre>{JSON.stringify(obj, (k, v) => {
    //                     if (v === null || v === "") {
    //                         return undefined
    //                     } else if (typeof v === "string") {
    //                         // JSON parse inner values,
    //                         if (v[0] === "[" || v[0] === "{") {
    //                             return JSON.parse(v);
    //                         }
    //                     }

    //                     console.log(v, typeof v);

    //                     return v;
    //                 }, 2)}</pre>
    //             </div>
    //         ),
    //         width: "80%"
    //     });

    //     this.setState({
    //         showDetails: r
    //     })
    // }

    private async getData() {

        const hide = message.loading('Refreshing data...', 0);
        // save query to storage
        localStorage.setItem("query", JSON.stringify(this.state.query));

        let d: InsightsResponse
        try {
            d = await async_fetch_data(this.state.settings.apiId, this.state.settings.apiKey, this.state.query);
        } catch (error) {
            console.error("Failed", error);

            // do not warn on manual abort
            if (error.code !== 20) {
                message.error('Failed to fetch data from AppInsights, check your settings');
            }
            return;
        } finally {
            hide();
        }

        worker.postMessage(d);

        // const RowRecord = Record({
        //     itemId: null,
        //     timestamp: null,
        //     severityLevel: null,
        //     itemType: null,
        //     message:null,
        //     fields: Map()

        // })

        // console.time();

        // const table = fromJS(d.tables[0]);
        // const columns: List<Map<string,string>> = table.get("columns");
        // const rows: List<ILogRow> = table.get('rows').map((row: List<any>, index:number) => {

        //     const fields = row.toOrderedMap().mapEntries((entry:any, index2:number) => {
        //         // console.log("entrye", entry,index2);
        //         return [columns.getIn([index2,"name"]), entry[1]];
        //     });

        //     return new RowRecord({
        //         itemId: fields.get("itemId"),
        //         timestamp: fields.get("timestamp"),
        //         severityLevel: fields.get("severityLevel"),
        //         itemType: fields.get("itemType"),
        //         message: fields.get("message"),
        //         fields
        //     });
        // });

        console.timeEnd();

        // table.rows = table.rows.map(row => {
        //     return row.map(value => {
        //         if (typeof value === "string") {
        //             // JSON parse inner values,
        //             if (value[0] === "[" || value[0] === "{") {
        //                 return JSON.parse(value);
        //             }
        //         }
        //         return value;
        //     });
        // });

        // const rows = table.rows.map((r:any) => {
        //     return {
        //         id: get("itemId", table, r),
        //         loglevel: "info",
        //         message: get("message", table, r),
        //         timestamp: get("timestamp", table, r),
        //         severityLevel: get("severityLevel", table, r),
        //         itemType: get("itemType", table, r),
        //         showDetails: this.handleShowDetails,
        //         setGrep: this.handleSetGrep
        //     }
        // })

        // this.setState((ps) => {
        //     return { ...ps, rows };
        // });
    }

}

interface ILogRow {
    itemId: string,
    timestamp: string,
    severiLevel: number,
    message: string;
    itemType: string,
    fields: Map<string, any>
    setGrep: (str: string) => void;
    showDetails: (row: ILogRow) => void;
}

interface IConsoleProps {
    rows: List<ILogRow>
}

class ConsoleView extends React.Component<IConsoleProps, any> {

    /**
     *
     */
    constructor(props: any) {
        super(props);
        this.state = {
            rowsToRender: ConsoleView.pageSize
        }
    }

    static pageSize: number = 50;

    // static getDerivedStateFromProps(props: any, ps: any) {
    //     if (ps.rowsToRender.count()) {
    //         return null;
    //     } else {
    //         return { rowsToRender: props.rows.take(ConsoleView.pageSize) }
    //     }
    // }


    public render() {
        //console.log("render", this.state.rowsToRender.count() || this.props.rows.count());
        return (            
                <DynamicList currentLength={this.props.rows.take(this.state.rowsToRender).count()} pageSize={ConsoleView.pageSize} awaitMore={true} itemsRenderer={this.itemsRenderer} onIntersection={this.intersect}>
                    {this.itemRenderer}
                </DynamicList>            
        );
    }

    private intersect = (size: number, pageSize: number) => {
        console.log("add rows", size, pageSize);
        this.setState(() => {
             return { rowsToRender: size + pageSize };
        });
    }

    private itemsRenderer = (items: any, ref: any) => (
        <div className="consoleView" ref={ref}>
            {items}
        </div>
    );

    private itemRenderer = (index: number, key: string) => {
        return (
            <Subscribe to={[LogContainer]} key={key}>
                {c => (
                    <ConsoleRow row={c.state.rows.get(index)} />
                )}
            </Subscribe>
        );
    };
}

class ConsoleRow extends React.Component<{ row: ILogRow }, any> {
    /**
     *
     */

    constructor(props: any) {
        super(props);
    }

    shouldComponentUpdate(nextProps:any, nextState:any) {
        if(!nextProps.row.equals(this.props.row)) {
            // console.warn("scu", true);

            return true;
        }
        // console.log("scu", false);
        

        return false;
    }

    public render() {
        const row: any = this.props.row;
        const severityLevel = translateSeverityLevel(row.get("severityLevel"));

        const regexp = /\B(#[a-zA-Z0-9-]+\b|#"[a-zA-Z0-9- ]+["|\b])(?!;)/gu;

        const msg = reactreplace(row.get("message"), regexp, (match: string, i: number) => {
            const grep = () => { row.setGrep(match); }
            return <span className="hashtag" key={i} onClick={grep}>{match}</span>
        });

        // const handlers = {
        //     'ctrl+enter': this.setGrep
        // };
        const r: any = row;
        //console.log("Render?", r.toJS());

        return (
            <div className="consoleRow" key={r.get("itemId")}>
                <div className="id">{r.get("itemId")}</div>
                <div className="timestamp">{r.get("timestamp")}</div>
                <Icon className="details" type="message" onClick={this.showDetails} />
                <div className={"loglevel " + severityLevel}>{severityLevel}</div>
                <div className="message">{msg}</div>
                <div className="itemType">{r.get("itemType")}</div>
            </div>
        )
    }


    // private setGrep = () => {
    //     const selection = window.getSelection().getRangeAt(0).cloneContents().textContent;
    //     if (typeof selection === "string" && selection !== "") {
    //         this.props.setGrep(selection);
    //     }
    // }

    private showDetails = () => {
        this.props.row.showDetails(this.props.row);
    }
}

function translateSeverityLevel(level: number) {
    switch (level) {
        case 1:
            return "info";
        case 2:
            return "warning";
        case 3:
            return "error";
        default:
            return "debug";
    }
}

export default App;
