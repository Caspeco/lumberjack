import * as React from "react";
import { translateSeverityLevel } from "./utils";
import * as reactreplace from "react-string-replace";
import * as moment from "moment";

import { Icon, Tooltip } from "antd";

export interface ILogRow {
  setGrep: (str: string) => void;
  showDetails: (row: ILogRow) => void;
}

export interface IConsoleRowProps {
  row: any;
  setGrep: (values: {}) => void;
  showDetails: (row: ILogRow) => void;
  onHover: (row: any) => void;
}

const COLOR_MAP = {};

export class ConsoleRow extends React.Component<IConsoleRowProps, any> {
  
  private static getColor(instanceName: string) {
    if (!instanceName) {
      return "";
    }
    const existingColor = COLOR_MAP[instanceName];
    if (existingColor) {
      return existingColor;
    }

    const newColor = ConsoleRow.stringToColour(
      instanceName
        .split("")
        .reverse()
        .join("")
    );
    COLOR_MAP[instanceName] = newColor;
    return newColor;
  }

  private static stringToColour(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      // tslint:disable-next-line:no-bitwise
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = "#";
    for (let i = 0; i < 3; i++) {
      // tslint:disable-next-line:no-bitwise
      const value = (hash >> (i * 8)) & 0xff;
      colour += ("00" + value.toString(16)).substr(-2);
    }
    return colour;
  }

  constructor(props: any) {
    super(props);
    this.state = {
      expanded: false
    }
  }

  public shouldComponentUpdate(nextProps: any, nextState: any) {
    if (!nextProps.row.equals(this.props.row) || this.state.expanded !== nextState.expanded) {
      return true;
    } 
    return false;
  }

  public render() {
    const row: any = this.props.row;
    const severityLevel = translateSeverityLevel(row.get("severityLevel"));

    const regexp = /\B(#[a-zA-Z0-9-]+\b|#"[a-zA-Z0-9-_ ]+["|\b])(?!;)/gu;

    const msg = reactreplace(
      row.get("message"),
      regexp,
      (match: string, i: number) => {
        const grep = () => {
          const quotesToUse = match.indexOf('"') > -1 ? "'" : '"';
          const qoutedMatch = quotesToUse + match + quotesToUse;
          this.props.setGrep({ grep: qoutedMatch });
        };
        return (
          <span className="hashtag" key={i} onClick={grep}>
            {match}
          </span>
        );
      }
    );

    
    const r: any = row;
    const opId = r.get("operation_Id");
    const style = {
      color: ConsoleRow.getColor(r.get("cloud_RoleInstance"))
    };
    console.log("expanded", this.state.expanded);
    const expanded = this.state.expanded;

    return (
      <>
      <div className="consoleRow" key={r.get("itemId")} onClick={this.handleClick} onMouseOver={this.onHover} onMouseOut={this.onHover}>
        <a id={r.get("itemId")} className="anchor" />
        <Tooltip placement="topLeft" title={r.get("cloud_RoleInstance")}>
          <div
            className="roleInstance link"
            onClick={this.setRoleInstance}
            style={style}
          >
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
        <Icon className="details" type="select" onClick={this.showDetails} />
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
   {expanded ? <ExpandedRow {...this.props} /> : null}
      </>
);
  }

  private onHover = (e: any) => {
    if(e.type === "mouseout") {
      this.props.onHover(null);
    } else {
      this.props.onHover(this.props.row);
    }    
  }

  private handleClick = (e: React.MouseEvent<HTMLDivElement>): any => {
    if(e.ctrlKey) {
      this.showDetails();
    }    
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
    this.setState({
      expanded: true
    });
    // this.props.showDetails(this.props.row);
  };
}

class ExpandedRow extends React.Component<any, any> {
  public render() {
    console.log("row", this.props.row.toJS())
    return (<div className="consoleRow-expanded">
      {this.props.row.filter((value:any, key:any) => !(value === null || value === undefined || value === ""))
      // .sortBy((value:any, key:any) => value.toString().length)
      .map((value:any, rkey:any) => {
        return (
        <div className="row-prop" key={"exp-row" + rkey}>
          <div className="row-prop-key">{rkey}</div>
          <div className="row-prop-value">{value}</div>
        </div>
      );}).toList()}
    </div>);
  }
}