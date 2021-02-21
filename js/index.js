import { abi as ethanolVaultABI } from "./abi/EthanolVault.js";
import { abi as gasGainsVaultABI } from "./abi/GasGainsDistribution.js";
import { 
    getCurrentPrice, 
    toFixed,
    formatNumber, 
    walletShortner,
    gasOracle,
    totalSupply,
    lockedEnolTokens,
    unlockedEnolTokens
} from "./helper/index.js";

const EthanolAddress = '0x63D0eEa1D7C0d1e89d7e665708d7e8997C0a9eD6';
const EthnolVaultAddress = '0xf34F69fB72B7B6CCDbdA906Ad58AF1EBfAa76c42';


const GasGainTokenAddress = '0xc58467b855401EF3FF8FdA9216F236e29f0d6277';
const GasGainsDsitributionAddress = "0x0358531350B7e183080C9D713fc4475d835fC249";

const GasifyAddress = "0x02F3A1819851D127bcD6F468253d7A498567eEe0";
const UndgTokenAddress = "0xA5959E9412d27041194c3c3bcBE855faCE2864F7";

const walletAddress = document.querySelector('.walletAddress');
const EthPriceOutput = document.querySelector("#eth-price-output");
const gasOracleOutput = document.querySelector("#gas-oracle-output");
const marketCapOutput = document.querySelector('#market-cap');
const totalTokensOutput = document.querySelector("#total-tokens");

const enolMarketCapOutput = document.querySelector('.enol-market-cap');
const enolTotalSupplyOutput = document.querySelector('.enol-total-supply');
const enolLockedTokenOutput = document.querySelector('.enol-locked-tokens');
const enolRewardsOutput = document.querySelector('.enol-rewarded-tokens');
const enolPriceOutput = document.querySelector('.enol-price');

const gasgMarketCapOutput = document.querySelector('.gasg-market-cap');
const gasgTotalSupplyOutput = document.querySelector('.gasg-total-supply');
const gasgLockedTokenOutput = document.querySelector('.gasg-locked-tokens');
const gasgRewardsOutput = document.querySelector('.gasg-rewarded-tokens');
const gasgPriceOutput = document.querySelector('.gasg-price');

const undgMarketCapOutput = document.querySelector('.undg-market-cap');
const undgTotalSupplyOutput = document.querySelector('.undg-total-supply');
const undgLockedTokenOutput = document.querySelector('.undg-locked-tokens');
const undgRewardsOutput = document.querySelector('.undg-rewarded-tokens');
const undgPriceOutput = document.querySelector('.undg-price');

let web3;
let user;
let ethereum = window.ethereum;
let EthanolVault;
let GasGainsVault;
let EthCurrentPrice = 0;
let gasOraclePrices = {};


window.addEventListener('DOMContentLoaded', async () => {
  await connectDAPP();
})

const loadWeb3 = async () => {
    try {
        await ethereum.enable();

        if(!ethereum) return alert("Non-Ethereum browser detected. You should consider trying Metamask");
        web3 = new Web3(ethereum);
        // Get Network / chainId
        const _chainId = await ethereum.request({ method: 'eth_chainId' });
        if(parseInt(_chainId, 16) !== 1) return alert("Connect wallet to a main network");

        const _accounts = await ethereum.request({ method: 'eth_accounts' });
        user = web3.utils.toChecksumAddress(_accounts[0]);

    } catch (error) {
        console.log(error.message);
        return error.message;
    }       
}

const loadBlockchainData = async () => {
    try {
        EthanolVault = new web3.eth.Contract(ethanolVaultABI, EthnolVaultAddress);
        GasGainsVault = new web3.eth.Contract(gasGainsVaultABI, GasGainsDsitributionAddress);

        const firstAddressPart = walletShortner(user, 0, 4);
        const lastAddressPart = walletShortner(user, 38, 42);
        walletAddress.textContent = `${firstAddressPart}...${lastAddressPart}`;

        await settings();
    } catch (error) {
        console.error(error);
        return error;
    }
}

const connectDAPP = async () => {
    await loadWeb3();
    await loadBlockchainData(); 
}

const settings = async () => {
    try {
        const _gasgTotalSharedRewards = await web3.utils.fromWei(await GasGainsVault.methods.totalSharedRewards().call(), "ether");

        EthCurrentPrice = await (await getCurrentPrice("ethereum")).ethereum.usd;
        gasOraclePrices = await gasOracle();

        EthPriceOutput.textContent = `${toFixed(EthCurrentPrice)}`;
        gasOracleOutput.textContent = `${gasOraclePrices.FastGasPrice} GWEI`;

        const { 
            EthanolTotalSuppy,
            EthanolTotalSuppyFormatted,
            EthanolTotalSuppyUSD,
            EthanolTotalSuppyUSDFormatted,
            enolPrice,

            GasGainsTotalSuppy,
            GasGainsTotalSuppyFormatted,
            GasGainsTotalSuppyUSD,
            GasGainsTotalSuppyUSDFormatted,
            gasgainsPrice,

            UndgTotalSuppy,
            UndgTotalSuppyFormatted,
            UndgTotalSuppyUSD,
            UndgTotalSuppyUSDFormatted,
            undgPrice
        } = await getTokensTotalSupply();

        const { 
            _totalLockedEnol, 
            _totalRewardsShared: _enolTotalRewardsShared 
        } = await lockedEnolTokens(EthanolVault, web3);


        let _lockedGasgTokens = await (await fetch("https://gasgains-node-deploy.herokuapp.com/api/v1/deposit/all")).json();
        _lockedGasgTokens = _lockedGasgTokens.reduce((prev, next) => {
            prev += Number(next.depositAmount);
            return prev;
        }, 0);
        
        const _totalMarketCap = Number(EthanolTotalSuppyUSD) + Number(GasGainsTotalSuppyUSD) + Number(UndgTotalSuppyUSD);
        const _totalTokens = Number(EthanolTotalSuppy) + Number(GasGainsTotalSuppy) + Number(UndgTotalSuppy);

        marketCapOutput.textContent = `$${formatNumber(_totalMarketCap)}`;
        totalTokensOutput.textContent = `${formatNumber(_totalTokens)}`;
        
        enolPriceOutput.textContent = `$${enolPrice}`;
        enolTotalSupplyOutput.textContent = `${EthanolTotalSuppyFormatted} ENOL`;
        enolMarketCapOutput.textContent = `$${EthanolTotalSuppyUSDFormatted}`;
        enolLockedTokenOutput.textContent = `${formatNumber(toFixed(_totalLockedEnol))} ENOL`;
        enolRewardsOutput.textContent = `${formatNumber(toFixed(_enolTotalRewardsShared))} ENOL`;

        gasgPriceOutput.textContent = `$${gasgainsPrice}`;
        gasgTotalSupplyOutput.textContent = `${GasGainsTotalSuppyFormatted} GASG`;
        gasgMarketCapOutput.textContent = `$${GasGainsTotalSuppyUSDFormatted}`;
        gasgLockedTokenOutput.textContent = `${formatNumber(toFixed(_lockedGasgTokens))} GASG`;
        gasgRewardsOutput.textContent = `${formatNumber(toFixed(_gasgTotalSharedRewards))} GASG`;

        undgPriceOutput.textContent = `$${undgPrice}`;
        undgTotalSupplyOutput.textContent = `${UndgTotalSuppyFormatted} UNDG`;
        undgMarketCapOutput.textContent = `$${UndgTotalSuppyUSDFormatted}`;
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
}


const getTokensTotalSupply = async () => {
    try {
        const _enolPrice = await (await getCurrentPrice("ethanol")).ethanol.usd;
        const _gasgainsPrice = await (await getCurrentPrice("gasgains")).gasgains.usd;
        const _undgPrice = await (await getCurrentPrice("unidexgas")).unidexgas.usd;

        const _EthanolTotalSuppy = await (await totalSupply(web3.utils.toChecksumAddress(EthanolAddress))).result;
        const _EthanolTotalSuppyUSD = web3.utils.fromWei(_EthanolTotalSuppy.toString(), "ether") * _enolPrice;

        const _GasGainsTotalSuppy = await (await totalSupply(web3.utils.toChecksumAddress(GasGainTokenAddress))).result;
        const _GasGainsTotalSuppyUSD = web3.utils.fromWei(_GasGainsTotalSuppy.toString(), "ether") * _gasgainsPrice;

        const _UndgTotalSuppy = await (await totalSupply(web3.utils.toChecksumAddress(UndgTokenAddress))).result;
        const _UndgTotalSuppyUSD = web3.utils.fromWei(_UndgTotalSuppy.toString(), "ether") * _undgPrice;

        return {
            EthanolTotalSuppy: web3.utils.fromWei(_EthanolTotalSuppy, "ether"),
            EthanolTotalSuppyFormatted: formatNumber(web3.utils.fromWei(_EthanolTotalSuppy, "ether")),
            EthanolTotalSuppyUSD: _EthanolTotalSuppyUSD,
            EthanolTotalSuppyUSDFormatted: formatNumber(_EthanolTotalSuppyUSD),
            enolPrice: _enolPrice,

            GasGainsTotalSuppy: web3.utils.fromWei(_GasGainsTotalSuppy.toString(), "ether"),
            GasGainsTotalSuppyFormatted: formatNumber(web3.utils.fromWei(_GasGainsTotalSuppy.toString(), "ether")),
            GasGainsTotalSuppyUSD: _GasGainsTotalSuppyUSD,
            GasGainsTotalSuppyUSDFormatted: formatNumber(_GasGainsTotalSuppyUSD),
            gasgainsPrice: _gasgainsPrice,

            UndgTotalSuppy: web3.utils.fromWei(_UndgTotalSuppy.toString(), "ether"),
            UndgTotalSuppyFormatted: formatNumber(web3.utils.fromWei(_UndgTotalSuppy.toString(), "ether")),
            UndgTotalSuppyUSD: _UndgTotalSuppyUSD,
            UndgTotalSuppyUSDFormatted: formatNumber(_UndgTotalSuppyUSD),
            undgPrice: _undgPrice
        }
    } catch (error) {  
        console.log(error);
        return error;
    }
}