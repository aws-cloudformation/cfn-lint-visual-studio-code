import { readFileSync } from "fs"

const schema = JSON.parse(readFileSync('schema.json', 'utf8'))
const stub = readFileSync('schema/resource-patch-stub.json', 'utf8')
console.log(stub.replace(/RESOURCE_TYPE/g, schema['typeName']).replace(/"RESOURCE_SCHEMA"/g, JSON.stringify(schema)))
