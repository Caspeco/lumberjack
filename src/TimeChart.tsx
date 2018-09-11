import {
  Charts,
  ChartContainer,
  ChartRow,
  YAxis,
  BarChart,
  Resizable,
  AreaChart  
} from "react-timeseries-charts";
import { TimeSeries, Index, TimeRange } from "pondjs";
import * as moment from "moment";
import * as React from "react";

export class TimeChart extends React.Component<any, any> {

  public render() {
    if (!this.props.data) { return null; }

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

    if (graphData.points.length === 0) { return null; }

    const timeseries3 = new TimeSeries(graphData);
    const maxTraces = timeseries3.max("trace");
    const maxErrorWarnings = Math.max(
      timeseries3.max("warning"),
      timeseries3.max("error"));

    const areaStyle = {
      trace: {
        line: {
          normal: { stroke: "#666", fill: "none", strokeWidth: 1 },
          highlighted: { stroke: "#5a98cb", fill: "none", strokeWidth: 1 },
          selected: { stroke: "steelblue", fill: "none", strokeWidth: 1 },
          muted: { stroke: "steelblue", fill: "none", opacity: 0.4, strokeWidth: 1 }
        },
        area: {
          normal: { fill: "#eee", stroke: "none", opacity: 0.75 },
          highlighted: { fill: "#5a98cb", stroke: "none", opacity: 0.75 },
          selected: { fill: "steelblue", stroke: "none", opacity: 0.75 },
          muted: { fill: "steelblue", stroke: "none", opacity: 0.25 }
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

    const timeRange = new TimeRange(this.props.startTime, this.props.endTime);
    return (
      <div className="graph">
        <div style={{}}>
          <Resizable>
            <ChartContainer
              timeRange={timeRange}
              enableDragZoom={true}              
              onTimeRangeChanged={this.handleTimeRangeChange}
              trackerPosition={this.props.trackerPosition}
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
                  format="~s"
                />
                <Charts>
                  <AreaChart
                    axis="axis1"
                    series={timeseries3}
                    columns={{ up: ["trace"] }}
                    style={areaStyle}
                  />
                  <BarChart
                    axis="axis2"
                    series={timeseries3}
                    columns={["warning", "error"]}
                    size={3}
                    style={barStyle}
                    onSelectionChange={this.selectChange}
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
                  format="~s"
                />
              </ChartRow>
            </ChartContainer>
          </Resizable>
        </div>
      </div>
    );
  }

  private selectChange = (d:any, e:any) => {
    this.handleTimeRangeChange(d.event.timerange());
  }

  private handleTimeRangeChange = (d: any) => {
    console.log("handle time chamnge", d, moment(d.begin()), moment(d.end()));
    if (this.props.onTimeRangeChange) {
      this.props.onTimeRangeChange(moment(d.begin()), moment(d.end()));
    }
  };
}