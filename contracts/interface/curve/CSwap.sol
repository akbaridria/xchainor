// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

interface CSwap {
    function get_dy(
        int128 i,
        int128 j,
        uint256 dx
    ) external view returns (uint256);
    function exchange(
        int128 i,
        int128 j,
        uint256 _dx,
        uint256 _min_dy,
        address _receiver
    ) external payable returns (uint256);
}