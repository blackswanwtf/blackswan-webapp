// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title WeeklyExclusiveNFT Contract
 * @dev UUPS upgradeable ERC721 contract built on the ERC721Upgradeable contract from OpenZeppelin where:
 * - Each wallet can only mint one NFT
 * - NFTs are soulbound tokens and cannot be transferred (except the burn address)
 * - Contract is upgradeable using UUPS pattern for future upgrades
 */
contract WeeklyExclusiveNFT is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Mapping to track if a wallet has already minted
    mapping(address => bool) public hasMinted;

    // Counter for token IDs
    uint256 private _nextTokenId;

    // Maximum supply limit
    uint256 public maxSupply;

    // Base URI for metadata
    string private _baseTokenURI;

    // Burn address (0x000...dead)
    address public constant BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTBurned(address indexed from, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param _name Name of the NFT collection
     * @param _symbol Symbol of the NFT collection
     * @param _initialBaseURI Initial base URI for metadata
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _initialBaseURI
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _baseTokenURI = _initialBaseURI;
        _nextTokenId = 1; // Start token IDs from 1
        maxSupply = 1000; // Set initial max supply to 1000
    }

    /**
     * @dev Mint an NFT to the caller
     * Requirements:
     * - Contract must not be paused
     * - Caller must not have already minted
     * - Caller cannot be the zero address
     * - Total supply must not exceed max supply
     */
    function mint() external whenNotPaused nonReentrant {
        address to = msg.sender;

        require(to != address(0), "Cannot mint to zero address");
        require(!hasMinted[to], "Already minted");
        require(_nextTokenId <= maxSupply, "Max supply reached");

        uint256 tokenId = _nextTokenId++;
        hasMinted[to] = true;

        _safeMint(to, tokenId);

        emit NFTMinted(to, tokenId);
    }

    /**
     * @dev Burn an NFT by sending it to the burn address
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) external {
        require(
            _isAuthorized(_ownerOf(tokenId), msg.sender, tokenId),
            "Not authorized to burn"
        );

        address from = _ownerOf(tokenId);

        // Transfer to burn address instead of actually burning
        _transfer(from, BURN_ADDRESS, tokenId);

        emit NFTBurned(from, tokenId);
    }

    /**
     * @dev Override transfer functions to prevent transfers (except to burn address)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from zero address)
        if (from == address(0)) {
            return super._update(to, tokenId, auth);
        }

        // Allow burning (to burn address)
        if (to == BURN_ADDRESS) {
            return super._update(to, tokenId, auth);
        }

        // Prevent all other transfers
        revert("Transfers not allowed");
    }

    /**
     * @dev Override approve to prevent approvals (since transfers aren't allowed)
     */
    function approve(address, uint256) public pure override {
        revert("Approvals not allowed");
    }

    /**
     * @dev Override setApprovalForAll to prevent approvals
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("Approvals not allowed");
    }

    /**
     * @dev Override getApproved to always return zero address
     */
    function getApproved(uint256) public pure override returns (address) {
        return address(0);
    }

    /**
     * @dev Override isApprovedForAll to always return false
     */
    function isApprovedForAll(
        address,
        address
    ) public pure override returns (bool) {
        return false;
    }

    /**
     * @dev Returns the base URI for tokens
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Update the base URI (only owner)
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Get the total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Update the maximum supply (only owner)
     * @param _maxSupply New maximum supply
     */
    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(
            _maxSupply >= totalSupply(),
            "Max supply cannot be less than current supply"
        );
        maxSupply = _maxSupply;
        emit MaxSupplyUpdated(_maxSupply);
    }

    /**
     * @dev Check if an address has minted
     * @param account Address to check
     */
    function hasAccountMinted(address account) external view returns (bool) {
        return hasMinted[account];
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @dev Emergency function to update minting status (only owner)
     * This can be useful if you need to reset someone's minting status
     * @param account Address to update
     * @param status New minting status
     */
    function setMintingStatus(address account, bool status) external onlyOwner {
        hasMinted[account] = status;
    }

    /**
     * @dev Override tokenURI to return the same metadata for all tokens
     * @param tokenId The token ID (existence is checked but value is ignored)
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "URI query for nonexistent token"
        );
        return _baseTokenURI;
    }

    /**
     * @dev Get contract version for upgrades
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
