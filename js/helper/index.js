const etherscanApiKey = '7QEMXYNDAD5WT7RTA5TQUCJ5NIA99CSYVI ';

const toFixed = _amount => Number(_amount).toFixed(2);

const formatNumber = _amount => new Intl.NumberFormat('en', { maximumSignificantDigits: 3 }).format(Number(_amount));

const walletShortner = (_data, _start, _end) => {
    let result = '';
    for(let i = _start;  i < _end; i++) result = [...result, _data[i]];
    return result.join('');
}

const balanceOf = async (_token, _account) => {
    const _user = _account ? _account : user;
    return await _token.methods.balanceOf(_user).call();
}

const getCurrentPrice= async (token) => {
    try {
        const result = await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=USD`)).json();
        return result;
    } catch (error) {
        return error;
    }
}

const gasOracle = async () => {
    try {
        const _data = await (await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanApiKey}`)).json();
        return _data.result;
    } catch (error) {
        return error;
    }
}

const totalSupply = async _tokenAddress => {
    try {
        const result = await (await fetch(`https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${_tokenAddress}&apikey=${etherscanApiKey}`)).json();
        return result;
    } catch (error) {
        return error;
    }
}

const lockedEnolTokens = async (_contract, web3) => {
    try {
        const  { _totalUnLockedEnol } = await unlockedEnolTokens(_contract, web3);
        let _totalRewardsShared = await _contract.methods.totalSharedRewards().call();

        let result = await _contract.getPastEvents('_LockSavings', { fromBlock: 0, toBlock: "latest" });
        result = result.map(item => {
            const _response = item.returnValues;
            return {
                stake: web3.utils.fromWei(_response.stake, 'ether'),
                stakeholder: web3.utils.toChecksumAddress(_response.stakeholder),
                unlockTime: _response.unlockTime
            }
        });


        let _lockedTokens = result.reduce((prev, next) => {
            prev += Number(next.stake);
            return prev;
        }, 0);
        _lockedTokens = Number(_lockedTokens) - Number(_totalUnLockedEnol);
        _totalRewardsShared = web3.utils.fromWei(_totalRewardsShared, 'ether');
        
        return { 
            result, 
            _totalRewardsShared,
            _totalLockedEnol: _lockedTokens, 
        }
    } catch (error) {
        console.log(error);
        return error;
    }
}


const unlockedEnolTokens = async (_contract, web3) => {
    try {
        const _latestBlock = await web3.eth.getBlockNumber();
        let result = await _contract.getPastEvents('_UnLockSavings', { fromBlock: 0, toBlock: _latestBlock });
        result = result.map(item => {
            const _response = item.returnValues;
            return {
                value: web3.utils.fromWei(_response.value, 'ether'),
                stakeholder: web3.utils.toChecksumAddress(_response.stakeholder),
                unlockTime: _response.unlockTime
            }
        });

        const _unlockedTokens = result.reduce((prev, next) => {
            prev += Number(next.value);
            return prev;
        }, 0)
        return { _totalUnLockedEnol: _unlockedTokens }
    } catch (error) {
        console.log(error);
        return error;
    }
}


export { 
    toFixed, 
    formatNumber,
    walletShortner,
    getCurrentPrice,
    balanceOf,
    gasOracle,
    totalSupply,
    lockedEnolTokens,
    unlockedEnolTokens
}