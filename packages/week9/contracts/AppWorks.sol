// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.16;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol';

contract AppWorks is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
	using StringsUpgradeable for uint256;

	using CountersUpgradeable for CountersUpgradeable.Counter;
	CountersUpgradeable.Counter private _nextTokenId;

	uint256 public price;
	uint256 public maxSupply;

	bool public mintActive;
	bool public earlyMintActive;
	bool public revealed;

	string public baseURI;
	bytes32 public merkleRoot;

	mapping(uint256 => string) private _tokenURIs;
	mapping(address => uint256) public addressMintedBalance;

	// Set mint per user limit to 10 and owner limit to 20 - Week 8
	uint256 public mintNumberPerUser;
	uint256 public mintNumberPerOwner;

	// constructor() ERC721('AppWorks', 'AW') Ownable() {}

	function initialize() public initializer {
		__ERC721_init('AppWorks', 'AW');
		__Ownable_init();
		__UUPSUpgradeable_init();

		__init();
	}

	function __init() internal initializer {
		price = 0.01 ether;
		mintActive = false;
		earlyMintActive = false;
		revealed = false;
		maxSupply = 100;
		mintNumberPerUser = 10;
		mintNumberPerOwner = 20;
	}

	function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

	// Public mint function - week 8
	function mint(uint256 _mintAmount) public payable {
		//Please make sure you check the following things:
		//Current state is available for Public Mint
		require(mintActive, 'Inactive Mint');
		//Check how many NFTs are available to be minted
		uint256 mintCount = addressMintedBalance[msg.sender];
		uint256 mintNumber = owner() == msg.sender ? mintNumberPerOwner : mintNumberPerUser;
		require(mintCount + _mintAmount <= mintNumber, 'Excess maximun number of mint');

		// Check non-zero mint
		require(_mintAmount > 0, 'Zero mint');

		// Check maxSupply
		uint256 currentIndex = _nextTokenId.current();
		require(_mintAmount + currentIndex <= maxSupply, 'Excess maximun supply');

		//Check user has sufficient funds
		require(_mintAmount * price == msg.value, 'Not match ETH with price');

		// Start mint
		addressMintedBalance[msg.sender] = addressMintedBalance[msg.sender] + _mintAmount;

		for (uint256 i = 1; i <= _mintAmount; i++) {
			_nextTokenId.increment();
			_safeMint(msg.sender, currentIndex + i);
		}
	}

	// Implement totalSupply() Function to return current total NFT being minted - week 8
	function totalSupply() external view returns (uint256) {
		return _nextTokenId.current();
	}

	// Implement withdrawBalance() Function to withdraw funds from the contract - week 8
	function withdrawBalance() external onlyOwner {
		(bool success, ) = payable(owner()).call{ value: address(this).balance }('');

		require(success, 'Failed to withdraw balance');
	}

	// Implement setPrice(price) Function to set the mint price - week 8
	function setPrice(uint256 _price) external onlyOwner {
		price = _price;
	}

	// Implement toggleMint() Function to toggle the public mint available or not - week 8
	function toggleMint() external onlyOwner {
		mintActive = !mintActive;
	}

	// Implement toggleReveal() Function to toggle the blind box is revealed - week 9

	// Implement setBaseURI(newBaseURI) Function to set BaseURI - week 9

	// Function to return the base URI
	function _baseURI() internal view virtual override returns (string memory) {
		return baseURI;
	}

	// Early mint function for people on the whitelist - week 9
	function earlyMint(bytes32[] calldata _merkleProof, uint256 _mintAmount) public payable {
		//Please make sure you check the following things:
		//Current state is available for Early Mint
		//Check how many NFTs are available to be minted
		//Check user is in the whitelist - use merkle tree to validate
		//Check user has sufficient funds
	}

	// Implement toggleEarlyMint() Function to toggle the early mint available or not - week 9

	// Implement setMerkleRoot(merkleRoot) Function to set new merkle root - week 9

	// Let this contract can be upgradable, using openzepplin proxy library - week 10
	// Try to modify blind box images by using proxy
}
