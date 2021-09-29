import { readFileSync } from "fs"
import { applyPatch } from 'fast-json-patch'

const registrySchema = readFileSync('schema.json', 'utf8')
const stub = readFileSync('schema/resource-patch-stub.json', 'utf8')
const patch = JSON.parse(stub.replace(/RESOURCE_TYPE/g, JSON.parse(registrySchema)['typeName']).replace(/"RESOURCE_SCHEMA"/g, registrySchema))
let templateSchema = JSON.parse(readFileSync('schema/all-spec.json', 'utf8'))
console.log(JSON.stringify(applyPatch(templateSchema, patch).newDocument))