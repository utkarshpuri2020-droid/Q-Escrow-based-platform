import hashlib
import json
import time
from typing import Dict, Any, Optional
from web3 import Web3
from app.core.config import settings

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        self.contract_address = settings.ESCROW_CONTRACT_ADDRESS
        self.connected = False
        try:
            self.connected = self.w3.is_connected()
        except Exception:
            self.connected = False

    def is_rpc_available(self) -> bool:
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_blockchain_status(self) -> Dict[str, Any]:
        available = self.is_rpc_available()
        if available:
            try:
                block_number = self.w3.eth.block_number
                chain_id = self.w3.eth.chain_id
                gas_price = self.w3.eth.gas_price
                return {
                    "connected": True,
                    "mode": "REAL_ETHEREUM_NODE",
                    "rpc_url": settings.BLOCKCHAIN_RPC_URL,
                    "chain_id": chain_id,
                    "latest_block": block_number,
                    "gas_price_gwei": round(gas_price / 1e9, 2),
                    "contract_address": self.contract_address,
                }
            except Exception as e:
                pass

        return {
            "connected": False,
            "mode": "LOCAL_DEV_SIMULATOR",
            "rpc_url": settings.BLOCKCHAIN_RPC_URL,
            "chain_id": settings.CHAIN_ID,
            "latest_block": 1042,
            "contract_address": self.contract_address,
            "note": "Using development simulation mode. Start Hardhat node ('npx hardhat node') for live local EVM execution."
        }

    def record_onchain_event(
        self,
        event_name: str,
        escrow_id: str,
        actor_address: str,
        terms_hash: str,
        amount: int
    ) -> Dict[str, Any]:
        """
        Submits transaction to local chain if connected, or records simulation receipt.
        Clearly tags whether transaction was broadcasted to live node or simulated.
        """
        now = time.time()
        tx_data = f"{event_name}:{escrow_id}:{actor_address}:{terms_hash}:{amount}:{now}"
        simulated_hash = "0x" + hashlib.sha256(tx_data.encode("utf-8")).hexdigest()
        
        if self.is_rpc_available():
            try:
                # Live node interaction
                accounts = self.w3.eth.accounts
                if accounts:
                    sender = accounts[0]
                    # We can post a commitment transaction to local dev chain
                    tx_hash = self.w3.eth.send_transaction({
                        "from": sender,
                        "to": sender,
                        "value": 0,
                        "data": self.w3.to_hex(text=f"Q-ESCROW:{event_name}:{escrow_id[:8]}")
                    })
                    receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=5)
                    return {
                        "is_simulated": False,
                        "blockchain_tx_hash": receipt.transactionHash.hex(),
                        "block_number": receipt.blockNumber,
                        "confirmations": 1,
                        "contract_address": self.contract_address,
                        "status": "CONFIRMED_ON_CHAIN"
                    }
            except Exception as e:
                pass  # Fall back to simulation if local call failed

        return {
            "is_simulated": True,
            "blockchain_tx_hash": simulated_hash,
            "block_number": 1000 + int(now) % 10000,
            "confirmations": 12,
            "contract_address": self.contract_address,
            "status": "SIMULATED_DEV_CONFIRMATION",
            "note": "Simulated local transaction commitment. Set up Hardhat node for live EVM broadcasting."
        }

blockchain_service = BlockchainService()
