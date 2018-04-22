/* tslint:disable */
import transit from 'transit-immutable-js';
import { List, Map, fromJS, Record} from "immutable";

const RowRecord = Record({
    itemId: null,
    timestamp: null,
    severityLevel: null,
    itemType: null,
    message: null,
    fields: Map()

}, "Row");

onmessage = function (ev) {
    // js-lint
    const table = fromJS(ev.data.tables[0]);
    const columns = table.get("columns");

    const arr = [];
    
    const allRows = table.get('rows');
    let count = 0;
    while(count < allRows.count() -1) {
        let rows = allRows.skip(count).take(10);
        // console.log(count, allRows.count());
        count += 10;
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
        
        const json = transit.toJSON(rows);
        postMessage(json);
    }
    
    
}
