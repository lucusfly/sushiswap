const Factory = artifacts.require("uniswapv2/UniswapV2Factory.sol");
const Token1 = artifacts.require("Token1.sol");
const Token2 = artifacts.require("Token2.sol");
const Router = artifacts.require("uniswapv2/UniswapV2Router02.sol");
const WETH = artifacts.require("WETH9.sol");
const SushiToken = artifacts.require("SushiToken.sol");
const MasterChef = artifacts.require("MasterChef.sol");

module.exports = async function (deployer, network, addresses) {
  await deployer.deploy(Factory, addresses[0]);

  // factory
  const factory = await Factory.deployed();
  await factory.setFeeTo('0x5160be7E982Ad2DfB945f417357b9ABc4a3b8628');

  let token1Addr, token2Addr;
  if (network == 'mainnet') {
      token1Addr = '';
      token2Addr = '';
  } else {
    await deployer.deploy(Token1);
    await deployer.deploy(Token2);
    const token1 = await Token1.deployed();
    const token2 = await Token2.deployed();
    token1Addr = token1.address;
    token2Addr = token2.address;
  }

  const pair = await factory.createPair(token1Addr, token2Addr);
  console.log("pair address", pair.logs[0].args['2']);
  const pairAddr = pair.logs[0].args['2'];

  // router
  let weth;
  if (network == 'mainnet') {
      weth = await WETH.at('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
  } else if (network == 'ropsten') {
      weth = await WETH.at('0xc778417E063141139Fce010982780140Aa0cD5Ab');
  } else {
      await deployer.deploy(WETH);
      weth = await WETH.deployed();
  }

  await deployer.deploy(Router, factory.address, weth.address);

  // sushi
  await deployer.deploy(SushiToken);
  const sushi = await SushiToken.deployed();

  await deployer.deploy(MasterChef, sushi.address, addresses[0], 100, 100, 1000);
  const chef = await MasterChef.deployed();

  await chef.add('100', pairAddr, true);
};
