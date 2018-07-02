import * as React from "react";

export class DetailsView extends React.Component<any, any> {
  public render() {
    const hasStack = this.props.details.details
      ? IsJsonString(this.props.details.details)
      : false;

    const stack: any[] = [];
    if (hasStack) {
      hasStack[0].parsedStack.forEach((v: any) => {
        
        // identify system methods
        if(v.method.toLowerCase().startsWith("system.")) {
          v.isSytemMethod = true;
        }

        stack.push(v);
      });
    }

    return (
      <div>
        <div>
          { hasStack ? 
          <ul className="callstack">
            <h2>Callstack</h2>
            <li>{this.props.details.problemId}</li>
            {stack.map(v => {
              return (
                <li key={v.level} className={v.isSytemMethod ? "isSystemMethod" : ""}>
                  <span>
                    {v.method} line:{v.line}
                  </span>
                </li>
              );
            })}
          </ul> : null }
        </div>
        <h2>Properties</h2>
        {getComponentsFromJson(this.props.details)}
      </div>
    );
  }
}

const INDENT = "    ";
function getComponentsFromJson(json: any) {
  let indent = "";
  const forEach = (list: any, start: any, end: any, fn: any) => {
    if (!list.length) {
      return start + " " + end;
    }

    const out = [start, "\n"];

    indent += INDENT;
    list.forEach((key: any, i: number) => {
      out.push(indent, fn(key), i < list.length - 1 ? "," : "", "\n");
    });
    indent = indent.slice(0, -INDENT.length);

    return [out, indent, end];
  };

  function type(doc: any) {
    if (doc === null) {
      return "null";
    }
    if (Array.isArray(doc)) {
      return "array";
    }
    if (typeof doc === "string" && /^https?:/.test(doc)) {
      return "link";
    }
    if (typeof doc === "object" && typeof doc.toISOString === "function") {
      return "date";
    }

    return typeof doc;
  }

  function visit(obj: any): any {
    if (obj === undefined) {
      return null;
    }

    switch (type(obj)) {
      case "boolean":
        return <span className="json-markup-bool">{obj}</span>;

      case "number":
        return <span className="json-markup-number">{obj}</span>;

      case "date":
        return <span className="json-markup-string">{obj.toISOString()}</span>;

      case "null":
        return <span className="json-markup-null">null</span>;

      case "string":
        const maybeJson = IsJsonString(obj);
        return (
          <span className="json-markup-string">
            {maybeJson ? visit(maybeJson) : obj.replace(/\n/g, "\n" + indent)}
          </span>
        );

      case "link":
        return (
          <span className="json-markup-string">
            <a href="' + escape(obj) + '">{escape(obj)}</a>
          </span>
        );

      case "array":
        return forEach(obj, "[", "]", visit);

      case "object":
        const keys = Object.keys(obj).filter(key => {
          return obj[key] !== undefined;
        });

        return forEach(keys, "{", "}", (key: any) => {
          return [
            <span className="json-markup-key" key={key}>
              {key}:
            </span>,
            visit(obj[key])
          ];
        });
    }

    return null;
  }

  return <div className="json-markup">{visit(json)}</div>;
}

const IsJsonString = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
};
