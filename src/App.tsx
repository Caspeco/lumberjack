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
import WorkerOld from "worker-loader!./workerOld.js";
import Worker from "worker-loader!./worker.js";
import transit from "transit-immutable-js";
import { Provider, Subscribe, Container } from "unstated";
import BadRequestError from "./badrequesterror";

import SearchString from "search-string";
import EventWorker from "event-worker";

const worker = new WorkerOld();

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
  Resizable
} from "react-timeseries-charts";
import { TimeSeries, Index } from "pondjs";

// const dx: any = {"tables":[{"name":"PrimaryResult","columns":[{"name":"timestamp","type":"datetime"},{"name":"count_","type":"long"}],"rows":[["2018-06-20T17:05:00Z",405],["2018-06-20T17:10:00Z",577],["2018-06-20T17:15:00Z",537],["2018-06-20T17:20:00Z",676],["2018-06-20T17:25:00Z",463],["2018-06-20T17:30:00Z",457],["2018-06-20T17:35:00Z",363],["2018-06-20T17:40:00Z",854],["2018-06-20T17:45:00Z",765],["2018-06-20T17:50:00Z",512],["2018-06-20T17:55:00Z",439],["2018-06-20T18:00:00Z",479],["2018-06-20T18:05:00Z",705],["2018-06-20T18:10:00Z",548],["2018-06-20T18:15:00Z",541],["2018-06-20T18:20:00Z",462],["2018-06-20T18:25:00Z",312],["2018-06-20T18:30:00Z",882],["2018-06-20T18:35:00Z",545],["2018-06-20T18:40:00Z",650],["2018-06-20T18:45:00Z",545],["2018-06-20T18:50:00Z",603],["2018-06-20T18:55:00Z",595],["2018-06-20T19:00:00Z",539],["2018-06-20T19:05:00Z",372],["2018-06-20T19:10:00Z",509],["2018-06-20T19:15:00Z",401],["2018-06-20T19:20:00Z",285],["2018-06-20T19:25:00Z",561],["2018-06-20T19:30:00Z",766],["2018-06-20T19:35:00Z",296],["2018-06-20T19:40:00Z",460],["2018-06-20T19:45:00Z",592],["2018-06-20T19:50:00Z",510],["2018-06-20T19:55:00Z",480],["2018-06-20T20:00:00Z",687],["2018-06-20T20:05:00Z",583],["2018-06-20T20:10:00Z",491],["2018-06-20T20:15:00Z",580],["2018-06-20T20:20:00Z",443],["2018-06-20T20:25:00Z",650],["2018-06-20T20:30:00Z",643],["2018-06-20T20:35:00Z",422],["2018-06-20T20:40:00Z",569],["2018-06-20T20:45:00Z",760],["2018-06-20T20:50:00Z",631],["2018-06-20T20:55:00Z",541],["2018-06-20T21:00:00Z",612],["2018-06-20T21:05:00Z",447],["2018-06-20T21:10:00Z",334],["2018-06-20T21:15:00Z",374],["2018-06-20T21:20:00Z",423],["2018-06-20T21:25:00Z",603],["2018-06-20T21:30:00Z",485],["2018-06-20T21:35:00Z",680],["2018-06-20T21:40:00Z",587],["2018-06-20T21:45:00Z",512],["2018-06-20T21:50:00Z",293],["2018-06-20T21:55:00Z",312],["2018-06-20T22:00:00Z",415],["2018-06-20T22:05:00Z",434],["2018-06-20T22:10:00Z",374],["2018-06-20T22:15:00Z",714],["2018-06-20T22:20:00Z",683],["2018-06-20T22:25:00Z",558],["2018-06-20T22:30:00Z",401],["2018-06-20T22:35:00Z",486],["2018-06-20T22:40:00Z",654],["2018-06-20T22:45:00Z",455],["2018-06-20T22:50:00Z",302],["2018-06-20T22:55:00Z",304],["2018-06-20T23:00:00Z",499],["2018-06-20T23:05:00Z",312],["2018-06-20T23:10:00Z",369],["2018-06-20T23:15:00Z",459],["2018-06-20T23:20:00Z",615],["2018-06-20T23:25:00Z",341],["2018-06-20T23:30:00Z",437],["2018-06-20T23:35:00Z",349],["2018-06-20T23:40:00Z",593],["2018-06-20T23:45:00Z",398],["2018-06-20T23:50:00Z",613],["2018-06-20T23:55:00Z",356],["2018-06-21T00:00:00Z",432],["2018-06-21T00:05:00Z",334],["2018-06-21T00:10:00Z",546],["2018-06-21T00:15:00Z",361],["2018-06-21T00:20:00Z",366],["2018-06-21T00:25:00Z",232],["2018-06-21T00:30:00Z",466],["2018-06-21T00:35:00Z",498],["2018-06-21T00:40:00Z",444],["2018-06-21T00:45:00Z",307],["2018-06-21T00:50:00Z",365],["2018-06-21T00:55:00Z",453],["2018-06-21T01:00:00Z",360],["2018-06-21T01:05:00Z",350],["2018-06-21T01:10:00Z",246],["2018-06-21T01:15:00Z",470],["2018-06-21T01:20:00Z",458],["2018-06-21T01:25:00Z",329],["2018-06-21T01:30:00Z",241],["2018-06-21T01:35:00Z",434],["2018-06-21T01:40:00Z",420],["2018-06-21T01:45:00Z",486],["2018-06-21T01:50:00Z",369],["2018-06-21T01:55:00Z",334],["2018-06-21T02:00:00Z",256],["2018-06-21T02:05:00Z",621],["2018-06-21T02:10:00Z",490],["2018-06-21T02:15:00Z",650],["2018-06-21T02:20:00Z",283],["2018-06-21T02:25:00Z",284],["2018-06-21T02:30:00Z",230],["2018-06-21T02:35:00Z",550],["2018-06-21T02:40:00Z",592],["2018-06-21T02:45:00Z",669],["2018-06-21T02:50:00Z",444],["2018-06-21T02:55:00Z",315],["2018-06-21T03:00:00Z",291],["2018-06-21T03:05:00Z",501],["2018-06-21T03:10:00Z",421],["2018-06-21T03:15:00Z",480],["2018-06-21T03:20:00Z",225],["2018-06-21T03:25:00Z",229],["2018-06-21T03:30:00Z",322],["2018-06-21T03:35:00Z",511],["2018-06-21T03:40:00Z",434],["2018-06-21T03:45:00Z",608],["2018-06-21T03:50:00Z",314],["2018-06-21T03:55:00Z",505],["2018-06-21T04:00:00Z",508],["2018-06-21T04:05:00Z",571],["2018-06-21T04:10:00Z",409],["2018-06-21T04:15:00Z",580],["2018-06-21T04:20:00Z",578],["2018-06-21T04:25:00Z",538],["2018-06-21T04:30:00Z",499],["2018-06-21T04:35:00Z",469],["2018-06-21T04:40:00Z",499],["2018-06-21T04:45:00Z",383],["2018-06-21T04:50:00Z",324],["2018-06-21T04:55:00Z",589],["2018-06-21T05:00:00Z",654],["2018-06-21T05:05:00Z",382],["2018-06-21T05:10:00Z",596],["2018-06-21T05:15:00Z",738],["2018-06-21T05:20:00Z",601],["2018-06-21T05:25:00Z",551],["2018-06-21T05:30:00Z",288],["2018-06-21T05:35:00Z",347],["2018-06-21T05:40:00Z",605],["2018-06-21T05:45:00Z",772],["2018-06-21T05:50:00Z",623],["2018-06-21T05:55:00Z",577],["2018-06-21T06:00:00Z",888],["2018-06-21T06:05:00Z",711],["2018-06-21T06:10:00Z",712],["2018-06-21T06:15:00Z",376],["2018-06-21T06:20:00Z",291],["2018-06-21T06:25:00Z",1008],["2018-06-21T06:30:00Z",794],["2018-06-21T06:35:00Z",563],["2018-06-21T06:40:00Z",688],["2018-06-21T06:45:00Z",715],["2018-06-21T06:50:00Z",743],["2018-06-21T06:55:00Z",630],["2018-06-21T07:00:00Z",830],["2018-06-21T07:05:00Z",737],["2018-06-21T07:10:00Z",841],["2018-06-21T07:15:00Z",534],["2018-06-21T07:20:00Z",781],["2018-06-21T07:25:00Z",518],["2018-06-21T07:30:00Z",700],["2018-06-21T07:35:00Z",653],["2018-06-21T07:40:00Z",1220],["2018-06-21T07:45:00Z",862],["2018-06-21T07:50:00Z",1053],["2018-06-21T07:55:00Z",233],["2018-06-21T08:00:00Z",452],["2018-06-21T08:05:00Z",516],["2018-06-21T08:10:00Z",489],["2018-06-21T08:15:00Z",700],["2018-06-21T08:20:00Z",692],["2018-06-21T08:25:00Z",945],["2018-06-21T08:30:00Z",986],["2018-06-21T08:35:00Z",794],["2018-06-21T08:40:00Z",802],["2018-06-21T08:45:00Z",515],["2018-06-21T08:50:00Z",459],["2018-06-21T08:55:00Z",779],["2018-06-21T09:00:00Z",725],["2018-06-21T09:05:00Z",620],["2018-06-21T09:10:00Z",1085],["2018-06-21T09:15:00Z",841],["2018-06-21T09:20:00Z",543],["2018-06-21T09:25:00Z",282],["2018-06-21T09:30:00Z",220],["2018-06-21T09:35:00Z",6233],["2018-06-21T09:40:00Z",915],["2018-06-21T09:45:00Z",850],["2018-06-21T09:50:00Z",595],["2018-06-21T09:55:00Z",1210],["2018-06-21T10:00:00Z",850],["2018-06-21T10:05:00Z",842],["2018-06-21T10:10:00Z",754],["2018-06-21T10:15:00Z",549],["2018-06-21T10:20:00Z",466],["2018-06-21T10:25:00Z",888],["2018-06-21T10:30:00Z",658],["2018-06-21T10:35:00Z",589],["2018-06-21T10:40:00Z",1124],["2018-06-21T10:45:00Z",3055],["2018-06-21T10:50:00Z",2181],["2018-06-21T10:55:00Z",771],["2018-06-21T11:00:00Z",764],["2018-06-21T11:05:00Z",403],["2018-06-21T11:10:00Z",442],["2018-06-21T11:15:00Z",704],["2018-06-21T11:20:00Z",1099],["2018-06-21T11:25:00Z",452],["2018-06-21T11:30:00Z",398],["2018-06-21T11:35:00Z",413],["2018-06-21T11:40:00Z",1232],["2018-06-21T11:45:00Z",729],["2018-06-21T11:50:00Z",644],["2018-06-21T11:55:00Z",674],["2018-06-21T12:00:00Z",606],["2018-06-21T12:05:00Z",644],["2018-06-21T12:10:00Z",836],["2018-06-21T12:15:00Z",520],["2018-06-21T12:20:00Z",707],["2018-06-21T12:25:00Z",689],["2018-06-21T12:30:00Z",904],["2018-06-21T12:35:00Z",1558],["2018-06-21T12:40:00Z",3154],["2018-06-21T12:45:00Z",3028],["2018-06-21T12:50:00Z",2767],["2018-06-21T12:55:00Z",4481],["2018-06-21T13:00:00Z",4745],["2018-06-21T13:05:00Z",3574],["2018-06-21T13:10:00Z",3863],["2018-06-21T13:15:00Z",3569],["2018-06-21T13:20:00Z",3318],["2018-06-21T13:25:00Z",4188],["2018-06-21T13:30:00Z",3848],["2018-06-21T13:35:00Z",3389],["2018-06-21T13:40:00Z",4203],["2018-06-21T13:45:00Z",3117],["2018-06-21T13:50:00Z",3371],["2018-06-21T13:55:00Z",4146],["2018-06-21T14:00:00Z",3527],["2018-06-21T14:05:00Z",3326],["2018-06-21T14:10:00Z",3300],["2018-06-21T14:15:00Z",3290],["2018-06-21T14:20:00Z",2596],["2018-06-21T14:25:00Z",4187],["2018-06-21T14:30:00Z",2481],["2018-06-21T14:35:00Z",3257],["2018-06-21T14:40:00Z",9394],["2018-06-21T14:45:00Z",3433],["2018-06-21T14:50:00Z",3579],["2018-06-21T14:55:00Z",4104],["2018-06-21T15:00:00Z",4409],["2018-06-21T15:05:00Z",2842],["2018-06-21T15:10:00Z",1635],["2018-06-21T15:15:00Z",2104],["2018-06-21T15:20:00Z",2492],["2018-06-21T15:25:00Z",4674],["2018-06-21T15:30:00Z",2398],["2018-06-21T15:35:00Z",2924],["2018-06-21T15:40:00Z",4312],["2018-06-21T15:45:00Z",2081],["2018-06-21T15:50:00Z",3593],["2018-06-21T15:55:00Z",3534],["2018-06-21T16:00:00Z",2826],["2018-06-21T16:05:00Z",2788],["2018-06-21T16:10:00Z",2922],["2018-06-21T16:15:00Z",2273],["2018-06-21T16:20:00Z",3276],["2018-06-21T16:25:00Z",2368],["2018-06-21T16:30:00Z",2613],["2018-06-21T16:35:00Z",2760],["2018-06-21T16:40:00Z",2396],["2018-06-21T16:45:00Z",2314],["2018-06-21T16:50:00Z",3599],["2018-06-21T16:55:00Z",2642],["2018-06-21T17:00:00Z",2451]]}],"render":{"visualization":"barchart","title":null,"accumulate":false,"isQuerySorted":true,"kind":"stacked"},"statistics":{"query":{"executionTime":0.6250008,"resourceUsage":{"cache":{"memory":{"hits":8351,"misses":0,"total":8351},"disk":{"hits":0,"misses":0,"total":0}},"cpu":{"user":"00:00:00.0937500","kernel":"00:00:00","totalCpu":"00:00:00.0937500"},"memory":{"peakPerNode":503323248}},"inputDatasetStatistics":{"extents":{"total":2842,"scanned":125},"rows":{"total":8512570249,"scanned":152519741}},"datasetStatistics":[{"tableRowCount":288,"tableSize":5184}]}}};

class TimeChart extends React.Component<any, any> {
  private handleTimeRangeChange = (d: any) => {
    console.log("handle time chamnge", d, moment(d.begin()), moment(d.end()));
    if (this.props.onTimeRangeChange)
      this.props.onTimeRangeChange(moment(d.begin()), moment(d.end()));
  };
  render() {
    if (!this.props.data) return null;
    const data = {
      name: "entries",
      columns: ["index", "value"],
      //tz: "Etc/UTC",
      points: this.props.data.tables[0].rows.map((v: any) => [
        Index.getIndexString("1m", v[0]),
        v[1]
      ])
    };
    if (data.points.length === 0) return null;
    console.log(data);

    const timeseries = new TimeSeries(data);
    //var timerange = timeseries.timerange()
    return (
      <div className="graph">
        <div style={{}}>
          <Resizable>
            <ChartContainer
              timeRange={timeseries.timerange()}
              enableDragZoom
              onTimeRangeChanged={this.handleTimeRangeChange}
            >
              <ChartRow height="100">
                <YAxis
                  id="axis1"
                  visible={true}
                  label=""
                  min={0}
                  max={timeseries.max() * 1.1}
                  width="60"
                  type="linear"
                />
                <Charts>
                  <BarChart
                    axis="axis1"
                    series={timeseries}
                    style={{
                      value: {
                        normal: {
                          fill: "#2a81cb",
                          opacity: 0.8
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
                    }}
                  />
                </Charts>
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
// worker1.emit("HELLO", "WORLD");

const API_BASE = "https://api.applicationinsights.io/v1/apps/";

// let controllers = {};
// async function async_fetch(url: string, conf: any) {
//   if (controllers[conf.requestId]) {
//     console.warn("abort");
//     controllers[conf.requestId].abort();
//   }
//   controllers[conf.requestId] = new AbortController();

//   const signal = controllers[conf.requestId].signal;
//   const response = await fetch(url, { ...conf, signal });
//   if (response.ok) {
//     console.log("Response Age: ", response.headers["age"]);
//     return await response.json();
//   } else if (response.status === 400) {
//     throw new BadRequestError(response);
//   }
//   throw new Error(response.status.toString());
// }

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
  //return "message contains "${escapeai(grep)}" or operation_Id contains "${escapeai(grep)}" or customDimensions contains "${escapeai(grep)}" or user_Id contains "${escapeai(grep)}" or cloud_RoleInstance contains "${escapeai(grep)}"
}

function getAiQueries(query: IQueryObject) {
  const sl = translateSeverityLevelFromTree(query.severityLevel);
  const severityLevel =
    sl.length > 0 ? `where severityLevel in (${sl.join(",")})` : "";
  // if to is null it should be now.
  console.warn(query.timeRange.to);
  const to = query.timeRange.to || moment().utc();
  console.warn(to);

  console.log("grep", query.grep);

  var pq = SearchString.parse(query.grep);
  console.log(pq);
  console.log("txt", pq.getTextSegments());
  console.log("ca", pq.getConditionArray());
  console.log("pq", pq.getParsedQuery());
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
    | where timestamp between(datetime(${query.timeRange.from.format(
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

  const graphQuery = `${q2}
  | order by timestamp ${query.orderBy}, itemId desc
    | summarize count() by bin(timestamp, 1m)
    | order by timestamp asc
  `;
  const take = query.take;
  const logQuery = `${q2}
  | order by timestamp ${query.orderBy}, itemId desc
  | skip 1
  | take ${take}
  `;

  return { logQuery, graphQuery};
}

// async function async_fetch_data(
//   appId: string,
//   appKey: string,
//   graphQuery: string,
//   logQuery: string
// ) {
//   console.info("Graph Query", graphQuery);

//   console.info("Log Query", logQuery);

//   const t1 = async_fetch(API_BASE + appId + "/query", {
//     requestId: "logdata",
//     body: JSON.stringify({ query: logQuery }),
//     headers: {
//       "x-api-key": appKey,
//       "content-type": "application/json"
//       // 'Cache-Control': 'no-cache' //'max-age=' + (query.maxAge || 30), this should be added as option
//     },
//     method: "POST"
//   });

//   const t2 = async_fetch(API_BASE + appId + "/query", {
//     requestId: "graphdata",
//     body: JSON.stringify({ query: graphQuery }),
//     headers: {
//       "x-api-key": appKey,
//       "content-type": "application/json"
//       // 'Cache-Control': 'no-cache' //'max-age=' + (query.maxAge || 30), this should be added as option
//     },
//     method: "POST"
//   });

//   return {
//     logPromise: t1,
//     graphPromise: t2
//   };
// }

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
        ? existingQuery.timeRange.from.utc()
        : undefined;
      existingQuery.timeRange.to = existingQuery.timeRange.to
        ? existingQuery.timeRange.to.utc()
        : undefined;
    }

    const query: IQueryObject = {
      orderBy: "desc",
      source: "traces",
      timeRange: {
        from: moment()
          .utc()
          .subtract(1, "h"),
        to: null
      },
      grep: "",
      severityLevel: ["1", "2", "3"],
      take: 1000,
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

    //let cachedRows = List();
    // worker.onmessage = (event: any) => {
    //   console.time("des");
    //   switch (event.data.topic) {
    //     case "new":
    //     case "con":
    //     const newRows = transit.fromJSON(event.data.payload);
    //     case "new":         
    //       logContainer.set(newRows);    
    //       break;
    //     case "con":
    //       logContainer.set(newRows);
    //       break;
    //     case "fetch":
    //       console.info("should fetch");
    //     default:
    //       break;
    //   }
    //   console.timeEnd("des");
    // };

    worker1.on("logdata", ({payload}:any) => {
      switch (payload.topic) {
        case "new":
        case "con":
        const newRows = transit.fromJSON(payload.data);
        case "new":         
          logContainer.set(newRows);    
          break;
        case "con":
          logContainer.set(newRows);
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
                            .utc()
                            .subtract(30, "m")
                        ],
                        "Last 60m": [
                          moment()
                            .utc()
                            .subtract(60, "m")
                        ],
                        "Last 2h": [
                          moment()
                            .utc()
                            .subtract(2, "h")
                        ],
                        "Last 8h": [
                          moment()
                            .utc()
                            .subtract(8, "h")
                        ],
                        Today: [
                          moment()
                            .utc()
                            .startOf("day"),
                          moment()
                            .endOf("day")
                            .utc()
                        ],
                        "This Month": [
                          moment()
                            .utc()
                            .startOf("month"),
                          moment()
                            .endOf("month")
                            .utc()
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
      
      console.log("GRAPH RES", await graphRes);
      this.setState({
        graphData: await graphRes
      });
      console.log("DOOOOONE", await logRes);

      message.success("Success!", 1.5);
    }
    catch (error) {
      console.log(error, error instanceof BadRequestError);
      console.error("Failed", error);

      // do not warn on manual abort
      if (error instanceof BadRequestError) {
        var data = await error.response.json();
        console.log("bad data", data);
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
          message: "Error: " + data.error.message,
          description: (
            <div>
              <strong>{data.error.innererror.message}</strong>
              <p>{data.error.innererror.innererror.message}</p>
            </div>
          )
        });
      } else if (error.code !== 20) {
        message.error(
          "Failed to fetch data from AppInsights, check your settings"
        );
      }
      return;
    } finally {
      hide();
    }
      

    // let d: InsightsResponse;
    // try {
      
    //   const res = await async_fetch_data(
    //     this.state.settings.currentApp.appId || "",
    //     this.state.settings.currentApp.apiKey || "",
    //     queries.graphQuery,
    //     queries.logQuery
    //   );

    //   this.setState({
    //     graphData: await res.graphPromise
    //   });

    //   d = await res.logPromise;
      
    //   message.success("Success!", 1.5);
    // } catch (error) {
    //   console.log(error, error instanceof BadRequestError);
    //   console.error("Failed", error);

    //   // do not warn on manual abort
    //   if (error instanceof BadRequestError) {
    //     var data = await error.response.json();
    //     console.log("bad data", data);
    //     const key = `open${Date.now()}`;
    //     const btn = (
    //       <Button
    //         type="primary"
    //         size="small"
    //         onClick={() => notification.close(key)}
    //       >
    //         Close
    //       </Button>
    //     );
    //     notification.error({
    //       key: key,
    //       btn: btn,
    //       duration: 20,
    //       message: "Error: " + data.error.message,
    //       description: (
    //         <div>
    //           <strong>{data.error.innererror.message}</strong>
    //           <p>{data.error.innererror.innererror.message}</p>
    //         </div>
    //       )
    //     });
    //   } else if (error.code !== 20) {
    //     message.error(
    //       "Failed to fetch data from AppInsights, check your settings"
    //     );
    //   }
    //   return;
    // } finally {
    //   hide();
    // }

    // worker.postMessage({ topic: "json", payload: d });
    // console.timeEnd();
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
        threshold={"25%"}
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
    worker.postMessage({
      topic: "loadmore",
      payload: {
        skip: size,
        take: pageSize
      }
    });
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
