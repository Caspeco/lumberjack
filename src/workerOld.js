/* tslint:disable */
import transit from "transit-immutable-js";
import { List, Map, fromJS, Record } from "immutable";
// import EventWorker from "event-worker";

const RowRecord = Record(
    {
        itemId: null,
        timestamp: null,
        severityLevel: null,
        itemType: null,
        message: null,
        fields: Map()
    },
    "Row"
);

let parsedRows = List();
let allUnparsedRows = List();
let unparsedTable = null;

const DEFAULT_PRELOAD = 200;

let skip_current = 0;
let take_current = 50;

// onmessage = function(ev) {
//     if (ev.data.topic === "json") {
//         parse(ev);
//     } else if (ev.data.topic === "loadmore") {
//         console.log("worker: should load more");
//         const skip = ev.data.payload.skip;
//         const take = ev.data.payload.take;
//         sendBatch(skip, take, false);
//     }
//     else {
//       console.error("UNKOWN EV", ev);
//     }
// };

// const worker1 = new EventWorker();
// worker1.on("fetchData", ({payload}) => {
//   console.log("RECEIVED QUERIES", payload);
//   console.log("twroing...")
  
//   console.log("throw");
//   return "OK";
//   //return Promise.resolve();
  
// });

let hasSent = false;
function sendFirstBatch() {
    console.warn("worker: Sending first batch...");
    sendBatch(0, 50, true);
    hasSent = true;
}

function sendBatch(skip, take, isNew) {
    const rows = parsedRows.skip(skip).take(take);
    console.log("worker: Sending batch", skip, take, " resulted in ", rows.count(), " (in total ", parsedRows.count(), ")");
    // if(rows.count() === 0 && !isNew) {
    //     console.log("worker: aborted 'con' sendBatch because we are empty");
    //     return;
    // }

    // should flag if we send rows.count() == while waiting for new fetch

    const json = transit.toJSON(rows);
    postMessage({ topic: isNew ? "new" : "con", payload: json });
    const table = unparsedTable;
    console.log("should fetch? ", table.get("rows").count(),(skip + take + DEFAULT_PRELOAD))
    if (table.get("rows").count() < (skip + take + DEFAULT_PRELOAD)) {
        console.log("worker: Ask client for more data.", "currently parsed:", parsedRows.count(), "out of", allUnparsedRows.count());
        postMessage({
            topic: "fetch",
            payload: {
                skip: allUnparsedRows.count()
            }
        });
    }
    console.log("worker: Prepare next batch.", "currently parsed:", parsedRows.count());
    skip_current += take;
    parseParts(skip_current, take, false);
}

function parsePaged(ev) {
    // hasSent = false;
    // parsedRows = List();
    // allUnparsedRows = List();
    // unparsedTable = null;
    // js-lint
    const table = fromJS(ev.data.payload.tables[0]);
    // unparsedTable = table;

    // add new rows to existing table
    const unparsedRows = table.get("rows");
    unparsedTable = unparseTable.updateIn(["rows"], arr => arr.push(unparsedRows));

    allUnparsedRows.push(unparsedRows);

    parseParts(skip_current, take_current, true);
}

function resetState() {
    skip_current = 0;
    take_current = 50;
    hasSent = false;
    parsedRows = List();
    allUnparsedRows = List();
    unparsedTable = null;
}

function parse(ev) {
    resetState();
    console.warn("PARSING");
    // js-lint
    const table = fromJS(ev.data.payload.tables[0]);
    unparsedTable = table;
    const unparsedRows = table.get("rows");
    allUnparsedRows = unparsedRows;

    parseParts(skip_current, take_current, true);
}

function parseParts(skip, take, send) {
    console.time("workerparseParts");
    console.log("worker: parseParts started", "skip:", skip, "take:", take, "send: ", send);
    const table = unparsedTable;
    console.warn("table",table)
    if (!table) return;
    const columns = table.get("columns");
    const unparsedRows = table.get("rows");
    // const stepSize = 50;

    let rows = unparsedRows.skip(skip).take(take);
    // console.log(count, allRows.count());
    rows = rows.map((row, index) => {
        const fields = row.toOrderedMap().mapEntries((entry, index2) => {
            // console.log("entrye", entry,index2);
            return [columns.getIn([index2, "name"]), entry[1]];
        });
        // const r =  new RowRecord({
        //     itemId: fields.get("itemId"),
        //     timestamp: fields.get("timestamp"),
        //     severityLevel: fields.get("severityLevel"),
        //     itemType: fields.get("itemType"),
        //     message: fields.get("message"),
        //     fields
        // });
        return fields;
    });

    // console.log(rows);

    parsedRows = parsedRows.concat(rows).toList();
    console.log("worker: Parsed  done.", "new rows parsed: ", rows.count(), "total parsed", parsedRows.count());
    if (send) {
        sendFirstBatch();
    }
    console.timeEnd("workerparseParts");
}
