const Web3 = require('web3');
const { utils, eth } = new Web3();
const { sha3, toBN } = utils;

const onTrue = f => !!f

function padZeros (address) {
  let formatted = address;
  if (address.indexOf('0x') != -1) formatted = address.slice(2);
  if (formatted.length < 40) while (formatted.length < 40) formatted = "0" + formatted;
  return "0x" + formatted;
};

class AbiDecoder {
  constructor() {
    this.savedABIs = [];
    this.methodIDs = {};
  }
  getABIs() { return this.savedABIs; }
  getMethodIDs() { return this.methodIDs; }
  addABI(abiArray) {
    if (abiArray && Array.isArray(abiArray)) {
      abiArray.map((abi) => {
        if (abi.name) {
          const signature = sha3(abi.name + "(" + abi.inputs.map(function(input) { return input.type; }).join(",") + ")");
          if (abi.type == "event") this.methodIDs[signature.slice(2)] = abi;
          else this.methodIDs[signature.slice(2, 10)] = abi;
        }
      });
      this.savedABIs = this.savedABIs.concat(abiArray);
    }
    else {
      throw new Error("Expected ABI array, got " + typeof abiArray);
    }
    return this;
  }
  removeABI(abiArray) {
    if (abiArray && Array.isArray(abiArray)) {
      abiArray.map((abi) => {
        if (abi.name){
          const signature = sha3(abi.name + "(" + abi.inputs.map(function(input) {return input.type;}).join(",") + ")");
          if (abi.type == "event" && this.methodIDs[signature.slice(2)]) delete this.methodIDs[signature.slice(2)];
          else if (this.methodIDs[signature.slice(2, 10)]) delete this.methodIDs[signature.slice(2, 10)];
        }
      });
    } else {
      throw new Error("Expected ABI array, got " + typeof abiArray);
    }
  }
  decodeMethod(data) {
    const methodID = data.slice(2, 10);
    const abiItem = this.methodIDs[methodID];
    if (abiItem) {
      const params = abiItem.inputs.map(function (item) { return item.type; });
      let decoded = eth.abi.decodeParameters(params, data.slice(10));
      return {
        name: abiItem.name,
        params: abiItem.inputs.map(function (input, index) {
          let parsedParam = decoded[parseInt(index)];
          const isUint = input.type.indexOf("uint") == 0;
          const isInt = input.type.indexOf("int") == 0;
  
          if (isUint || isInt) {
            const isArray = Array.isArray(parsedParam);
            parsedParam = isArray ?
              parsedParam.map(val => toBN(val).toString().toLowerCase()) :
              toBN(parsedParam).toString();
          }
          return {
            name: abiItem.inputs[index].name,
            value: parsedParam,
            type: abiItem.inputs[index].type
          };
        })
      }
    }
  }
  decodeLogs(logs) {
    return logs.map(({topics, data, address, blockNumber, transactionHash}) => {
      const methodID = topics[0].slice(2);
      const method = this.methodIDs[methodID];
      if (!method) return;
      
      const dataTypes = method.inputs.map(function (input) {
        return !input.indexed ? input.type : false;
      }).filter(onTrue);
      const decodedData = eth.abi.decodeParameters(dataTypes, data.slice(2));

      let dataIndex = 0;
      let topicsIndex = 1;
      const events = method.inputs.map(function (param) {
        const event = {
          name: param.name,
          type: param.type
        };

        if (param.indexed) {
          event.value = topics[topicsIndex];
          topicsIndex++;
        } else {
          event.value = decodedData[dataIndex];
          dataIndex++;
        }

        if (param.type == "address") {
          event.value = padZeros(toBN(event.value).toString(16));
        } else if (param.type == "uint256" || param.type == "uint8" || param.type == "int" ) {
          event.value = toBN(event.value).toString(10);
        }

        return event;
      });
      // console.log(JSON.stringify({ name: method.name, events, address, blockNumber, transactionHash },null,2));
      return { name: method.name, events, address, blockNumber, transactionHash };
    });    
  }
}

module.exports = () => { return new AbiDecoder(); }
