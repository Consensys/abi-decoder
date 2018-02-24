const expect = require('chai').expect;
const abiDecoder = require('../index.js');

// Test Params
const testABI = [{"inputs": [{"type": "address", "name": ""}], "constant": true, "name": "isInstantiation", "payable": false, "outputs": [{"type": "bool", "name": ""}], "type": "function"}, {"inputs": [{"type": "address[]", "name": "_owners"}, {"type": "uint256", "name": "_required"}, {"type": "uint256", "name": "_dailyLimit"}], "constant": false, "name": "create", "payable": false, "outputs": [{"type": "address", "name": "wallet"}], "type": "function"}, {"inputs": [{"type": "address", "name": ""}, {"type": "uint256", "name": ""}], "constant": true, "name": "instantiations", "payable": false, "outputs": [{"type": "address", "name": ""}], "type": "function"}, {"inputs": [{"type": "address", "name": "creator"}], "constant": true, "name": "getInstantiationCount", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [{"indexed": false, "type": "address", "name": "sender"}, {"indexed": false, "type": "address", "name": "instantiation"}], "type": "event", "name": "ContractInstantiation", "anonymous": false}];
const testArrNumbersABI = [{"constant":false,"inputs":[{"name":"n","type":"uint256[]"}],"name":"numbers","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"}];

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
    expect(decodedData.params[0].type).to.equal('address[]');
    expect(decodedData.params[1].value).to.equal('1');
    expect(decodedData.params[1].name).to.equal('_required');
    expect(decodedData.params[1].type).to.equal('uint256');
    expect(decodedData.params[2].value).to.equal('0');
    expect(decodedData.params[2].name).to.equal('_dailyLimit');
    expect(decodedData.params[2].type).to.equal('uint256');
  });

  it('decode data with arrays', () => {
    abiDecoder.addABI(testArrNumbersABI);
    const testData = "0x3727308100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003";
    const decodedData = abiDecoder.decodeMethod(testData);  
    expect(decodedData).to.be.an('object');
    expect(decodedData).to.have.all.keys('name', 'params');
    expect(decodedData.name).to.be.a('string');
    expect(decodedData.params).to.be.a('array');
    expect(decodedData.params).to.have.length.of(1);
    expect(decodedData.params[0].value[0]).to.equal('1');
    expect(decodedData.params[0].value[1]).to.equal('2');
    expect(decodedData.params[0].value[2]).to.equal('3');
    expect(decodedData.params[0].name).to.equal('n');
    expect(decodedData.params[0].type).to.equal('uint256[]');
  });

  it('decode logs without indexed', () => {
    const testLogs = [
      {
        data: "0x00000000000000000000000065039084cc6f4773291a6ed7dcf5bc3a2e894ff3000000000000000000000000435a4167bc34107bd03e267f9d6b869255151a27",
        topics: ["0x4fb057ad4a26ed17a57957fa69c306f11987596069b89521c511fc9a894e6161"],
        address: "0x0457874Bb0a346962128a0C01310d00Fc5bb6a83"
      }
    ];

    const decodedLogs = abiDecoder.decodeLogs(testLogs);
    expect(decodedLogs).to.be.an('array');
    expect(decodedLogs).to.have.length(1);
    expect(decodedLogs[0].name).to.equal('ContractInstantiation');
    expect(decodedLogs[0].events).to.have.length(2);
    expect(decodedLogs[0].address).to.equal('0x0457874Bb0a346962128a0C01310d00Fc5bb6a83');
    expect(decodedLogs[0].events[0].name).to.equal('sender');
    expect(decodedLogs[0].events[0].value).to.equal('0x65039084cc6f4773291a6ed7dcf5bc3a2e894ff3');
    expect(decodedLogs[0].events[0].type).to.equal('address');
    expect(decodedLogs[0].events[1].name).to.equal('instantiation');
    expect(decodedLogs[0].events[1].value).to.equal('0x435a4167bc34107bd03e267f9d6b869255151a27');
    expect(decodedLogs[0].events[1].type).to.equal('address');
  });

  it('decode logs with indexed param', () => {
    const walletABI = [{"inputs": [{"type": "uint256", "name": ""}], "constant": true, "name": "owners", "payable": false, "outputs": [{"type": "address", "name": ""}], "type": "function"}, {"inputs": [{"type": "address", "name": "owner"}], "constant": false, "name": "removeOwner", "payable": false, "outputs": [], "type": "function"}, {"inputs": [{"type": "uint256", "name": "transactionId"}], "constant": false, "name": "revokeConfirmation", "payable": false, "outputs": [], "type": "function"}, {"inputs": [{"type": "address", "name": ""}], "constant": true, "name": "isOwner", "payable": false, "outputs": [{"type": "bool", "name": ""}], "type": "function"}, {"inputs": [{"type": "uint256", "name": ""}, {"type": "address", "name": ""}], "constant": true, "name": "confirmations", "payable": false, "outputs": [{"type": "bool", "name": ""}], "type": "function"}, {"inputs": [], "constant": true, "name": "calcMaxWithdraw", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [{"type": "bool", "name": "pending"}, {"type": "bool", "name": "executed"}], "constant": true, "name": "getTransactionCount", "payable": false, "outputs": [{"type": "uint256", "name": "count"}], "type": "function"}, {"inputs": [], "constant": true, "name": "dailyLimit", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [], "constant": true, "name": "lastDay", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [{"type": "address", "name": "owner"}], "constant": false, "name": "addOwner", "payable": false, "outputs": [], "type": "function"}, {"inputs": [{"type": "uint256", "name": "transactionId"}], "constant": true, "name": "isConfirmed", "payable": false, "outputs": [{"type": "bool", "name": ""}], "type": "function"}, {"inputs": [{"type": "uint256", "name": "transactionId"}], "constant": true, "name": "getConfirmationCount", "payable": false, "outputs": [{"type": "uint256", "name": "count"}], "type": "function"}, {"inputs": [{"type": "uint256", "name": ""}], "constant": true, "name": "transactions", "payable": false, "outputs": [{"type": "address", "name": "destination"}, {"type": "uint256", "name": "value"}, {"type": "bytes", "name": "data"}, {"type": "bool", "name": "executed"}], "type": "function"}, {"inputs": [], "constant": true, "name": "getOwners", "payable": false, "outputs": [{"type": "address[]", "name": ""}], "type": "function"}, {"inputs": [{"type": "uint256", "name": "from"}, {"type": "uint256", "name": "to"}, {"type": "bool", "name": "pending"}, {"type": "bool", "name": "executed"}], "constant": true, "name": "getTransactionIds", "payable": false, "outputs": [{"type": "uint256[]", "name": "_transactionIds"}], "type": "function"}, {"inputs": [{"type": "uint256", "name": "transactionId"}], "constant": true, "name": "getConfirmations", "payable": false, "outputs": [{"type": "address[]", "name": "_confirmations"}], "type": "function"}, {"inputs": [], "constant": true, "name": "transactionCount", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [{"type": "uint256", "name": "_required"}], "constant": false, "name": "changeRequirement", "payable": false, "outputs": [], "type": "function"}, {"inputs": [{"type": "uint256", "name": "transactionId"}], "constant": false, "name": "confirmTransaction", "payable": false, "outputs": [], "type": "function"}, {"inputs": [{"type": "address", "name": "destination"}, {"type": "uint256", "name": "value"}, {"type": "bytes", "name": "data"}], "constant": false, "name": "submitTransaction", "payable": false, "outputs": [{"type": "uint256", "name": "transactionId"}], "type": "function"}, {"inputs": [{"type": "uint256", "name": "_dailyLimit"}], "constant": false, "name": "changeDailyLimit", "payable": false, "outputs": [], "type": "function"}, {"inputs": [], "constant": true, "name": "MAX_OWNER_COUNT", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [], "constant": true, "name": "required", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [{"type": "address", "name": "owner"}, {"type": "address", "name": "newOwner"}], "constant": false, "name": "replaceOwner", "payable": false, "outputs": [], "type": "function"}, {"inputs": [{"type": "uint256", "name": "transactionId"}], "constant": false, "name": "executeTransaction", "payable": false, "outputs": [], "type": "function"}, {"inputs": [], "constant": true, "name": "spentToday", "payable": false, "outputs": [{"type": "uint256", "name": ""}], "type": "function"}, {"inputs": [{"type": "address[]", "name": "_owners"}, {"type": "uint256", "name": "_required"}, {"type": "uint256", "name": "_dailyLimit"}], "type": "constructor"}, {"payable": true, "type": "fallback"}, {"inputs": [{"indexed": false, "type": "uint256", "name": "dailyLimit"}], "type": "event", "name": "DailyLimitChange", "anonymous": false}, {"inputs": [{"indexed": true, "type": "address", "name": "sender"}, {"indexed": true, "type": "uint256", "name": "transactionId"}], "type": "event", "name": "Confirmation", "anonymous": false}, {"inputs": [{"indexed": true, "type": "address", "name": "sender"}, {"indexed": true, "type": "uint256", "name": "transactionId"}], "type": "event", "name": "Revocation", "anonymous": false}, {"inputs": [{"indexed": true, "type": "uint256", "name": "transactionId"}], "type": "event", "name": "Submission", "anonymous": false}, {"inputs": [{"indexed": true, "type": "uint256", "name": "transactionId"}], "type": "event", "name": "Execution", "anonymous": false}, {"inputs": [{"indexed": true, "type": "uint256", "name": "transactionId"}], "type": "event", "name": "ExecutionFailure", "anonymous": false}, {"inputs": [{"indexed": true, "type": "address", "name": "sender"}, {"indexed": false, "type": "uint256", "name": "value"}], "type": "event", "name": "Deposit", "anonymous": false}, {"inputs": [{"indexed": true, "type": "address", "name": "owner"}], "type": "event", "name": "OwnerAddition", "anonymous": false}, {"inputs": [{"indexed": true, "type": "address", "name": "owner"}], "type": "event", "name": "OwnerRemoval", "anonymous": false}, {"inputs": [{"indexed": false, "type": "uint256", "name": "required"}], "type": "event", "name": "RequirementChange", "anonymous": false}];
    abiDecoder.addABI(walletABI);
    const testLogs = [
      {
        data: "0x00000000000000000000000000000000000000000000000000038d7ea4c68000",
        topics: ["0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c", "0x00000000000000000000000005039084cc6f4773291a6ed7dcf5bc3a2e894ff3"],
        address: '0x0457874Bb0a346962128a0C01310d00Fc5bb6a81'
      }
    ];
    const decodedLogs = abiDecoder.decodeLogs(testLogs);
    expect(decodedLogs).to.be.an('array');
    expect(decodedLogs).to.have.length(1);
    expect(decodedLogs[0].name).to.equal('Deposit');
    expect(decodedLogs[0].events).to.have.length(2);
    expect(decodedLogs[0].address).to.equal('0x0457874Bb0a346962128a0C01310d00Fc5bb6a81');
    expect(decodedLogs[0].events[0].name).to.equal('sender');
    expect(decodedLogs[0].events[0].type).to.equal('address');
    expect(decodedLogs[0].events[0].value).to.equal('0x05039084cc6f4773291a6ed7dcf5bc3a2e894ff3');
    expect(decodedLogs[0].events[1].name).to.equal('value');
    expect(decodedLogs[0].events[1].value).to.equal('1000000000000000');
    expect(decodedLogs[0].events[1].type).to.equal('uint256');
  });

  it('remove ABI', () => {
    let methods = abiDecoder.getMethodIDs();
    expect(methods).to.be.an('object');
    expect(Object.keys(methods)).to.have.length.of(42);

    abiDecoder.removeABI(testABI);

    methods = abiDecoder.getMethodIDs();
    expect(methods).to.be.an('object');
    expect(Object.keys(methods)).to.have.length.of(37);
  });

});
