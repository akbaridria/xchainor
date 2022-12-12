//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import {IERC20} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol";
import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import {AxelarExecutable} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol";
import "./interface/IWETH.sol";
import "./interface/curve/CSwap.sol";
import "./interface/uniswap/USwap.sol";
import "./interface/stellarswap/STwap.sol";


contract MessageReceiver is AxelarExecutable {
    IAxelarGasService immutable gasReceiver;
    STwap immutable curvePools;
    USwap immutable router;
    IWETH immutable weth;
    IERC20 immutable usdc;


    constructor(address _gateway, address _gasReceiver, address _curvePools, address _router, address _weth, address _ausdc)
        AxelarExecutable(_gateway)
    {
        gasReceiver = IAxelarGasService(_gasReceiver);
        curvePools = STwap(_curvePools);
        router = USwap(_router);
        weth = IWETH(_weth);
        usdc = IERC20(_ausdc);
    }

    event Executed();

    function getRateExchangeUSDC( address pool, address basePool, uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx) external view returns (uint256) {
        return curvePools.calculateSwapToBase(pool,basePool,tokenIndexFrom,tokenIndexTo, dx);
    }

    function ExchangeToken( address pool, address basePool, uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx, uint256 minDy, uint256 deadline) external returns (uint256) {
        uint256 amount = curvePools.swapToBase(pool, basePool, tokenIndexFrom, tokenIndexTo, dx, minDy, deadline );
        return amount;
    }

    function receivedAndSwap(address tokenOut, address tokenAddress, address recipient, uint256 requestAmount, uint256 amount) external returns (uint256) {
        uint256 amountOut;
        address[] memory path;
        address basePool = 0xB1BC9f56103175193519Ae1540A0A4572b1566F6;
        
        if(tokenOut == address(usdc)) {
            IERC20(tokenAddress).approve(address(curvePools), amount);
            amountOut = this.ExchangeToken(address(curvePools), basePool, 0, 0, amount, requestAmount, block.timestamp);
            IERC20(address(usdc)).transfer(recipient, amountOut);
        } else if(tokenOut == address(weth)){
            IERC20(tokenAddress).approve(address(curvePools), amount); 
            uint256 estimatedAmount = this.getRateExchangeUSDC(address(curvePools), basePool, 0, 0, amount);
            uint256 amountSwap = this.ExchangeToken(address(curvePools), basePool, 0, 0, amount, estimatedAmount, block.timestamp);
            path = new address[](2);
            path[0] = address(usdc);
            path[1] = address(weth);
            usdc.approve(address(router), amountSwap);
            amountOut = router.swapExactTokensForETH(amountSwap, requestAmount, path, recipient, block.timestamp + 15)[path.length - 1];
        } else {
            IERC20(tokenAddress).approve(address(curvePools), amount);
            uint256 estimatedAmount = this.getRateExchangeUSDC(address(curvePools), basePool, 0, 0, amount);
            uint256 amountSwap = this.ExchangeToken(address(curvePools), basePool, 0, 0, amount, estimatedAmount, block.timestamp);
            path = new address[](3);
            path[0] = address(usdc);
            path[1] = address(weth);
            path[2] = tokenOut;
            usdc.approve(address(router), amountSwap);
            amountOut = router.swapExactTokensForTokens(amountSwap, requestAmount, path, recipient, block.timestamp + 15)[path.length - 1];
        }

        return amountOut;
    }

    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        (address[] memory payloads, uint256 requestAmount) = abi.decode(payload, (address[], uint256));
        address recipient = payloads[0];
        address tokenOut = payloads[1];
        address tokenAddress = gateway.tokenAddresses("axlUSDC");
        
        if(tokenOut == tokenAddress) {
            IERC20(tokenAddress).transfer(recipient, amount);
        } else {
            try this.receivedAndSwap(tokenOut,tokenAddress, recipient, requestAmount, amount) returns (uint256 amountOut) {
                require(amountOut >= requestAmount);
            } catch  {
                IERC20(tokenAddress).transfer(recipient, amount);
            }
        }
        emit Executed();
    }
}