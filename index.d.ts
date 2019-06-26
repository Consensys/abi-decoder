// Must import underyling ethereum types at top-level for
// typechecking to pass all the way through.
import { AbiDefinition, MethodAbi, LogEntry, SolidityTypes } from 'ethereum-types'

// This object becomes the default import.
import AbiDecoder from './index';
export = AbiDecoder as Types.AbiDecoder;

// This namespace lets users access the underlying types via
//
// import AbiDecoder, { Types as DecoderTypes } from 'abi-decoder';
// ...
// interface AllDecoded = {
//   decodedLogs : DecoderTypes.DecodedLog[] 
// }
export namespace Types {

  export type LogEntry = LogEntry;

  export type AbiArray = AbiDefinition[]

  export type DecodedParam = {
    name : string
    value : string
    type : SolidityTypes
  }

  export type DecodedMethodInput = {
    name : string
    params : DecodedParam[]
  }

  export type DecodedLog = {
    name : string
    address : string
    events : DecodedParam[]
  }

  export type MethodIds = {
    [hexMethodName:string] : AbiDefinition
  }

  export type AbiDecoder = {
    getABIs : () => Types.AbiArray[],
    addABI : (abi:Types.AbiArray) => void
    getMethodIDs: () => Types.MethodIds
    decodeMethod: (input:string) => Types.DecodedMethodInput | void
    decodeLogs: (logs:Types.LogEntry[]) => Types.DecodedLog[]
    removeABI: (abi:Types.AbiArray) => void
  }
}