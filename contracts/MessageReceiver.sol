//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import {IERC20} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol";
import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import {AxelarExecutable} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol";
import "./interface/IWETH.sol";
import "./interface/curve/CSwap.sol";
import "./interface/uniswap/USwap.sol";



contract MessageReceiver is AxelarExecutable {
    IAxelarGasService immutable gasReceiver;
    CSwap immutable curvePools;
    USwap immutable router;
    IWETH immutable weth;
    IERC20 immutable usdc;

    constructor(address _gateway, address _gasReceiver, address _curvePools, address _router, address _weth, address _ausdc)
        AxelarExecutable(_gateway)
    {
        gasReceiver = IAxelarGasService(_gasReceiver);
        curvePools = CSwap(_curvePools);
        router = USwap(_router);
        weth = IWETH(_weth);
        usdc = IERC20(_ausdc);
    }

    event Executed();

    function getRateExchangeUSDC(int128 i, int128 j, uint256 dx) internal view returns (uint256) {
        return curvePools.get_dy(i,j,dx);
    }

    function ExchangeToken( int128 i, int128 j, uint256 _dx, uint256 _min_dy, address _receiver) external returns (uint256) {
        uint256 amountOut = curvePools.exchange(i, j, _dx, _min_dy, _receiver);
        return amountOut;
    }

    function receivedAndSwap(address tokenOut, address tokenAddress, address recipient, uint256 requestAmount, uint256 amount) external returns (uint256) {
        uint256 amountOut;
        address[] memory path;

        if(tokenOut == address(usdc)) {
            IERC20(tokenAddress).approve(address(curvePools), amount);
            amountOut = this.ExchangeToken(0, 1, amount, requestAmount, recipient);
        } else if(tokenOut == address(weth)){
            IERC20(tokenAddress).approve(address(curvePools), amount);
            uint256 amountSwap = this.ExchangeToken(0, 1, amount, getRateExchangeUSDC(0, 1, amount), address(this));
            path = new address[](2);
            path[0] = address(usdc);
            path[1] = address(weth);
            usdc.approve(address(router), amountSwap);
            amountOut = router.swapExactTokensForETH(amountSwap, requestAmount, path, recipient, block.timestamp + 15)[path.length - 1];
        } else {
            IERC20(tokenAddress).approve(address(curvePools), amount);
            uint256 amountSwap = this.ExchangeToken(0, 1, amount, getRateExchangeUSDC(0, 1, amount), address(this));
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