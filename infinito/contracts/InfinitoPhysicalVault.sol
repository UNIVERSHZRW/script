// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title INFINITO - depósito para piezas físicas cargadas
/// @notice Prototipo. El código secreto se verifica fuera de cadena antes de emitir un voucher.
/// @dev La firma vincula serie, receptor y caducidad. El canje se registra una sola vez.
contract InfinitoPhysicalVault is EIP712, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Coin {
        uint256 amount;
        bool redeemed;
    }

    bytes32 public constant REDEEM_TYPEHASH =
        keccak256("Redeem(bytes32 coinId,address recipient,uint256 deadline)");

    IERC20 public immutable token;
    address public voucherSigner;
    uint256 public totalLocked;
    mapping(bytes32 => Coin) public coins;

    event CoinFunded(bytes32 indexed coinId, uint256 amount);
    event CoinRedeemed(bytes32 indexed coinId, address indexed recipient, uint256 amount);
    event VoucherSignerUpdated(address indexed oldSigner, address indexed newSigner);

    error InvalidAddress();
    error InvalidAmount();
    error CoinExists();
    error CoinUnavailable();
    error VoucherExpired();
    error InvalidVoucher();
    error UnsupportedTokenBehavior();

    constructor(address token_, address signer_, address owner_)
        EIP712("INFINITO Physical Coin", "1")
        Ownable(owner_)
    {
        if (token_ == address(0) || signer_ == address(0) || owner_ == address(0)) {
            revert InvalidAddress();
        }
        token = IERC20(token_);
        voucherSigner = signer_;
        emit VoucherSignerUpdated(address(0), signer_);
    }

    /// @notice Deposita fondos reales ANTES de registrar la pieza. Un ID solo se registra una vez.
    /// @dev El propietario debe aprobar la transferencia por amount previamente.
    function fundCoin(bytes32 coinId, uint256 amount) external onlyOwner nonReentrant {
        if (coinId == bytes32(0)) revert CoinUnavailable();
        if (amount == 0) revert InvalidAmount();
        if (coins[coinId].amount != 0) revert CoinExists();

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        if (token.balanceOf(address(this)) - balanceBefore != amount) {
            revert UnsupportedTokenBehavior();
        }

        coins[coinId] = Coin({amount: amount, redeemed: false});
        totalLocked += amount;
        emit CoinFunded(coinId, amount);
    }

    /// @notice Cambia el firmante (idealmente multisig EIP-1271).
    function setVoucherSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidAddress();
        address previous = voucherSigner;
        voucherSigner = newSigner;
        emit VoucherSignerUpdated(previous, newSigner);
    }

    function redeemDigest(bytes32 coinId, address recipient, uint256 deadline)
        public
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(
            abi.encode(REDEEM_TYPEHASH, coinId, recipient, deadline)
        );
        return _hashTypedDataV4(structHash);
    }

    /// @notice Cualquier remitente puede presentar el voucher, pero el receptor está firmado.
    /// @dev No se puede desviar el pago a un receptor distinto ni repetir el mismo coinId.
    function redeem(
        bytes32 coinId,
        address recipient,
        uint256 deadline,
        bytes calldata voucher
    ) external nonReentrant {
        Coin storage coin = coins[coinId];
        if (coin.amount == 0 || coin.redeemed) revert CoinUnavailable();
        if (recipient == address(0)) revert InvalidAddress();
        if (block.timestamp > deadline) revert VoucherExpired();
        if (!SignatureChecker.isValidSignatureNow(
            voucherSigner, redeemDigest(coinId, recipient, deadline), voucher
        )) revert InvalidVoucher();

        uint256 amount = coin.amount;
        coin.redeemed = true;
        totalLocked -= amount;
        token.safeTransfer(recipient, amount);
        emit CoinRedeemed(coinId, recipient, amount);
    }
}
