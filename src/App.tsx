/* tslint:disable */
import { Select, message, Modal, Icon, DatePicker, Button, Input, Tooltip, TreeSelect } from 'antd';
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
import { List, fromJS, Map } from "immutable";
import Worker from 'worker-loader!./worker.js';
import transit from 'transit-immutable-js';
import { Provider, Subscribe, Container } from 'unstated';
// if (process.env.NODE_ENV !== 'production') {
//     const {whyDidYouUpdate} = require('why-did-you-update');
//     whyDidYouUpdate(React);
//   }
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

const treeData = [{
    label: 'Severity Level',
    value: '0-0',
    key: '0-0',    
    children: [{
      label: 'Debug',
      value: '0',
      key: '0-0-0',
    },
    {
        label: 'Info',
        value: '1',
        key: '0-0-1',
      },
      {
        label: 'Warning',
        value: '2',
        key: '0-0-2',
      },
      {
        label: 'Error',
        value: '3',
        key: '0-0-3',
      }],
  }];

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
        console.log("adding new", rows.count());
        this.pendingChanges = this.pendingChanges.concat(rows).toList();
        console.log("pending changes", this.pendingChanges.count());
        this.innerAdd();
    }

    set = (rows: List<any>) => {
        console.log("set",rows);
        this.pendingSet = rows;
        this.pendingChanges = this.pendingChanges.clear();
        this.innerSet();
    }

    innerAdd = () => {
        this.setState((s) => {
            return { rows: s.rows.concat(this.pendingChanges).toList() }
        }
        , () => {console.warn("done add", this.state); this.pendingChanges = this.pendingChanges.clear();}
        );
    }

    innerSet = () => {
        console.log("inner set");
        this.setState(() => {
            return { rows: this.pendingSet }
        });
    }

    // debounceSet = debounce(this.innerSet,100,true);
    // debounceAdd = debounce(this.innerAdd,100,true);
    // throttleAdd = throttle(this.innerAdd,1000);
}
let logContainer = new LogContainer();

// function throttle(fn:any, threshhold:number, scope?:any) {
//     threshhold || (threshhold = 250);
//     let last:any,
//         deferTimer:any;
//     return function () {
//       var context = scope || this;
  
//       var now = +new Date,
//           args = arguments;
//       if (last && now < last + threshhold) {
//         // hold on to it
//         clearTimeout(deferTimer);
//         deferTimer = setTimeout(function () {
//           last = now;
//           fn.apply(context, args);
//         }, threshhold);
//       } else {
//         last = now;
//         fn.apply(context, args);
//       }
//     };
//   }


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
    severityLevel2: [1, 2, 3, 4];
    severityLevel: string[];
}

function escapeai(str: string) {
    return str.replace(/["]/g, '\\"')
}

function translateSeverityLevelFromTree(val: string[]) {
    return val.map((v) => {
        const x = v.split("-").pop()
        console.log(x);
        return x;
    });    
}

async function async_fetch_data(appId: string, appKey: string, query: IQueryObject) {
    const sl = translateSeverityLevelFromTree(query.severityLevel);
    const severityLevel = sl.length > 0 ? `where severityLevel in (${sl.join(",")})` : "";

    const q2 = `
    exceptions
    | where cloud_RoleInstance contains "pingpong"
    | extend message2 = tostring(customDimensions["RenderedMessage"])
    | union (
        traces
        | project-rename ["message2"] = message)
    | where timestamp between(datetime(${query.timeRange.from.format("YYYY-MM-DD HH:mm:ss")}) .. datetime(${query.timeRange.to.format("YYYY-MM-DD HH:mm:ss")}))
    | project-away message 
    | project-rename message = message2
    | where message contains "${escapeai(query.grep)}" or operation_Id contains "${escapeai(query.grep)}" or customDimensions contains "${escapeai(query.grep)}" or user_Id contains "${escapeai(query.grep)}"
    | ${severityLevel}
    | order by timestamp ${query.orderBy}, itemId desc
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
    lastQuery: Map<any,any>;
    settings: ISettings;
    showSettings: boolean;
    loading: boolean;
    showDetails: ConsoleRow | null;
    queryHistory: List<Map<any,any>>;
    currentQuery: number;
    // defaultRange: [moment.Moment,moment.Moment]
};

interface ISettings {
    apiId: string;
    apiKey: string;
}

const map = {
    'refresh': 'enter'
};

// function debounce(func: any, wait: any, immediate: any) {
//     let timeout: any;
//     return function () {
//         var context: any = this;
//         var args = arguments;
//         var later = function () {
//             timeout = null;
//             if (!immediate) func.apply(context, args);
//         };
//         var callNow = immediate && !timeout;
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//         if (callNow) func.apply(context, args);
//     };
// };

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
                from: moment().utc().subtract(1, "h"),
                to: moment().utc()
            },
            grep: "",
            severityLevel: {value:'0-0-0'},
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
            lastQuery: Map(),
            settings,
            showSettings: false,
            loading: false,
            showDetails: null,
            queryHistory: List(),
            currentQuery: 0
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
            'enter': this.handleRefresh,
            'shift+enter': this.handleRefresh,// this.handleSetGrepFromSelect,
            'shift+left': this.goBack,
            'shift+right': this.goForward,
            'ctrl+enter': this.handleSetGrepFromSelect
        };

        const orderBy = (
            <Select defaultValue={this.state.query.orderBy} onChange={this.handleChangeOrderBy}>
                <Option value="desc"><Icon type="arrow-down" /></Option>
                <Option value="asc"><Icon type="arrow-up" /></Option>
            </Select>);

        const hasNewQuery = !this.state.lastQuery.equals(fromJS(this.state.query));
        
        const tProps = {
            treeData,
            value: this.state.query.severityLevel,
            onChange: this.onTreeChange,
            treeCheckable: true,
            showCheckedStrategy: TreeSelect.SHOW_CHILD,
            searchPlaceholder: 'Please select severity',            
            style: {
              width: 300,
            },
          };

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
                                className="timePicker"
                                    defaultValue={[this.state.query.timeRange.from, this.state.query.timeRange.to]}
                                    ranges={
                                        {
                                            'Last 30m': [moment().utc().subtract(30, "m"), moment().utc()],
                                            'Last 60m': [moment().utc().subtract(60, "m"), moment().utc()],
                                            'Last 2h': [moment().utc().subtract(2, "h"), moment().utc()],
                                            'Last 8h': [moment().utc().subtract(8, "h"), moment().utc()],
                                            'Today': [moment().utc().startOf('day'), moment().endOf('day').utc()],
                                            'This Month': [moment().utc().startOf('month'), moment().endOf('month').utc()]
                                        }}
                                    showTime
                                    format="YYYY-MM-DD HH:mm:ss"
                                    onChange={this.rangeChange}
                                />
                                <TreeSelect {...tProps} />
                                <Button onClick={this.handleShowSettings}>Settings</Button>
                            </div>
                            <Tooltip placement="left" title="(Enter)">
                                <Button type={hasNewQuery ? "primary" : "dashed"} className="refreshbtn" onClick={this.handleRefresh}>Refresh</Button>
                            </Tooltip>
                        </header>

                        <ConsoleView rows={lc.state.rows} setGrep={this.handleSetGrep} showDetails={this.handleShowDetails} />
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
    private goBack = () => {
        const current = this.state.currentQuery;
        console.log("go back from", this.state.currentQuery, "to", this.state.currentQuery-1);
        var last = this.state.queryHistory.get(current -1);
        if(!last) { return; }
        this.setState((ps) => {
            return {
                query: last.toJS(),
                currentQuery: ps.queryHistory.indexOf(last)
            }
        });
    }

    private goForward = () => {
        var current = this.state.currentQuery;
        console.log("go forward from", current, "to", current+1);
        var last = this.state.queryHistory.get(current+1);
        if(!last) { return; }
        this.setState((ps) => {
            return {
                query: last.toJS(),
                currentQuery: ps.queryHistory.indexOf(last)

            }
        });
    }
    private onTreeChange = (value:any) => {
        this.setState({
            query: {...this.state.query, severityLevel: value }
        })
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

    private handleSetGrep = (values: {}) => {
        this.setState((ps) => {
            return { query: { ...ps.query, ...values } }
        }, this.getData);
    }

    private handleSetGrepFromSelect = () => {
        const selection = window.getSelection().getRangeAt(0).cloneContents().textContent;
        if (typeof selection === "string" && selection !== "") {
            this.handleSetGrep({grep:selection});
        }
    }

    private handleRefresh = async (e?: any) => {

        if (e) {
            e.stopPropagation();
        }

        await this.getData();
    }

    private handleShowDetails = (r: any) => {
        // const table = this.state.data.tables[0];
        // const rows: any[] = table.rows
        // // console.log(rows);
        // const original = rows.find(x => get("itemId", table, x) === r.id);
        // // console.log(original);
        // // console.log(table);
        // // construct obj with keys
        // const obj = {};
        // original.forEach((element: any[], index: number) => {
        //     // console.log(element,index, table.columns[index]);
        //     if (element) {
        //         obj[table.columns[index].name] = element;
        //     }
        // });
        const obj = r.toJS();
        Modal.info({
            title: 'Details',
            content: (
                <div>
                    <pre>{JSON.stringify(obj, (k, v) => {

                        if (v === null || v === "") {
                            return undefined
                        // } else if (typeof v === "string" && (v.indexOf("[") === 1 || v.indexOf("{") === 1)) {
                        //     console.warn("ye", v);
                        //     return JSON.stringify(v, null, 2);
                        }

                        //console.log(v, typeof v);

                        return v;
                    }, 2)}</pre>
                </div>
            ),
            width: "80%"
        });

        this.setState({
            showDetails: r
        })
}


    private async getData() {

        const hide = message.loading('Refreshing data...', 0);
        // save query to storage
        localStorage.setItem("query", JSON.stringify(this.state.query));

        // todo: break out and only save if different
        const last = this.state.queryHistory.last() || Map();
        if(!last.equals(fromJS(this.state.query))) {
            this.setState((ps) => {
                return {
                    queryHistory: ps.queryHistory.push(fromJS(ps.query)),
                    currentQuery: ps.queryHistory.count() 
                }
            }, () => {
                console.log("as", this.state.queryHistory.toJS());
            });
        }

        this.setState({
            lastQuery: fromJS(this.state.query)
        });

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

        worker.postMessage({ topic: "json", payload: d});
        console.timeEnd();
    }

}

interface ILogRow {    
    setGrep: (str: string) => void;
    showDetails: (row: ILogRow) => void;
}

interface IConsoleProps {
    rows: List<ILogRow>,
    setGrep: (str: {}) => void;
    showDetails: (row: ILogRow) => void;
}

class ConsoleView extends React.Component<IConsoleProps, any> {

    /**
     *
     */
    constructor(props: any) {
        super(props);
    }

    static pageSize: number = 50;

    public render() {
        console.log("render rows count", this.props.rows.count());   
        return (
            this.props.rows.isEmpty() ? <div className="consoleView">No entries...</div>: 
                <DynamicList rows={this.props.rows} currentLength={this.props.rows.count()} threshold={"25%"} pageSize={ConsoleView.pageSize} awaitMore={true} itemsRenderer={this.itemsRenderer} onIntersection={this.intersect}>
                    {this.itemRenderer}
                </DynamicList>            
        );
    }

    private intersect = (size: number, pageSize: number) => {
        console.log("Intersect event:", size, pageSize);
        worker.postMessage({topic: "loadmore", payload: {
            skip: size,
            take: pageSize}
        });
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
            <ConsoleRow row={logContainer.state.rows.get(index)} key={key} setGrep={this.props.setGrep} showDetails={this.props.showDetails} />            
        );
    };
}

interface IConsoleRowProps {
    row: any;
    setGrep: (values: {}) => void;
    showDetails: (row: ILogRow) => void;
}

class ConsoleRow extends React.Component<IConsoleRowProps, any> {
    /**
     *
     */

    constructor(props: any) {
        super(props);
    }

    shouldComponentUpdate(nextProps:any, nextState:any) {
        if(!nextProps.row.equals(this.props.row)) {
            return true;
        }
        return false;
    }

    public render() {
        const row: any = this.props.row;
        const severityLevel = translateSeverityLevel(row.get("severityLevel"));

        const regexp = /\B(#[a-zA-Z0-9-]+\b|#"[a-zA-Z0-9- ]+["|\b])(?!;)/gu;

        const msg = reactreplace(row.get("message"), regexp, (match: string, i: number) => {
            const grep = () => { this.props.setGrep({grep: match}); }
            return <span className="hashtag" key={i} onClick={grep}>{match}</span>
        });

        // const handlers = {
        //     'ctrl+enter': this.setGrep
        // };
        const r: any = row;
        //console.log("Render?", r.toJS());
        const opId = r.get("operation_Id");
        return (
            <div className="consoleRow" key={r.get("itemId")}>
                <Tooltip placement="topLeft" title={r.get("cloud_RoleInstance")}>
                    <div className="id">{r.get("cloud_RoleInstance")}</div>
                </Tooltip>
                <div className="timestamp">{moment(r.get("timestamp")).format("YYYY-MM-DD HH:mm:ss:SSS")}</div>
                <Icon className="details" type="message" onClick={this.showDetails} />                
                <div className={"loglevel " + severityLevel} onClick={this.setSeverity}>{severityLevel}</div>
                {opId ? <div className="operation_Id " onClick={this.setOpid}>{opId}</div> : null}
                <div className="message">{msg}</div>
                <div className="itemType">{r.get("itemType")}</div>
            </div>
        )
    }

    private setOpid = () => {
        this.props.setGrep({
            grep: this.props.row.get("operation_Id").toString()
        })
    }

    private setSeverity = () => {
        this.props.setGrep({
            severityLevel: [this.props.row.get("severityLevel").toString()]
        })
    }


    // private setGrep = () => {
    //     const selection = window.getSelection().getRangeAt(0).cloneContents().textContent;
    //     if (typeof selection === "string" && selection !== "") {
    //         this.props.setGrep(selection);
    //     }
    // }

    private showDetails = () => {
        this.props.showDetails(this.props.row);
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
