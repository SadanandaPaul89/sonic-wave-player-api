// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title SonicWave Music NFT Contract
 * @dev ERC721 contract for music NFTs with IPFS metadata and royalty support
 */
contract SonicWaveMusicNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, IERC2981 {
    using Strings for uint256;
    
    struct MusicNFT {
        string ipfsHash;           // IPFS hash of metadata
        address artist;            // Original creator
        uint256 royaltyPercentage; // Royalty percentage (basis points)
        uint256 mintedAt;          // Timestamp
        bool isExclusive;          // Exclusive content flag
        uint256 maxSupply;         // For limited editions
        uint256 currentSupply;     // Current minted amount
    }
    
    mapping(uint256 => MusicNFT) public musicNFTs;
    mapping(address => bool) public authorizedMinters;
    mapping(uint256 => mapping(address => bool)) public accessRights;
    
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_ROYALTY = 1000; // 10%
    
    event MusicNFTMinted(
        uint256 indexed tokenId,
        address indexed artist,
        address indexed owner,
        string ipfsHash
    );
    
    event AccessGranted(uint256 indexed tokenId, address indexed user);
    event AccessRevoked(uint256 indexed tokenId, address indexed user);
    
    constructor() ERC721("SonicWave Music NFT", "SWNFT") {}
    
    /**
     * @dev Mint a new music NFT
     */
    function mintMusicNFT(
        address to,
        string memory ipfsHash,
        address artist,
        uint256 royaltyPercentage,
        bool isExclusive,
        uint256 maxSupply
    ) public onlyAuthorizedMinter returns (uint256) {
        require(royaltyPercentage <= MAX_ROYALTY, "Royalty too high");
        require(maxSupply > 0, "Max supply must be positive");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        musicNFTs[tokenId] = MusicNFT({
            ipfsHash: ipfsHash,
            artist: artist,
            royaltyPercentage: royaltyPercentage,
            mintedAt: block.timestamp,
            isExclusive: isExclusive,
            maxSupply: maxSupply,
            currentSupply: 1
        });
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsHash)));
        
        emit MusicNFTMinted(tokenId, artist, to, ipfsHash);
        return tokenId;
    }
    
    /**
     * @dev Grant access to exclusive content
     */
    function grantAccess(uint256 tokenId, address user) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        accessRights[tokenId][user] = true;
        emit AccessGranted(tokenId, user);
    }
    
    /**
     * @dev Revoke access to exclusive content
     */
    function revokeAccess(uint256 tokenId, address user) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        accessRights[tokenId][user] = false;
        emit AccessRevoked(tokenId, user);
    }
    
    /**
     * @dev Check if user has access to exclusive content
     */
    function hasAccess(uint256 tokenId, address user) public view returns (bool) {
        return ownerOf(tokenId) == user || accessRights[tokenId][user];
    }
    
    /**
     * @dev Add authorized minter
     */
    function addAuthorizedMinter(address minter) public onlyOwner {
        authorizedMinters[minter] = true;
    }
    
    /**
     * @dev Remove authorized minter
     */
    function removeAuthorizedMinter(address minter) public onlyOwner {
        authorizedMinters[minter] = false;
    }
    
    /**
     * @dev EIP-2981 Royalty Standard implementation
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        MusicNFT memory nft = musicNFTs[tokenId];
        receiver = nft.artist;
        royaltyAmount = (salePrice * nft.royaltyPercentage) / 10000;
    }
    
    /**
     * @dev Get music NFT details
     */
    function getMusicNFT(uint256 tokenId) public view returns (MusicNFT memory) {
        require(_exists(tokenId), "Token does not exist");
        return musicNFTs[tokenId];
    }
    
    /**
     * @dev Get total supply of tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override required by Solidity
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Override required by Solidity
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
}