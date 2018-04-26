/* tslint:disable */
import { Select, message, Modal, Icon, DatePicker,Divider, Button, Input, Tooltip, TreeSelect } from 'antd';
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
const worker = new Worker();

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
        // @ts-ignore 
        this.setState((s) => {
            return { rows: s.rows.concat(this.pendingChanges).toList() }
        }
        , () => {console.warn("done add", this.state); this.pendingChanges = this.pendingChanges.clear();}
        );
    }

    innerSet = () => {
        console.log("inner set");
        // @ts-ignore
        this.setState(() => {
            return { rows: this.pendingSet }
        });
    }
}
let logContainer = new LogContainer();

const API_BASE = "https://api.applicationinsights.io/v1/apps/";

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
    //severityLevel: [1, 2, 3, 4];
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

interface InsightsApp extends Object {
    appId?: string,
    apiKey?: string,
    name?: string
}

interface ISettings {
    newApp: InsightsApp
    apps: InsightsApp[]
    currentApp: InsightsApp;
}

const map = {
    'refresh': 'enter'
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
                from: moment().utc().subtract(1, "h"),
                to: moment().utc()
            },
            grep: "",
            severityLevel: ["1","2","3"],
            ...momentjson(localStorage.getItem("query") as string)
        };
        const qsObject:any = location.search
        .slice(1)
        .split('&')
        .map(p => p.split('='))
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

        let qsSettings = null;
        if(qsObject.settings) {
            qsSettings = JSON.parse(atob(qsObject.settings));
        }
        const settings: ISettings = qsSettings || JSON.parse(localStorage.getItem("settings") as string) || {
            currentApp: {
                appId: "",
                apiKey: "",
                name: "Missing App"
            },
            apps: [],
            newApp: {
                appId: "",
                apiKey: "",
                name: "Missing App"
            }
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
        
        const settings = this.state.settings;

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
                            title="Settings"
                            visible={this.state.showSettings}
                            onOk={this.handleSettingsSave}
                            onCancel={this.handleSettingsclose}
                        >
                            <Divider>Select app</Divider>
                            <Select value={this.state.settings.currentApp.appId} style={{ width: 120 }} onChange={this.handleInsightAppChange}>
                                {settings.apps.map((x:any) => <Option key={x.appId} value={x.appId}>{x.name}</Option>)}
                            </Select>
                            <Divider>Shareable link</Divider>
                                        <span>{document.location.origin + "?settings=" + btoa(JSON.stringify(this.state.settings))}</span>
                            <Divider>Add New</Divider>
                            <Input value={this.state.settings.newApp.appId} onChange={(x) => this.newApp("appId",x)} addonBefore="App ID" />
                            <Input value={this.state.settings.newApp.apiKey} onChange={(x) => this.newApp("apiKey",x)} addonBefore="Api Key" />
                            <Input value={this.state.settings.newApp.name} onChange={(x) => this.newApp("name",x)} addonBefore="Name" />
                            <Button type="primary" onClick={(e) => this.newApp("add",e)}>Add new App</Button>
                        </Modal>
                    </div>
                </HotKeys>
                )}
                </Subscribe>
            </Provider>
        );
    }

    private newApp = (field:string, e:any) => {

        if(field === "add") {
            console.log("apps", this.state.settings.apps);
            this.state.settings.apps.push(this.state.settings.newApp)
            // @ts-ignore
            this.setState((ps) => {
                return {settings: {...ps.settings, 
                    currentApp: ps.settings.newApp,
                    newApp: {}
                }}
            },() => { console.log("state", this.state.settings)});

            return;
        }

        this.state.settings.newApp[field] =  e.target.value;
        this.setState((ps) => {
            return {settings: {...ps.settings }};
        })
    }

    private handleInsightAppChange = (e: any) => {
        console.log(e);
        const app = this.state.settings.apps.find((a) => a.appId === e) as InsightsApp;
        this.state.settings.currentApp = app;
        this.setState({});
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

        // todo: break out
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
            d = await async_fetch_data(this.state.settings.currentApp.appId || "", this.state.settings.currentApp.apiKey || "", this.state.query);
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
