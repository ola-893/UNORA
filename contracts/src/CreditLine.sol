// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {AttestationRegistry, DataSourceType, Tier} from "./AttestationRegistry.sol";

/// @notice Test-token demonstration of a credential-controlled borrowing limit.
/// @dev Collateral and loan tokens must have equal decimals and assumed 1:1 unit value.
/// No price feed, liquidation, interest, LP shares, or real-asset risk management.
contract CreditLine is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BASE_LTV_BPS = 5000;
    uint256 public constant BOOSTED_LTV_BPS = 8000;
    AttestationRegistry public immutable registry;
    IERC20 public immutable collateralToken;
    IERC20 public immutable loanToken;
    mapping(address => uint256) public collateralOf;
    mapping(address => uint256) public borrowedOf;
    uint256 public totalCollateral;
    uint256 public totalBorrowed;

    error InvalidConfiguration();
    error ZeroAmount();
    error ExceedsLimit();
    error InsufficientLiquidity();
    error InsufficientCollateral();
    error ExceedsDebt();
    error UnsupportedTokenTransfer();

    event Deposited(address indexed borrower, uint256 amount);
    event Withdrawn(address indexed borrower, uint256 amount);
    event Borrowed(address indexed borrower, uint256 amount);
    event Repaid(address indexed borrower, uint256 amount);
    event RepaidFor(address indexed payer, address indexed borrower, uint256 amount);
    event LiquidityFunded(address indexed funder, uint256 amount);

    constructor(AttestationRegistry registry_, IERC20 collateralToken_, IERC20 loanToken_) {
        if (
            address(registry_).code.length == 0 || address(collateralToken_).code.length == 0
                || address(loanToken_).code.length == 0 || collateralToken_ == loanToken_
        ) revert InvalidConfiguration();
        if (
            IERC20Metadata(address(collateralToken_)).decimals()
                != IERC20Metadata(address(loanToken_)).decimals()
        ) revert InvalidConfiguration();
        registry = registry_;
        collateralToken = collateralToken_;
        loanToken = loanToken_;
    }

    function ltvBps(address user) public view returns (uint256) {
        return registry.isValid(user, DataSourceType.PAYMENT_PROCESSOR_REVENUE, Tier.TIER_2)
            ? BOOSTED_LTV_BPS
            : BASE_LTV_BPS;
    }

    /// @notice Total allowed debt, not the remaining amount available to borrow.
    function maxBorrow(address user) public view returns (uint256) {
        return Math.mulDiv(collateralOf[user], ltvBps(user), 10_000);
    }

    function availableToBorrow(address user) external view returns (uint256) {
        uint256 limit = maxBorrow(user);
        uint256 headroom = limit > borrowedOf[user] ? limit - borrowedOf[user] : 0;
        return Math.min(headroom, loanToken.balanceOf(address(this)));
    }

    /// @notice Demo liquidity contribution; does not create a withdrawable LP position.
    function fundLiquidity(uint256 amount) external nonReentrant {
        _receiveExact(loanToken, amount);
        emit LiquidityFunded(msg.sender, amount);
    }

    function deposit(uint256 amount) external nonReentrant {
        _receiveExact(collateralToken, amount);
        collateralOf[msg.sender] += amount;
        totalCollateral += amount;
        emit Deposited(msg.sender, amount);
    }

    function borrow(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 limit = maxBorrow(msg.sender);
        uint256 debt = borrowedOf[msg.sender];
        if (debt > limit || amount > limit - debt) revert ExceedsLimit();
        if (amount > loanToken.balanceOf(address(this))) revert InsufficientLiquidity();
        borrowedOf[msg.sender] = debt + amount;
        totalBorrowed += amount;
        loanToken.safeTransfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant {
        if (amount > borrowedOf[msg.sender]) revert ExceedsDebt();
        _receiveExact(loanToken, amount);
        borrowedOf[msg.sender] -= amount;
        totalBorrowed -= amount;
        emit Repaid(msg.sender, amount);
    }

    /// @notice Anyone may pay another borrower's debt using the caller's own loan tokens.
    function repayFor(address borrower, uint256 amount) external nonReentrant {
        if (borrower == address(0)) revert InvalidConfiguration();
        if (amount > borrowedOf[borrower]) revert ExceedsDebt();
        _receiveExact(loanToken, amount);
        borrowedOf[borrower] -= amount;
        totalBorrowed -= amount;
        emit Repaid(borrower, amount);
        emit RepaidFor(msg.sender, borrower, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 collateral = collateralOf[msg.sender];
        if (amount > collateral) revert InsufficientCollateral();
        uint256 remaining = collateral - amount;
        if (borrowedOf[msg.sender] > Math.mulDiv(remaining, ltvBps(msg.sender), 10_000)) {
            revert ExceedsLimit();
        }
        collateralOf[msg.sender] = remaining;
        totalCollateral -= amount;
        collateralToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function _receiveExact(IERC20 token, uint256 amount) private {
        if (amount == 0) revert ZeroAmount();
        uint256 beforeBalance = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        if (token.balanceOf(address(this)) != beforeBalance + amount) revert UnsupportedTokenTransfer();
    }
}
