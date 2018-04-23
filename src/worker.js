/* tslint:disable */
import transit from 'transit-immutable-js';
import { List, Map, fromJS, Record } from "immutable";

const RowRecord = Record({
    itemId: null,
    timestamp: null,
    severityLevel: null,
    itemType: null,
    message: null,
    fields: Map()

}, "Row");

let parsedRows = List();
let allUnparsedRows = List();
let unparsedTable = null;

onmessage = function (ev) {
    if (ev.data.topic === "json") {
        parse(ev);
    } else if (ev.data.topic === "loadmore") {
        console.log("worker: should load more");
        const skip = ev.data.payload.skip;
        const take = ev.data.payload.take;
        sendBatch(skip, take, false)
    }
}

let hasSent = false;
function sendFirstBatch() {
    console.warn("worker: Sending first batch...")
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
    const json = transit.toJSON(rows);
    postMessage({ topic: isNew ? "new" : "con", payload: json });

    console.log("worker: Prepare next batch.", "currently parsed:", parsedRows.count())
    parseParts(skip + take, take, false);
}

function parse(ev) {
    hasSent = false;
    parsedRows = List();
    allUnparsedRows = List();
    unparsedTable = null;
    // js-lint
    const table = fromJS(ev.data.payload.tables[0]);
    unparsedTable = table;
    const unparsedRows = table.get('rows');
    allUnparsedRows = unparsedRows;
    const stepSize = 50;

    parseParts(0, stepSize, true);   
}

function parseParts(skip, take, send) {
    console.time("workerparseParts");
    console.log("worker: parseParts started", "skip:", skip, "take:", take, "send: ",  send);
    const table = unparsedTable;
    if (!table) return;
    const columns = table.get("columns");
    const unparsedRows = table.get('rows');
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
    console.log("worker: Parsed pars done.", "new rows parsed: ", rows.count(), "total parsed", parsedRows.count());
    if(send) {
        sendFirstBatch();
    }
    console.timeEnd("workerparseParts")
}