/* tslint:disable */
import {
  Select,
  message,
  Modal,
  Icon,
  DatePicker,
  Divider,
  Button,
  Input,
  Tooltip,
  TreeSelect,
  notification
} from "antd";
import momentjson from "moment-json-parser";
const RangePicker = DatePicker.RangePicker;
const Option = Select.Option;
import * as moment from "moment";
import * as React from "react";
import * as reactreplace from "react-string-replace";
import { HotKeys } from "react-hotkeys";
import "./App.css";
// import Observer from '@researchgate/react-intersection-observer';
import DynamicList from "@researchgate/react-intersection-list";
import { List, fromJS, Map } from "immutable";
// import WorkerOld from "worker-loader!./workerOld.js";
import Worker from "worker-loader!./worker.js";
import transit from "transit-immutable-js";
import { Provider, Subscribe, Container } from "unstated";
import BadRequestError from "./badrequesterror";

import SearchString from "search-string";
import EventWorker from "event-worker";

// const worker = new WorkerOld();

const asyncWorker = new Worker();

type ILogState = {
  rows: List<any>;
};

const treeData = [
  {
    label: "Severity Level",
    value: "0-0",
    key: "0-0",
    children: [
      {
        label: "Debug",
        value: "0",
        key: "0-0-0"
      },
      {
        label: "Info",
        value: "1",
        key: "0-0-1"
      },
      {
        label: "Warning",
        value: "2",
        key: "0-0-2"
      },
      {
        label: "Error",
        value: "3",
        key: "0-0-3"
      }
    ]
  }
];

import {
  Charts,
  ChartContainer,
  ChartRow,
  YAxis,
  BarChart,
  Resizable,
  AreaChart
} from "react-timeseries-charts";
import { TimeSeries, Index } from "pondjs";

class TimeChart extends React.Component<any, any> {
  private handleTimeRangeChange = (d: any) => {
    console.log("handle time chamnge", d, moment(d.begin()), moment(d.end()));
    if (this.props.onTimeRangeChange)
      this.props.onTimeRangeChange(moment(d.begin()), moment(d.end()));
  };
  render() {
    if (!this.props.data) return null;

    const graphData = {
      name: "graphdata",
      columns: ["index", "trace", "warning", "error"],
      points: this.props.data.tables[0].rows.map((v: any) => {
        return [
          Index.getIndexString("1m", v[0]),
          v[1],
          v[2],
          v[3]          
        ]
      })
    }

    if (graphData.points.length === 0) return null;

    
    const timeseries3 = new TimeSeries(graphData);
    const maxTraces = timeseries3.max("trace");
    const maxErrorWarnings = Math.max(
      timeseries3.max("warning"),
      timeseries3.max("error"));
    
    const areaStyle = {
      trace: {
          line: {
              normal: {stroke: "#666", fill: "none", strokeWidth: 1},
              highlighted: {stroke: "#5a98cb", fill: "none", strokeWidth: 1},
              selected: {stroke: "steelblue", fill: "none", strokeWidth: 1},
              muted: {stroke: "steelblue", fill: "none", opacity: 0.4, strokeWidth: 1}
          },
          area: {
              normal: {fill: "#eee", stroke: "none", opacity: 0.75},
              highlighted: {fill: "#5a98cb", stroke: "none", opacity: 0.75},
              selected: {fill: "steelblue", stroke: "none", opacity: 0.75},
              muted: {fill: "steelblue", stroke: "none", opacity: 0.25}
          }
      }
  };

  const barStyle = {
    warning: {
      normal: {
        fill: "#FFA500",
        opacity: 0.7
      },
      highlighted: {
        fill: "#a7c4dd",
        opacity: 1.0
      },
      selected: {
        fill: "orange",
        opacity: 1.0
      },
      muted: {
        fill: "grey",
        opacity: 0.5
      }
    },
    error: {
      normal: {
        fill: "#ff0000",
        opacity: 0.7
      },
      highlighted: {
        fill: "#a7c4dd",
        opacity: 1.0
      },
      selected: {
        fill: "orange",
        opacity: 1.0
      },
      muted: {
        fill: "grey",
        opacity: 0.5
      }
    }
  }
  
    return (
      <div className="graph">
        <div style={{}}>
          <Resizable>
            <ChartContainer
              timeRange={timeseries3.timerange()}
              enableDragZoom
              onTimeRangeChanged={this.handleTimeRangeChange}
            >
              <ChartRow height="100">
                <YAxis
                  id="axis1"
                  visible={true}
                  label="Traces"
                  min={0}
                  max={maxTraces * 1.1}
                  width="60"
                  type="linear"
                  format=".0d"
                  tickCount={6}
                />               
                <Charts>
                  <AreaChart
                    axis="axis1"
                    series={timeseries3}
                    columns={{up: ["trace"]}}
                    style={areaStyle}
                  />
                  <BarChart
                    axis="axis2"
                    series={timeseries3}
                    columns={["warning","error"]}
                    size={3}
                    style={barStyle}
                  />
                  
                </Charts>
                <YAxis
                  id="axis2"
                  visible={true}
                  label="Errors"
                  min={0}
                  max={maxErrorWarnings * 1.1}
                  width="60"
                  type="linear"
                  format=".0d"
                  tickCount={6}
                />
              </ChartRow>
            </ChartContainer>
          </Resizable>
        </div>
      </div>
    );
  }
}

class LogContainer extends Container<ILogState> {
  state = {
    rows: List()
  };

  pendingSet: List<any> = List();
  pendingChanges: List<any> = List();

  add = (rows: List<any>) => {
    console.log("adding new", rows.count());
    this.pendingChanges = this.pendingChanges.concat(rows).toList();
    console.log("pending changes", this.pendingChanges.count());
    this.innerAdd();
  };

  set = (rows: List<any>) => {
    console.log("set", rows);
    this.pendingSet = rows;
    this.pendingChanges = this.pendingChanges.clear();
    this.innerSet();
  };

  innerAdd = () => {
    // @ts-ignore
    this.setState(s => {
      const rows = s.rows.concat(this.pendingChanges).toList();
      this.pendingChanges = this.pendingChanges.clear();
      return { rows };
    });
  };

  innerSet = () => {
    console.log("inner set");
    // @ts-ignore
    this.setState(() => {
      return { rows: this.pendingSet };
    });
  };
}
let logContainer = new LogContainer();

/*

DATA 

*/

const worker1 = new EventWorker(asyncWorker);

const API_BASE = "https://api.applicationinsights.io/v1/apps/";

interface IQueryObject {
  timeRange: {
    from: moment.Moment;
    to?: moment.Moment;
  };
  orderBy: "desc" | "asc";
  grep: string;
  //severityLevel: [1, 2, 3, 4];
  severityLevel: string[];
  maxAge?: number;
  take: number;
}

function escapeai(str: string) {
  return str.replace(/["]/g, '\\"');
}

function translateSeverityLevelFromTree(val: string[]) {
  return val.map(v => {
    const x = v.split("-").pop();
    console.log(x);
    return x;
  });
}

function where(fields: string[], value: string, negated: boolean) {
  let q = "| where ";
  fields.forEach(field => {
    q += `${field} ${negated ? "!" : ""}contains "${value}" ${
      negated ? "and" : "or"
    } `;
  });
  console.log("Where thing?", q);
  return q.substr(0, q.length - 4);
}

function getAiQueries(query: IQueryObject) {
  const sl = translateSeverityLevelFromTree(query.severityLevel);
  const severityLevel =
    sl.length > 0 ? `where severityLevel in (${sl.join(",")})` : "";
  // if to is null it should be now.

  const to = (query.timeRange.to || moment()).clone().utc();
  const from = query.timeRange.from.clone().utc();

  var pq = SearchString.parse(query.grep);
  const txtSegments: any[] = pq.getTextSegments();
  const conditions: any[] = pq.getConditionArray();
  const fieldsToGrep = [
    "message",
    "operation_Id",
    "customDimensions",
    "user_Id",
    "cloud_RoleInstance",
    "cloud_RoleName"
  ];

  const q2 = `
    exceptions    
    | extend message2 = tostring(customDimensions["RenderedMessage"])
    | union (
        traces
        | project-rename ["message2"] = message)
    | where timestamp between(datetime(${from.format(
      "YYYY-MM-DD HH:mm:ss"
    )}) .. datetime(${to.format("YYYY-MM-DD HH:mm:ss")}))
    | project-away message 
    | project-rename message = message2
    ${txtSegments
      .map(ts => where(fieldsToGrep, escapeai(ts.text), ts.negated))
      .join("\n")}
    ${conditions
      .map(condition =>
        where([condition.keyword], escapeai(condition.value), condition.negated)
      )
      .join("\n")}
    | ${severityLevel}
    
    `;
      console.log("dbeug", query.timeRange.from.diff(to, "days"));
  let bucketSize =
      to.diff(from, "days") > 10 ? "6h"
      : to.diff(from, "hours") > 24 ? "1h"
      : to.diff(from, "hours") > 1 ? "5m"
      : "1m";

  console.log("Bucket size", bucketSize);

  const graphQuery = `${q2}
  | order by timestamp ${query.orderBy}, itemId desc
    | summarize count() by bin(timestamp, ${bucketSize}), severityLevel
    | summarize
    trace = sumif(count_, severityLevel < 2),
    warning = sumif(count_, severityLevel == 2),
    error = sumif(count_, severityLevel >= 3)
    by bin(timestamp, ${bucketSize})
    | order by timestamp asc
  `;
  const take = query.take;
  const logQuery = `${q2}
  | order by timestamp ${query.orderBy}, itemId desc
  | take ${take}
  `;
      console.warn(logQuery);
  return { logQuery, graphQuery};
}

// interface InsightsResponse {
//   tables: Array<{
//     rows: any[][];
//   }>;
// }

interface IState {
  columns: any;
  rows: List<ILogRow>;
  search: string;
  query: IQueryObject;
  lastQuery: Map<any, any>;
  settings: ISettings;
  showSettings: boolean;
  loading: boolean;
  showDetails: ConsoleRow | null;
  queryHistory: List<Map<any, any>>;
  currentQuery: number;
  graphData: any;
  // defaultRange: [moment.Moment,moment.Moment]
}

interface InsightsApp extends Object {
  appId?: string;
  apiKey?: string;
  name?: string;
}

interface ISettings {
  newApp: InsightsApp;
  apps: InsightsApp[];
  currentApp: InsightsApp;
}

const map = {
  refresh: "enter"
};

class App extends React.Component<{}, IState> {
  /**
   *
   */
  constructor(props: {}) {
    super(props);

    var existingQuery = {
      ...momentjson(localStorage.getItem("query") as string)
    };
    if (existingQuery && existingQuery.timeRange) {
      existingQuery.timeRange.from = existingQuery.timeRange.from
        ? existingQuery.timeRange.from
        : undefined;
      existingQuery.timeRange.to = existingQuery.timeRange.to
        ? existingQuery.timeRange.to
        : undefined;
    }

    const query: IQueryObject = {
      orderBy: "desc",
      source: "traces",
      timeRange: {
        from: moment()
          .subtract(1, "h"),
        to: null
      },
      grep: "",
      severityLevel: ["1", "2", "3"],
      take: 5000,
      ...existingQuery
    };
    const qsObject: any = location.search
      .slice(1)
      .split("&")
      .map(p => p.split("="))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    let qsSettings = null;
    if (qsObject.settings) {
      qsSettings = JSON.parse(atob(qsObject.settings));
    }
    const settings: ISettings = qsSettings ||
      JSON.parse(localStorage.getItem("settings") as string) || {
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
      currentQuery: 0,
      graphData: null
    };

    // @ts-ignore
    window.document.title =
      this.state.settings.currentApp.name + " - Lumberjack";

    worker1.on("worker:error:ai", ({payload}:any) => {
      this.showDetailedError(payload);
    });
    worker1.on("logdata", ({payload}:any) => {
      console.log("on logdata", payload);

      switch (payload.topic) {
        case "new":
          const newRows = transit.fromJSON(payload.data);
          logContainer.set(newRows);    
          break;
        case "con":
          const addRows = transit.fromJSON(payload.data);
          logContainer.add(addRows);
          break;      
        default:
          break;
      }
    })
  }

  public async componentDidMount() {
    this.getData();
  }

  public render() {
    const handlers = {
      enter: this.handleRefresh,
      "shift+enter": this.handleRefresh, // this.handleSetGrepFromSelect,
      "shift+left": this.goBack,
      "shift+right": this.goForward,
      "ctrl+enter": this.handleSetGrepFromSelect
    };

    const orderBy = (
      <Select
        defaultValue={this.state.query.orderBy}
        onChange={this.handleChangeOrderBy}
      >
        <Option value="desc">
          <Icon type="arrow-down" />
        </Option>
        <Option value="asc">
          <Icon type="arrow-up" />
        </Option>
      </Select>
    );

    const hasNewQuery = !this.state.lastQuery.equals(fromJS(this.state.query));

    const tProps = {
      treeData,
      value: this.state.query.severityLevel,
      onChange: this.onTreeChange,
      treeCheckable: true,
      showCheckedStrategy: TreeSelect.SHOW_CHILD,
      searchPlaceholder: "Please select severity",
      style: {
        width: 300
      }
    };

    const settings = this.state.settings;

    const to = (this.state.query.timeRange.to
      ? this.state.query.timeRange.to
      : undefined) as moment.Moment;

    const currentTimeRangeValue: [moment.Moment, moment.Moment] = [
      this.state.query.timeRange.from,
      to
    ];
    return (
      <Provider inject={[logContainer]}>
        <Subscribe to={[LogContainer]}>
          {lc => (
            <HotKeys keyMap={map} handlers={handlers}>
              <div className="App">
                <header className="App-header">
                  <div className="searchBar">
                    <Input.Search
                      placeholder="Grep for message..."
                      type="search"
                      value={this.state.query.grep}
                      onChange={this.handleSearchChange}
                      addonAfter={orderBy}
                    />
                  </div>
                  <div className="searchControls">
                    <RangePicker
                      className="timePicker"
                      defaultValue={[this.state.query.timeRange.from, to]}
                      ranges={{
                        "Last 30m": [
                          moment()
                            .subtract(30, "m")
                        ],
                        "Last 60m": [
                          moment()
                            .subtract(60, "m")
                        ],
                        "Last 2h": [
                          moment()
                            .subtract(2, "h")
                        ],
                        "Last 8h": [
                          moment()
                            .subtract(8, "h")
                        ],
                        Today: [
                          moment()
                            .startOf("day"),
                          moment()
                            .endOf("day")
                        ],
                        "This Month": [
                          moment()
                            .startOf("month"),
                          moment()
                            .endOf("month")
                        ]
                      }}
                      value={currentTimeRangeValue}
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      onChange={this.rangeChange}
                    />
                    <TreeSelect {...tProps} />
                    <Button onClick={this.handleShowSettings}>Settings</Button>
                  </div>
                  <Tooltip
                    placement="left"
                    title="(Enter) - Results are often delayed 1-3 minutes."
                  >
                    <Button
                      type={hasNewQuery ? "primary" : "dashed"}
                      className="refreshbtn"
                      onClick={this.handleRefresh}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                  <TimeChart
                    data={this.state.graphData}
                    onTimeRangeChange={this.handleTimeRangeChange}
                  />
                </header>

                <ConsoleView
                  rows={lc.state.rows}
                  setGrep={this.handleSetGrep}
                  showDetails={this.handleShowDetails}
                />
                <Modal
                  title="Settings"
                  visible={this.state.showSettings}
                  onOk={this.handleSettingsSave}
                  onCancel={this.handleSettingsclose}
                >
                  <Divider>Select app</Divider>
                  <Select
                    value={this.state.settings.currentApp.appId}
                    style={{ width: 120 }}
                    onChange={this.handleInsightAppChange}
                  >
                    {settings.apps.map((x: any) => (
                      <Option key={x.appId} value={x.appId}>
                        {x.name}
                      </Option>
                    ))}
                  </Select>
                  <Divider>Shareable link</Divider>
                  <span>
                    {document.location.origin +
                      "?settings=" +
                      btoa(JSON.stringify(this.state.settings))}
                  </span>
                  <Divider>Add New</Divider>
                  <Input
                    value={this.state.settings.newApp.appId}
                    onChange={x => this.newApp("appId", x)}
                    addonBefore="App ID"
                  />
                  <Input
                    value={this.state.settings.newApp.apiKey}
                    onChange={x => this.newApp("apiKey", x)}
                    addonBefore="Api Key"
                  />
                  <Input
                    value={this.state.settings.newApp.name}
                    onChange={x => this.newApp("name", x)}
                    addonBefore="Name"
                  />
                  <Button type="primary" onClick={e => this.newApp("add", e)}>
                    Add new App
                  </Button>
                </Modal>
              </div>
            </HotKeys>
          )}
        </Subscribe>
      </Provider>
    );
  }

  private newApp = (field: string, e: any) => {
    if (field === "add") {
      console.log("apps", this.state.settings.apps);
      this.state.settings.apps.push(this.state.settings.newApp);
      // @ts-ignore
      this.setState(
        ps => {
          return {
            settings: {
              ...ps.settings,
              currentApp: ps.settings.newApp,
              newApp: {}
            }
          };
        },
        () => {
          console.log("state", this.state.settings);
        }
      );

      return;
    }

    this.state.settings.newApp[field] = e.target.value;
    this.setState(ps => {
      return { settings: { ...ps.settings } };
    });
  };

  private handleInsightAppChange = (e: any) => {
    console.log(e);
    const app = this.state.settings.apps.find(
      a => a.appId === e
    ) as InsightsApp;
    this.state.settings.currentApp = app;
    this.setState({});
  };

  private goBack = () => {
    const current = this.state.currentQuery;
    console.log(
      "go back from",
      this.state.currentQuery,
      "to",
      this.state.currentQuery - 1
    );
    var last = this.state.queryHistory.get(current - 1);
    if (!last) {
      return;
    }
    this.setState(ps => {
      return {
        query: last.toJS(),
        currentQuery: ps.queryHistory.indexOf(last)
      };
    });
  };

  private goForward = () => {
    var current = this.state.currentQuery;
    console.log("go forward from", current, "to", current + 1);
    var last = this.state.queryHistory.get(current + 1);
    if (!last) {
      return;
    }
    this.setState(ps => {
      return {
        query: last.toJS(),
        currentQuery: ps.queryHistory.indexOf(last)
      };
    });
  };
  private onTreeChange = (value: any) => {
    this.setState({
      query: { ...this.state.query, severityLevel: value }
    });
  };

  private handleShowSettings = () => {
    this.setState({
      showSettings: true
    });
  };

  private handleSettingsSave = () => {
    this.setState({
      showSettings: false
    });

    localStorage.setItem("settings", JSON.stringify(this.state.settings));
    // @ts-ignore
    window.document.title =
      this.state.settings.currentApp.name + " - Lumberjack";
  };

  private handleSettingsclose = () => {
    this.setState({
      showSettings: false
    });
  };

  private handleChangeOrderBy = () => {
    this.setState(ps => {
      return {
        query: {
          ...ps.query,
          orderBy: ps.query.orderBy === "desc" ? "asc" : "desc"
        }
      };
    });
  };
  private handleTimeRangeChange = (from: moment.Moment, to: moment.Moment) => {
    const ms: [moment.Moment] = [from, to] as any;
    this.rangeChange(ms, []);
  };
  private rangeChange = (dates: [moment.Moment], dateStrings: string[]) => {
    this.setState(ps => {
      return {
        query: {
          ...ps.query,
          timeRange: {
            from: dates[0],
            to: dates[1]
          }
        }
      };
    });
  };

  private handleSearchChange = (e: any) => {
    const v = e.target.value;
    this.setState(ps => {
      return { query: { ...ps.query, grep: v } };
    });
  };

  private handleSetGrep = (values: {}) => {
    this.setState(ps => {
      return { query: { ...ps.query, ...values } };
    }, this.getData);
  };

  private handleSetGrepFromSelect = () => {
    const selection = window
      .getSelection()
      .getRangeAt(0)
      .cloneContents().textContent;
    if (typeof selection === "string" && selection !== "") {
      this.handleSetGrep({ grep: selection });
    }
  };

  private handleRefresh = async (e?: any) => {
    if (e) {
      e.stopPropagation();
    }

    await this.getData();
  };

  private showDetailedError(error: any) {
    console.error("Detailed error", error);

    let title = error.message;
    let message = ""
    let innerTitle = ""
    let innerMessage = ""
    if(error.code === "PartialError") {
      let ed0 =  error.details[0];
      message = ed0.message;
      innerTitle = ed0.innererror.message; 
    } else {
      // message = error.
      innerTitle = error.innererror.message
      innerMessage = error.innererror.innererror.message
    }

    const key = `open${Date.now()}`;
        const btn = (
          <Button
            type="primary"
            size="small"
            onClick={() => notification.close(key)}
          >
            Close
          </Button>
        );
        notification.error({
          key: key,
          btn: btn,
          duration: 20,
          message: "Error: " + title,
          description: (
            <div>
              <p>{message}</p>
              <strong>{innerTitle}</strong>
              <p>{innerMessage}</p>
              <p>See console for more details</p>
            </div>
          )
        });
  }

  private handleShowDetails = (r: any) => {
    const obj = r.toJS();
    Modal.info({
      title: "Details",
      content: (
        <div>
          <pre>
            {JSON.stringify(
              obj,
              (k, v) => {
                if (v === null || v === "") {
                  return undefined;
                  // } else if (typeof v === "string" && (v.indexOf("[") === 1 || v.indexOf("{") === 1)) {
                  //     console.warn("ye", v);
                  //     return JSON.stringify(v, null, 2);
                }

                //console.log(v, typeof v);

                return v;
              },
              2
            )}
          </pre>
        </div>
      ),
      width: "80%"
    });

    this.setState({
      showDetails: r
    });
  };

  private async getData() {
    const hide = message.loading("Refreshing data...", 0);
    // save query to storage
    localStorage.setItem("query", JSON.stringify(this.state.query));

    // todo: break out
    const last = this.state.queryHistory.last() || Map();
    if (!last.equals(fromJS(this.state.query))) {
      this.setState(
        ps => {
          return {
            queryHistory: ps.queryHistory.push(fromJS(ps.query)),
            currentQuery: ps.queryHistory.count()
          };
        },
        () => {
          console.log("as", this.state.queryHistory.toJS());
        }
      );
    }

    this.setState({
      lastQuery: fromJS(this.state.query)
    });

    const queries = getAiQueries(this.state.query);
    try {
      // var res2 = await worker1.emit("fetchData", {query: queries.logQuery})
      const appId = this.state.settings.currentApp.appId || "";
      const apiKey = this.state.settings.currentApp.apiKey || "";
      const baseSettings = {
        url: API_BASE + appId + "/query",
        apiKey: apiKey
      };
      
      var graphRes = worker1.emit("fetchGraphData", {
        ...baseSettings,
        query: queries.graphQuery});

      var logRes = worker1.emit("start-fetchLogData", {
          ...baseSettings,
          query: queries.logQuery});    
      
      // console.log("GRAPH RES", await graphRes);
      this.setState({
        graphData: await graphRes
      });
      console.log("DOOOOONE", await logRes);

      message.success("Success!", 1.5);
    }
    catch (error) {
      console.log("XX", error.toString());
      console.log(error.badRequest, error.response, error, error instanceof BadRequestError);
      console.error("Failed", error.badRequest, error, error.status, error.message, error.code);

      // do not warn on manual abort
      if (error.badRequest) {
        var data = await error.response;
        console.log("bad data", data);
        this.showDetailedError(data.error);
      } else if (error.name !== "AbortError" && error.code !== 20) {
        message.error(
          "Failed to fetch data from AppInsights, check your settings"
        );
      }
      return;
    } finally {
      hide();
    }
  }
}

interface ILogRow {
  setGrep: (str: string) => void;
  showDetails: (row: ILogRow) => void;
}

interface IConsoleProps {
  rows: List<ILogRow>;
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
      />
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

  shouldComponentUpdate(nextProps: any, nextState: any) {
    if (!nextProps.row.equals(this.props.row)) {
      return true;
    }
    return false;
  }

  public render() {
    const row: any = this.props.row;
    const severityLevel = translateSeverityLevel(row.get("severityLevel"));

    const regexp = /\B(#[a-zA-Z0-9-]+\b|#"[a-zA-Z0-9- ]+["|\b])(?!;)/gu;

    const msg = reactreplace(
      row.get("message"),
      regexp,
      (match: string, i: number) => {
        const grep = () => {
          this.props.setGrep({ grep: match });
        };
        return (
          <span className="hashtag" key={i} onClick={grep}>
            {match}
          </span>
        );
      }
    );

    // const handlers = {
    //     'ctrl+enter': this.setGrep
    // };
    const r: any = row;
    //console.log("Render?", r.toJS());
    const opId = r.get("operation_Id");
    return (
      <div className="consoleRow" key={r.get("itemId")}>
        <Tooltip placement="topLeft" title={r.get("cloud_RoleInstance")}>
          <div className="roleInstance link" onClick={this.setRoleInstance}>
            {r.get("cloud_RoleInstance")}
          </div>
        </Tooltip>
        <Tooltip placement="topLeft" title={r.get("cloud_RoleName")}>
          <div className="roleName link" onClick={this.setRoleName}>
            {r.get("cloud_RoleName")}
          </div>
        </Tooltip>
        <div className="timestamp">
          {moment(r.get("timestamp")).format("YYYY-MM-DD HH:mm:ss:SSS")}
        </div>
        <Icon className="details" type="message" onClick={this.showDetails} />
        <div className={"loglevel " + severityLevel} onClick={this.setSeverity}>
          {severityLevel}
        </div>
        {opId ? (
          <div className="operation_Id " onClick={this.setOpid}>
            {opId}
          </div>
        ) : null}
        <div className="message">{msg}</div>
        <div className="itemType">{r.get("itemType")}</div>
      </div>
    );
  }

  private setOpid = () => {
    this.props.setGrep({
      grep: `operation_Id:"${this.props.row.get("operation_Id").toString()}"`
    });
  };

  private setRoleInstance = () => {
    this.props.setGrep({
      grep: `cloud_RoleInstance:"${this.props.row
        .get("cloud_RoleInstance")
        .toString()}"`
    });
  };

  private setRoleName = () => {
    this.props.setGrep({
      grep: `cloud_RoleName:"${this.props.row
        .get("cloud_RoleName")
        .toString()}"`
    });
  };

  private setSeverity = () => {
    this.props.setGrep({
      severityLevel: [this.props.row.get("severityLevel").toString()]
    });
  };

  private showDetails = () => {
    this.props.showDetails(this.props.row);
  };
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
