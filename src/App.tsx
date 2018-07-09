
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
  notification,
  Checkbox,
} from "antd";

import momentjson from "moment-json-parser";
// import jsonMarkup from "json-markup";
const RangePicker = DatePicker.RangePicker;
const Option = Select.Option;
import * as moment from "moment";
import * as React from "react";
import { HotKeys } from "react-hotkeys";
import "./App.css";
import { List, fromJS, Map } from "immutable";
import transit from "transit-immutable-js";
import { Provider, Subscribe } from "unstated";
import BadRequestError from "./badrequesterror";

import SearchString from "search-string";


import {ConsoleRow, ILogRow} from "./ConsoleRow";
import {ConsoleView} from "./ConsoleView";
import {worker1} from "./workerWrap";

import {DetailsView} from "./DetailsView";
import {TimeChart} from "./TimeChart";
import {logContainer, LogContainer} from "./logContainer"

const API_BASE = "https://api.applicationinsights.io/v1/apps/";


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


interface IQueryObject {
  timeRange: {
    from: moment.Moment;
    to?: moment.Moment;
  };
  orderBy: "desc" | "asc";
  grep: string;
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

  const pq = SearchString.parse(query.grep);
  // console.log("pq", pq.toString());
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
  const bucketSize =
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
  return { logQuery, graphQuery };
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
  autoRefresh: boolean;
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

const keyBindingsMap = {
  refresh: "enter"
};

export class App extends React.Component<{}, IState> {
  
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
      graphData: null,
      autoRefresh: false
    };

    // @ts-ignore
    window.document.title =
      this.state.settings.currentApp.name + " - Lumberjack";

    worker1.on("worker:error:ai", ({ payload }: any) => {
      this.showDetailedError(payload);
    });
    worker1.on("logdata", ({ payload }: any) => {
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

  private setAgo = (time: string) => {
    const amount = parseInt(time.substr(0,2))
    const unit = time[2];
    this.handleTimeRangeChange(
      this.state.query.timeRange.from = moment().subtract(amount as any, unit),
      null as any as moment.Moment
    );
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
        value={this.state.query.orderBy}
      >
        <Option value="desc"  title={"Desc"}>
          <Icon type="arrow-down" />
        </Option>
        <Option value="asc" title={"Asc"}>
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
        width: 350,
        marginLeft: "10px"
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
            <HotKeys keyMap={keyBindingsMap} handlers={handlers}>
              <div className="App">
                <header className="App-header">
                <div className="topline">
                  <div className="searchBar">
                    <Input.Search
                      placeholder="Grep for message..."
                      type="search"
                      value={this.state.query.grep}
                      onChange={this.handleSearchChange}
                      addonAfter={orderBy}
                    />
                    </div>
                    <TreeSelect {...tProps} />
                    <Checkbox
                      checked={this.state.autoRefresh}
                      className="leftMargin"
                      onChange={this.handleAutoRefreshChange}>Auto refresh</Checkbox>
                      
                    <Button onClick={this.handleShowSettings} style={{marginLeft:"10px"}}>Settings</Button>
                  </div>
                  
                  <div className="searchControls">
                    <Button.Group size="small">
                    <Button onClick={() => this.setAgo("30m")}>Last 30m</Button>
                    <Button onClick={() => this.setAgo("01h")}>Last 60m</Button>
                    <Button onClick={() => this.setAgo("02h")}>Last 2h</Button>
                    <Button onClick={() => this.setAgo("12h")}>Last 12h</Button>
                    <Button onClick={() => this.setAgo("24h")}>Last 24h</Button>
                    <Button onClick={() => this.setAgo("02d")}>Last 2d</Button>
                    <Button onClick={() => this.setAgo("07d")}>Last week</Button>
                    </Button.Group>
                    <RangePicker
                      size="small"
                      className="timePicker"
                      defaultValue={[this.state.query.timeRange.from, to]}
                      style={{
                        marginLeft:"10px"
                      }}
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
                  title="Details"
                  visible={this.state.showDetails !== null}
                  width="90%"
                  onCancel={() => this.setState({ showDetails: null })}
                  onOk={() => this.setState({ showDetails: null })}
                >
                  {this.state.showDetails === null ? null :
                    <DetailsView details={this.state.showDetails}/>
                    // <div dangerouslySetInnerHTML=
                    //   {{__html: jsonMarkup(this.state.showDetails)}}>
                      
                    // </div>
                  }
                </Modal>
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

  private refreshTimerId: NodeJS.Timer;
  private handleAutoRefreshChange = (e: any) => {
    //  CheckboxChangeEvent
    this.setState({
      autoRefresh: e.target.checked
    });

    clearInterval(this.refreshTimerId);
    
    const refreshRate = 60 * 1000; // every 1 min
    if(e.target.checked) {
      this.getData();
      this.refreshTimerId = setInterval(() => {
        this.getData();
      }, refreshRate );
    }
  }

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
    if (error.code === "PartialError") {
      const ed0 = error.details[0];
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
    // const obj = r.toJS();
    // Modal.info({
    //   title: "Details",
    //   content: (

    //   ),
    //   width: "80%"
    // });

    // var url = location.href;               //Save down the URL without hash.
    location.href = "#" + r.get("itemId");                 //Go to the target element.
    // history.replaceState(null,null as any,url);   //Don't like hashes. Changing it back.
    console.log(r, r.toJS());
    this.setState(() => {
      return { showDetails: r.toJS() }
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
        query: queries.graphQuery
      });

      let logRes = worker1.emit("start-fetchLogData", {
        ...baseSettings,
        query: queries.logQuery
      });

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
        let data = await error.response;
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