import { readdirSync, readFileSync } from "fs"
import { applyPatch } from 'fast-json-patch'

const stub = readFileSync('schema/resource-patch-stub.json', 'utf8')
let templateSchema = JSON.parse(readFileSync('schema/all-spec.json', 'utf8'))
for (const schemaFile of readdirSync('schema/schemas/')) {
    const registrySchema = readFileSync('schema/schemas/' + schemaFile, 'utf8')
    const patch = JSON.parse(stub.replace(/RESOURCE_TYPE/g, JSON.parse(registrySchema)['typeName']).replace(/"RESOURCE_SCHEMA"/g, registrySchema))
    templateSchema = applyPatch(templateSchema, patch).newDocument
}
console.log(JSON.stringify(templateSchema))
