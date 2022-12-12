//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import {IERC20} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol";
import {IAxelarGateway} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "./interface/IWETH.sol";
import "./interface/curve/CSwap.sol";
import "./interface/uniswap/USwap.sol";

contract MessageSender {
    IAxelarGasService immutable gasReceiver;
    IAxelarGateway immutable gateway;
    CSwap immutable curvePools;
    USwap immutable router;
    IWETH immutable weth;
    IERC20 immutable usdc;

    constructor(address _gateway, address _gasReceiver, address _curvePools, address _router, address _weth, address _ausdc) {
        gateway = IAxelarGateway(_gateway);
        gasReceiver = IAxelarGasService(_gasReceiver);
        curvePools = CSwap(_curvePools);
        router = USwap(_router);
        weth = IWETH(_weth);
        usdc = IERC20(_ausdc);
    }

    function getRateExchangeUSDC(int128 i, int128 j, uint256 dx) internal view returns (uint256) {
        return curvePools.get_dy(i,j,dx);
    }

    function ExchangeToken( int128 i, int128 j, uint256 _dx, uint256 _min_dy, address _receiver) internal returns (uint256) {
        uint256 amount = curvePools.exchange(i, j, _dx, _min_dy, _receiver);
        return amount;
    }

    function getPathUniswap(address tokenIn, address tokenOut) internal view returns (address[] memory) {
        address[] memory path;
        if(tokenIn == address(weth) || tokenOut == address(weth)) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = address(weth);
            path[2] = tokenOut;
        }
        return path;
    }

    function getAmountOutUniswap(address tokenIn, address tokenOut,uint256 amount) internal view returns (uint256){
        address[] memory path = getPathUniswap(tokenIn, tokenOut);
        uint256[] memory amountOUT = router.getAmountsOut(amount, path);
        return amountOUT[path.length - 1];
    }

    function swapOnUniswap(address tokenIn, address tokenOut, uint256 amount) internal returns (uint256) {
        address[] memory path = getPathUniswap(tokenIn, tokenOut);
        uint256 amountOut = getAmountOutUniswap(tokenIn, tokenOut, amount);
        uint256[] memory amountOutSwap;
        if(path.length > 2) {
            amountOutSwap = router.swapExactTokensForTokens(amount, amountOut, path, address(this), block.timestamp + 15);
        } else {
            amountOutSwap = router.swapExactETHForTokens{value: amount}(amountOut, path, address(this), block.timestamp + 15);
        }
        return amountOutSwap[path.length - 1];
    }   

    function setPayloads(address sender, address tokenOut) internal view returns (address[] memory) {
        address[] memory payloads;
        payloads = new address[](2);
        payloads[0] = sender;
        payloads[1] = tokenOut;
        return payloads;
    }

    function requestTransfersOut(
        string calldata destinationChain,
        string calldata destinationAddress,
        address tokenIn,
        address tokenOut,
        uint256 amount,
        uint256 amountGas,
        uint256 minAmount
    ) external payable {
        address aUSDC = gateway.tokenAddresses("axlUSDC");
        uint256 amountOut;
        if(tokenIn == address(weth) ) {
            uint256 amountUniswap = swapOnUniswap(tokenIn, address(usdc), amount - amountGas);
            usdc.approve(address(curvePools), amountUniswap);
            amountOut = ExchangeToken(1, 0, amountUniswap, getRateExchangeUSDC(1, 0, amountUniswap), address(this));
            IERC20(aUSDC).approve(address(gateway), amountOut);
        } else if (tokenIn == aUSDC) {
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);
            amountOut = amount;
            IERC20(aUSDC).approve(address(gateway), amountOut);
        } else if (tokenIn == address(usdc)) {
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);
            IERC20(tokenIn).approve(address(curvePools), amount);
            amountOut = ExchangeToken(1, 0, amount, getRateExchangeUSDC(1, 0, amount), address(this));
            IERC20(aUSDC).approve(address(gateway), amountOut);
        } else {
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);
            IERC20(tokenIn).approve(address(router), amount);
            uint256 amountUniswap = swapOnUniswap(tokenIn, address(usdc), amount);
            usdc.approve(address(curvePools), amountUniswap);
            amountOut = ExchangeToken(1, 0, amountUniswap, getRateExchangeUSDC(1, 0, amountUniswap), address(this));
            IERC20(aUSDC).approve(address(gateway), amountOut);
        }

        bytes memory payload = abi.encode(setPayloads(msg.sender, tokenOut), minAmount);
        gasReceiver.payNativeGasForContractCallWithToken{value: amountGas}(address(this), destinationChain, destinationAddress, payload, "axlUSDC", amountOut, msg.sender);            
        gateway.callContractWithToken(destinationChain, destinationAddress, payload, "axlUSDC", amountOut);
    }
}