const { sha3, BN } = require("web3-utils");
const abiCoder = require("web3-eth-abi");
// topic id erc20 and erc721
const transferSignature = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const state = {
  savedABIs: [],
  methodIDs: {},
  erc20IDs:{}
};

function _getABIs() {
  return state.savedABIs;
}

function _typeToString(input) {
  if (input.type === "tuple") {
    return "(" + input.components.map(_typeToString).join(",") + ")";
  }
  return input.type;
}

function _addABI(abiArray) {

  if (Array.isArray(abiArray)) {
    // Iterate new abi to generate method id"s
    abiArray.map(function(abi) {
      if (abi.name) {
        const signature = sha3(
          abi.name +
            "(" +
            abi.inputs
              .map(_typeToString)
              .join(",") +
            ")"
        );
        if (abi.type === "event") {
          // add erc20 event in separate array
          if ( state.methodIDs[signature.slice(2)] && signature.slice(2) === transferSignature)
            state.erc20IDs[[signature.slice(2)]] = abi;
          else
            state.methodIDs[signature.slice(2)] = abi;
        } else {
          state.methodIDs[signature.slice(2, 10)] = abi;
        }
      }
    });

    state.savedABIs = state.savedABIs.concat(abiArray);
  } else {
    throw new Error("Expected ABI array, got " + typeof abiArray);
  }
}

function _removeABI(abiArray) {
  if (Array.isArray(abiArray)) {
    // Iterate new abi to generate method id"s
    abiArray.map(function(abi) {
      if (abi.name) {
        const signature = sha3(
          abi.name +
            "(" +
            abi.inputs
              .map(function(input) {
                return input.type;
              })
              .join(",") +
            ")"
        );
        if (abi.type === "event") {
          if (state.methodIDs[signature.slice(2)]) {
            delete state.methodIDs[signature.slice(2)];
          }
        } else {
          if (state.methodIDs[signature.slice(2, 10)]) {
            delete state.methodIDs[signature.slice(2, 10)];
          }
        }
      }
    });
  } else {
    throw new Error("Expected ABI array, got " + typeof abiArray);
  }
}

function _getMethodIDs() {
  return state.methodIDs;
}

function _decodeMethod(data) {
  const methodID = data.slice(2, 10);
  const abiItem = state.methodIDs[methodID];
  if (abiItem) {
    let decoded = abiCoder.decodeParameters(abiItem.inputs, data.slice(10));

    let retData = {
      name: abiItem.name,
      params: [],
    };

    for (let i = 0; i < decoded.__length__; i++) {
      let param = decoded[i];
      let parsedParam = param;
      const isUint = abiItem.inputs[i].type.indexOf("uint") === 0;
      const isInt = abiItem.inputs[i].type.indexOf("int") === 0;
      const isAddress = abiItem.inputs[i].type.indexOf("address") === 0;

      if (isUint || isInt) {
        const isArray = Array.isArray(param);

        if (isArray) {
          parsedParam = param.map(val => new BN(val).toString());
        } else {
          parsedParam = new BN(param).toString();
        }
      }

      // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
      if (isAddress) {
        const isArray = Array.isArray(param);

        if (isArray) {
          parsedParam = param.map(_ => _.toLowerCase());
        } else {
          parsedParam = param.toLowerCase();
        }
      }

      retData.params.push({
        name: abiItem.inputs[i].name,
        value: parsedParam,
        type: abiItem.inputs[i].type,
      });
    }

    return retData;
  }
}

function _decodeLogs(logs) {
  const logsToProcess = logs.filter(log => log.topics.length > 0);
  const resultSet = [];
  for (let index = 0; index < logsToProcess.length; index++) {
    let method;
    const log = logsToProcess[index];
    const methodID = log.topics[0].slice(2);
    // methodid mathches with erc20 transfer event and topic count length is 3
    // it means its erc20 transaction
    if (methodID === transferSignature && log.topics.length===1){
      continue
    }
    else if (methodID === transferSignature && log.topics.length===3){
      method = state.erc20IDs[methodID];
      // if the dev have not supplied the erc721 abi, we will fetch erc20 method event info from methods
      if (!method){
      method = state.methodIDs[methodID];
    }
    }

    else
      method = state.methodIDs[methodID];
    let decodedParams = [];
    if (method) {
      const logData = log.data;
      let dataIndex = 0;
      let topicsIndex = 1;

      let dataTypes = [];
      method.inputs.map(function(input) {
        if (!input.indexed) {
          dataTypes.push(input.type);
        }
      });
      const decodedData = abiCoder.decodeParameters(
        dataTypes,
        logData.slice(2)
      );
      
      // Loop topic and data to get the params
      method.inputs.map(function(param) {
        let decodedP = {
          name: param.name,
          type: param.type,
        };
      
        if (param.indexed) {
          decodedP.value = log.topics[topicsIndex];
          topicsIndex++;
        } else {
          decodedP.value = decodedData[dataIndex];
          dataIndex++;
        }
      
        if (param.type === "address") {
          decodedP.value = decodedP.value.toLowerCase();
          // 42 because len(0x) + 40
          if (decodedP.value.length > 42) {
            let toRemove = decodedP.value.length - 42;
            let temp = decodedP.value.split("");
            temp.splice(2, toRemove);
            decodedP.value = temp.join("");
          }
        }
      
        if (
          param.type === "uint256" ||
                param.type === "uint8" ||
                param.type === "int"
        ) {
          // ensure to remove leading 0x for hex numbers
          if (typeof decodedP.value === "string" && decodedP.value.startsWith("0x")) {
            decodedP.value = new BN(decodedP.value.slice(2), 16).toString(10);
          } else {
            decodedP.value = new BN(decodedP.value).toString(10);
          }
      
        }
      
        decodedParams.push(decodedP);
      });
      resultSet.push({
        name: method.name,
        events: decodedParams,
        address: log.address,
      });
    }
  }
  return resultSet;
}

module.exports = {
  getABIs: _getABIs,
  addABI: _addABI,
  getMethodIDs: _getMethodIDs,
  decodeMethod: _decodeMethod,
  decodeLogs: _decodeLogs,
  removeABI: _removeABI,
};
