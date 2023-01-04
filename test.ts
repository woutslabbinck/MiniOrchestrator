import { getLogger } from 'log4js';
import { Parser, Store } from 'n3';
import { reason } from './src/Orchestrator/Reason';
import { executePolicies } from './src/policy/Executor';
import { loadConfig, parseAsN3Store, storeAddPredicate } from './src/util';
const POL_ORIGIN = 'https://www.example.org/ns/policy#origin';
const POL_MAIN_SUBJECT = 'https://www.example.org/ns/policy#mainSubject';
const dataPath = './in/demo.ttl'

async function run(): Promise<void> {
  const store = await parseAsN3Store(dataPath);
  const rulePaths = ['./rules/00_demo.n3']
  const orchestratorConfig = loadConfig('./orchestrator.json')
  const mainSubject = 'urn:uuid:42D2F3DC-0770-4F47-BF37-4F01E0382E32'
  const logger = getLogger();

  // Inject a top graph indicator in the KG
  storeAddPredicate(store, POL_MAIN_SUBJECT, mainSubject);

  // Inject the file origin in the KG
  storeAddPredicate(store, POL_ORIGIN, dataPath);


  const reasoningResult = await reason(store, orchestratorConfig, rulePaths, logger)

  console.log("Run reasoning");

  console.log(reasoningResult);

  console.log("Run policy");
  const policyConfig = loadConfig('./plugin.json')
  const reasoningStore = await stringToN3Store(reasoningResult)

  await executePolicies(policyConfig, reasoningStore, logger)

  const policy = {
    "node": {
      "termType": "NamedNode",
      "value": "http://example.org/MyDemoPolicy"
    },
    "path": "out/demo.ttl",
    "policy": "bc_0_b1_b0_sk_0",
    "target": "http://example.org/demoPlugin",
    "args": {
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": {
        "termType": "NamedNode",
        "value": "https://w3id.org/function/ontology#Execution"
      },
      "https://w3id.org/function/ontology#executes": {
        "termType": "NamedNode",
        "value": "http://example.org/demoPlugin"
      },
      "http://example.org/param1": {
        "termType": "Literal",
        "value": "my@myself.and.i",
        "language": "",
        "datatype": {
          "termType": "NamedNode",
          "value": "http://www.w3.org/2001/XMLSchema#string"
        }
      },
      "http://example.org/param2": {
        "termType": "Literal",
        "value": "you@yourself.edu",
        "language": "",
        "datatype": {
          "termType": "NamedNode",
          "value": "http://www.w3.org/2001/XMLSchema#string"
        }
      },
      "http://example.org/body": {
        "termType": "NamedNode",
        "value": "urn:uuid:42D2F3DC-0770-4F47-BF37-4F01E0382E32"
      }
    },
    "mainSubject": "urn:uuid:42D2F3DC-0770-4F47-BF37-4F01E0382E32",
    "origin": "file:///tmp/in/demo.ttl",
    "config": {}
  }
  policy
}

run()

function stringToN3Store(n3Data: string): Promise<Store> {
  const parser = new Parser();
  const store = new Store();

  return new Promise<Store>((resolve, reject) => {
    parser.parse(n3Data, (error, quad, _) => {
      if (error) {
        reject(error);
      }
      else if (quad) {
        store.addQuad(quad);
      }
      else {
        resolve(store);
      }
    });
  });
}