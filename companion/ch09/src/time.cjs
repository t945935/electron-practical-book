// Validate a calendar value by round-trip in UTC, never in the host timezone.
function observedTime(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return false;
 const date=new Date(value+':00.000Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,16)===value;
}
function fetchedTime(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))return false;
 const date=new Date(value);return Number.isFinite(date.getTime())&&date.toISOString()===value;
}
module.exports={observedTime,fetchedTime};
