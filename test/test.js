const expect = require('chai').expect;
let abiDecoder = null;

// Test Params
const testABI = [{"inputs": [{"type": "address", "name": ""}], "constant": true, "name": "isInstantiation", "payable": false, "outputs": [{"type": "bool", "name": ""}], "type": "function"}, {"inputs": [{"type": "address[]", "name": "_owners"}, {"type": "uint256", "name": "_required"}, {"type": "uint256", "name": "_dailyLimit"}], "constant": false, "name": "create", "payable": false, "outputs": [{"type": "address", "name": "wallet"}], "type": "function"}, {"inputs": [{"type": "address", "name": ""}, {"type": "uint256", "name": ""}], "constant": true, "name": "instantiations", "payable": false, "outputs": [{"type": "address", "name": ""}], "type": "function"}, {"inputs": [{"type": "address", "name": "creator"}], "constant": true, "name": "getInstantiationCount", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [{"indexed": false, "type": "address", "name": "sender"}, {"indexed": false, "type": "address", "name": "instantiation"}], "type": "event", "name": "ContractInstantiation", "anonymous": false}];

beforeEach(() => {
  abiDecoder = require('../index.js');
});

describe('abi decoder', function () {
  it('get abis', () => {
    const abis = abiDecoder.getABIs();
    expect(abis).to.be.an('array');
    expect(abis).to.have.length.of(0);
  });

  it('add abis', () => {
    abiDecoder.addABI(testABI);
    const abis = abiDecoder.getABIs();
    expect(abis).to.be.an('array');
    expect(abis).to.have.length.of(5);
    const methodIDs = abiDecoder.getMethodIDs();
    expect(methodIDs).to.be.an('object');
    expect(Object.keys(methodIDs)).to.have.length.of(5);
  });

  it('decode data', () => {
    abiDecoder.addABI(testABI);
    const testData = "0x53d9d9100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114de5000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114daa";
    const decodedData = abiDecoder.decodeMethod(testData);
    expect(decodedData).to.be.an('object');
    expect(decodedData).to.have.all.keys('name', 'params');
    expect(decodedData.name).to.be.a('string');
    expect(decodedData.params).to.be.a('array');
    expect(decodedData.params).to.have.length.of(3);
    expect(decodedData.params[0].value).to.deep.equal(['0xa6d9c5f7d4de3cef51ad3b7235d79ccc95114de5', '0xa6d9c5f7d4de3cef51ad3b7235d79ccc95114daa']);
    expect(decodedData.params[0].name).to.equal('_owners');
    expect(decodedData.params[1].value).to.equal('1');
    expect(decodedData.params[1].name).to.equal('_required');
    expect(decodedData.params[2].value).to.equal('0');
    expect(decodedData.params[2].name).to.equal('_dailyLimit');
  });
});
